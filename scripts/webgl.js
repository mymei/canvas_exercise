webglEngine = (function() {

	function createShaderObject(gl, shaderType, source) {
		var shader = gl.createShader(shaderType);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			throw gl.getShaderInfoLog(shader);
		}
		return shader
	}
	function createProgramObject(gl, vs, fs) {
		var program = gl.createProgram();
		gl.attachShader(program, vs);
		gl.attachShader(program, fs);
		gl.linkProgram(program);
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			throw gl.getProgramInfoLog(program);
		}
		return program;
	}
	function createFloatBuffer(gl, data) {
		var buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
		return buffer;
	}
	function createIndexBuffer(gl, data) {
		var buffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data), gl.STATIC_DRAW);
		return buffer;
	}
	function setSkelPose(gl, prgmObj, skeleton) {
		if (prgmObj.uniform.uBoneTransform) {
			var trm_array = [];
			$.each(skeleton.joints, function(k, v){ trm_array.push(skeleton.getJointTransform(k)); });
			var trm = new Float32Array(trm_array.length * 16);
			$.each(trm_array, function(k, v){trm.set(v, k * 16)});
			gl.uniformMatrix4fv(prgmObj.uniform.uBoneTransform.loc,false,trm);
		}
	}
	function setModelView(gl, prgmObj, mat) {
		if (prgmObj.uniform.uModelView) {
			gl.uniformMatrix4fv(prgmObj.uniform.uModelView.loc,false,mat);
		}
		if (prgmObj.uniform.uNormalMatrix) {
			gl.uniformMatrix3fv(prgmObj.uniform.uNormalMatrix.loc,false,mat4.toMat3(mat));
		}
	}
	function setProjection(gl, prgm, fov, aspect, near, far) {
		var projMatrix = mat4.create();
		mat4.perspective(fov, aspect, near, far, projMatrix);
		gl.uniformMatrix4fv(gl.getUniformLocation(prgm, "uProjection"),false,projMatrix);
		return projMatrix;
	}

	function createGRI(geometry) {
		var mesh = geometry.meshes[0];
		var GRI = {vbs:{}, elm:[], uniforms:{}}
		if (geometry.skinJoints) {
			GRI.uniforms.uBindPose = geometry.skinJoints.bindPose;
			var trm2 = new Float32Array(geometry.skinJoints.joints.length * 16);
			$.each(geometry.skinJoints.joints,function(k, v){trm2.set(v.bind, k * 16)});
			GRI.uniforms.uBoneBind = trm2;
		}
		GRI.vbs = {};
		GRI.elm = mesh.polygons.map(function(p){
			var bufferKey = mesh.meshData.getBufferKey(p.inputs);
			if (!GRI.vbs[bufferKey]) {
				var buffer = mesh.meshData.getBuffer(p.inputs);
				GRI.vbs[bufferKey] = {
					buffer:createFloatBuffer(gl, buffer.getFloatArray()), 
					skinBuffer:geometry.skinWeights && createFloatBuffer(gl, buffer.getSkinFloatArray(geometry.skinWeights)), 
					size:buffer.stride*4};
			}
			return {bufferKey:bufferKey, inputs:p.inputs.map(function(x){return{semantic:x.semantic, size:x.source.stride};}), ibo:createIndexBuffer(gl, p.indices), num:p.indices.length};
		});
		return GRI;
	}

	function parseColladaAsset(gl, xml, scale) {
		var geometry = {}, GRI = {};
		$("geometry", xml).each(function(){
			var name = this.getAttribute('id');
			geometry[name] = new Geometry(this);
		})
		$("library_controllers controller skin", xml).each(function(){
			var skin_geometry = geometry[this.getAttribute('source').slice(1)];
			if (skin_geometry) {
				skin_geometry.skinJoints = new SkinJoints(this);
				skin_geometry.skinWeights = new SkinWeights(this);
			}
			var cloned = JSON.parse(JSON.stringify(skin_geometry));
			cloned = finalize(cloned);
			geometry[this.getAttribute('source').slice(1)] = cloned;
		});
		$.each(geometry, function(k, geom) {
			GRI[k] = createGRI(geom);
		})

		return {geometry:geometry, GRI:GRI, skeleton:new Skeleton(xml)};
	}

	var programObjCache = {};
	function getProgram(gl, vs_url, ps_url) {
		var key = vs_url+'|'+ps_url, programObj = programObjCache[key];
		if (!programObj) {
			var vs_source = null,
			fs_source = null;
			$.ajax({
				async: false,
				url: vs_url,
				success: function (data) {
					vs_source = $(data).html();
				},
				dataType: 'html'
			});

			$.ajax({
				async: false,
				url: ps_url,
				success: function (data) {
					fs_source = $(data).html();
				},
				dataType: 'html'
			});

			var vshader = createShaderObject(gl, gl.VERTEX_SHADER, vs_source),
			fshader = createShaderObject(gl, gl.FRAGMENT_SHADER, fs_source);

			var program = createProgramObject(gl, vshader, fshader);
			gl.useProgram(program);
			var attribute = {}
			var pattern = /attribute\s+(\w+)\s+(\w+)\s*;/g;
			do {
				var test = pattern.exec(vs_source);
				if (test) {
					attribute[test[2]] = {type:test[1], loc:gl.getAttribLocation(program, test[2])};
				}
			} while(test);
			var uniform = {}
			var pattern = /uniform\s+(\w+)\s+(\w+)\s*(\[\s*.+\s*\])*\s*;/g;
			do {
				var test = pattern.exec(vs_source);
				if (test) {
					uniform[test[2]] = {type:test[1], loc:gl.getUniformLocation(program, test[2])};
				}
			} while(test);
			programObj = programObjCache[key] = {program:program, attribute:attribute, uniform:uniform};
		}
		return programObj;
	}

	function createAsset(gl, url, scale) {
		var asset;
		// $.ajax({async:false, url:url,success:function(data){asset = parseColladaAsset(gl, data, scale);},dataType:'xml'});
		$.ajax({async:false, url:url,success:function(data){
			asset = new Asset(data);
		},dataType:'xml'});
		return asset;
	}

	var currentProgramObj;
	function initProgram(gl, vs_url, ps_url) {
		var programObj = getProgram(gl, vs_url, ps_url);
		if (currentProgramObj != programObj) {
			currentProgramObj = programObj;
			gl.useProgram(programObj.program);
			$.each(programObj.attribute, function(k, v) {
				gl.enableVertexAttribArray(v.loc);
			})
			return true;
		}
		return false;
	}

	return {
		setModelView : setModelView,
		setProjection : setProjection,
		setSkelPose : setSkelPose,
		createGRI : createGRI,
		initProgram : initProgram,
		getCurrentProgramObj : function() { return currentProgramObj; }
	}
})();

function DrawingElement(vs_url, ps_url) {
	this.vs_url = vs_url;
	this.ps_url = ps_url;
}

DrawingElement.prototype.initAsset = function(url) {
	var self = this;
	$.ajax({async:false, url:url,success:function(data){
		self.asset = new Asset(data);
	},dataType:'xml'});
}

DrawingElement.prototype.initPackedAsset = function(url) {
	var self = this;
	$.ajax({async:false, url:url, dataType:'text', success:function(data){
		self.asset = finalize(MessagePack.unpack(data));
	}});
}

DrawingElement.prototype.initGRI = function(gl) {
	var self = this;
	if (self.asset && !self.asset.GRI) {
		self.asset.GRI = {};
		$.each(self.asset.geometry, function(k, geom) {
			self.asset.GRI[k] = webglEngine.createGRI(geom);
		})
	}
}

DrawingElement.prototype.init = function(gl) {
	return webglEngine.initProgram(gl, this.vs_url, this.ps_url);
}

DrawingElement.prototype.draw = function(gl) {
	var programObj = webglEngine.getCurrentProgramObj();
	if (this.asset && programObj) {
		var asset = this.asset;
		this.initGRI(gl);
		$.each(asset.GRI, function(k, v) {
			$.each(v.uniforms, function(name, value) {
				if (programObj.uniform[name]) {
					switch(programObj.uniform[name].type) {
						case 'mat4' :
						gl.uniformMatrix4fv(programObj.uniform[name].loc, false, value);
						break;
					}
				}
			});
			var map = {VERTEX:'aVertex',NORMAL:'aNormal',TEXCOORD:'aTexCoord'};
			v.elm.forEach(function(p) {
				if (v.vbs[p.bufferKey].skinBuffer) {
					if (programObj.attribute.aBoneIndices && programObj.attribute.aBoneWeights) {
						gl.bindBuffer(gl.ARRAY_BUFFER, v.vbs[p.bufferKey].skinBuffer);
						gl.vertexAttribPointer(programObj.attribute.aBoneIndices.loc, 4, gl.FLOAT, false, 32, 0);
						gl.vertexAttribPointer(programObj.attribute.aBoneWeights.loc, 4, gl.FLOAT, false, 32, 16);
					}
				}
				if (v.vbs[p.bufferKey].buffer) {
					gl.bindBuffer(gl.ARRAY_BUFFER, v.vbs[p.bufferKey].buffer);
					var offset = 0;
					p.inputs.forEach(function(input) {
						if (programObj.attribute[map[input.semantic]])
							gl.vertexAttribPointer(programObj.attribute[map[input.semantic]].loc, input.size, gl.FLOAT, false, v.vbs[p.bufferKey].size, offset);
						offset += input.size * 4;
					});
				}
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, p.ibo);
				gl.drawElements(gl.TRIANGLES, p.num, gl.UNSIGNED_SHORT, 0);
			})
		})
	}
}


function Transform(pos, rot, scale) {
	this.pos = pos;
	this.rot = rot;
	this.scale = scale;
}

function getTransform(pos, rot, scale) {
	var mvMatrix = mat4.identity(mat4.create());
	mat4.translate(mvMatrix, pos);
	mat4.rotate(mvMatrix, rot[0], rot.slice(1));
	mat4.scale(mvMatrix, scale);
	return mvMatrix;
}

function Primitive(de, trm) {
	this.de = de;
	this.trm = trm;
	if (de.asset && de.asset.skeleton) {
		this.skeleton = {};
		$.extend(true, this.skeleton, de.asset.skeleton);
		// this.skeleton = JSON.parse(JSON.stringify(de.asset.skeleton));
	}
}

function draw(primitive, camera_trans) {
	if (primitive.de.init(gl)) {
		webglEngine.setProjection(gl, webglEngine.getCurrentProgramObj().program, 60, canvas.width / canvas.height, 0.1, 1000);
	}
	var out = mat4.create();
	mat4.multiply(camera_trans, primitive.trm, out);
	webglEngine.setModelView(gl, webglEngine.getCurrentProgramObj(), out);

	webglEngine.setSkelPose(gl, webglEngine.getCurrentProgramObj(), primitive.skeleton);

	primitive.de.draw(gl);
}