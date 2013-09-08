function parseArray(el) {
	if (el) {
		var strvals = el.textContent.replace(/^\s\s*/, "").replace(/\s\s*$/, "");
		return strvals.split(/\s+/);
	}
	return [];
}

// function parseAccesor(source) {
// 	var accessor = $("technique_common>accessor",source)[0];

// 	var tmp = accessor.getAttribute('source');
// 	var tmp2 = $(tmp, source)[0];
// 	var array = parseVals(tmp2);
// 	var length = parseInt(accessor.getAttribute('count'));

// 	var params = [];
// 	$('param', accessor).each(function(index) {
// 		params.push(this.getAttribute("name"));
// 	});

// 	var rvalue = [];
// 	for (var i = 0; i < length; i ++) {
// 		var elm={};
// 		for (var j = 0; j < params.length; j++) {
// 			elm[params[j]] = array[i * params.length + j];
// 		}
// 		rvalue.push(elm);
// 	}
// 	return rvalue;
// }

function getInput(el, base) {
	var target = $(el.getAttribute("source"), base)[0];
	var target_input = $("input", target)[0];
	while (target_input) {
		var name = target_input.getAttribute("source");
		target = $(name, base)[0];
		target_input = $("input", target)[0];
	}
	return target;
}

function finalize(source) {
	var ret = source;
	if (source.constructorName) {
		ret = $.extend(new (eval(source.constructorName))(), source);
	}
	if (ret instanceof Object) {
		for (var k in ret) {
			if (ret[k] instanceof Array) {
				for (var i = 0; i < ret[k].length; i ++) {
					ret[k][i] = finalize(ret[k][i]);
				}
			} else {
				ret[k] = finalize(ret[k]);
			}
		}
	}
	return ret;
}

function ImportedBase() {
	this.constructorName = this.constructor.name;
}

// Skeleton class
function Skeleton(xml) {
	ImportedBase.call(this);
	var self = this;
	self.joints = {};
	$("visual_scene node[type='JOINT']", xml).each(function(i){
		var mvMatrix = mat4.identity(mat4.create());
		// if (i == 4)
			// mat4.rotate(mvMatrix, 0.5, [0, 0, 1]);
		// else
		// 	mat4.rotate(mvMatrix, 0, [0, 0, 1]);
		$(this).children('rotate,translate').each(function(i) {
			switch(this.tagName) {
				case 'translate' : {
					mat4.translate(mvMatrix, parseArray(this).map(parseFloat));
					break;
				}
				case 'rotate' : {
					var rot = parseArray(this).map(parseFloat);
					mat4.rotate(mvMatrix, rot[3], rot.slice(0, 3));
					break;
				}
			}
			// console.log(this.tagName + parseArray(this));
		});
		self.joints[$(this).attr('sid')] = {
			parent_sid : $(this).attr('id')=='skeleton_root'?undefined:$(this).parent().attr('sid'),
			trm : mvMatrix
		}
	});
}

Skeleton.prototype = new ImportedBase();
Skeleton.prototype.constructor = Skeleton;
Skeleton.prototype.getJointTransform = function(name) {
	var mat = this.joints[name].trm;
	if (name == 'joint3' || name == 'Bone09') {
		mat4.rotate(mat, 0.01, [0, 0, 1]);
	}
	var parent = this.joints[this.joints[name].parent_sid];
	var out = mat4.create(mat);
	while (parent) {
		mat4.multiply(parent.trm, out, out);
		parent = this.joints[parent.parent_sid];
	}
	return out;
}

function Geometry(geometryXML) {
	ImportedBase.call(this);
	if (arguments.length == 0) {
		return;
	}
	var meshes = [];
	$("mesh", geometryXML).each(function(){meshes.push(new Mesh(this))});
	this.meshes = meshes;
}

Geometry.prototype = new ImportedBase();
Geometry.prototype.constructor = Geometry;

function Mesh(meshXML) {
	ImportedBase.call(this);
	if (arguments.length == 0) {
		return;
	}
	var polygons = [];
	$("polylist", meshXML).each(function(){polygons.push(this);});
	$("polygons", meshXML).each(function(){polygons.push(this);});
	$("triangles", meshXML).each(function(){polygons.push(this);});

	var sources = {};
	$("source", meshXML).each(function(index){
		var stride = parseInt($("technique_common>accessor",this).attr("stride"));
		sources[this.getAttribute('id')]={id:index,stride:stride,array:parseArray($('float_array', this)[0]).map(parseFloat)}
	});

	this.meshData = new MeshData(sources);
	var meshData = this.meshData;
	this.polygons = polygons.map(function(poly) {
		return new Polygon(poly, meshData, meshXML);
	});
}

Mesh.prototype = new ImportedBase();
Mesh.prototype.constructor = Mesh;

function MeshData(sources) {
	ImportedBase.call(this);
	if (arguments.length == 0) {
		return;
	}
	var self = this;
	this.buffers = {};
	this.sources = sources;
	this.stride = 0;
	this.sources && $.each(this.sources, function(k, v) {
		self.stride += v.stride;
	});
}

MeshData.prototype = new ImportedBase();
MeshData.prototype.constructor = MeshData;

MeshData.prototype.getBufferKey = function(inputs) {
	return inputs.map(function(input){return input.source.id;}).toString();
}

MeshData.prototype.getBuffer = function(inputs) {
	var bufferKey = this.getBufferKey(inputs);
	if (!this.buffers[bufferKey]) {
		var stride = 0;
		inputs.forEach(function(input){ stride += input.source.stride; });
		this.buffers[bufferKey] = new Buffer(stride);
	}
	return this.buffers[this.getBufferKey(inputs)];
}

MeshData.prototype.getBufferPiece = function(inputs, piece) {
	var buffer = this.getBuffer(inputs);
	var key = piece.toString();
	if (!buffer.data[key]) {
		buffer.data[key] = {index:buffer.size++, map:piece[0], array:[]};
		var stride = piece.length;
		for (var j = 0; j < stride; j ++) {
			var source = inputs[j].source;
			for (var k = 0; k < source.stride; k ++) {
				buffer.data[key].array.push(source.array[source.stride * piece[j] + k]);
			}
		}
	}
	return buffer.data[key];
}

function Buffer(stride) {
	ImportedBase.call(this);
	if (arguments.length == 0) {
		return;
	}
	this.size = 0;
	this.data = {};
	this.stride = stride;
}

Buffer.prototype = new ImportedBase();
Buffer.prototype.constructor = Buffer;

Buffer.prototype.getFloatArray = function() {
	var self = this;
	var array = new Float32Array(self.size * self.stride);
	$.each(self.data, function(k, v) {
		var offset = v.index * self.stride;
		v.array.forEach(function(x) { array[offset++] = x; });
	})
	return array;
}

Buffer.prototype.getSkinFloatArray = function(skinWeights) {
	var self = this;
	var array = new Float32Array(8 * self.size);
	var map = [];
	$.each(self.data, function(k, v) {
		map[v.map] = map[v.map] || [];
		map[v.map].push(v.index);
	});
	for (var i = 0; i < skinWeights.array.length; i ++) {
		map[i].forEach(function(x) {
			for (var j = 0; j < 4; j ++) {
				var weight = skinWeights.array[i][j];
				if (weight) {
					array[8 * x + j] = weight.index;
					array[8 * x + j + 4] = weight.weight;
				} else {
					array[8 * x + j] = 0;
					array[8 * x + j + 4] = 0;
				}
			}
		})
	}
	return array;
}

function Polygon(poly, vbs, mesh) {
	var self = this;
	self.inputs = [];
	var el = $("input", poly).each(function() {
		var tmp = getInput(this, mesh);
		self.inputs.push({semantic:this.getAttribute('semantic'), source:vbs.sources[tmp.getAttribute("id")]});
	});

	this.indices = [];
	if (poly) {
		var stride = self.inputs.length;
		var tmpIndices = [];
		$("p", poly).each(function(){parseArray(this).forEach(function(x){tmpIndices.push(parseInt(x));})});

		var vcount = parseArray($("vcount", poly)[0]).map(parseFloat);
		var indices = this.indices;
		var anchor = 0;
		var not = parseInt(poly.getAttribute("count"));
		for (var i = 0; i < not; i ++) {
			var nov = vcount[i] || 3;
			for (var j=1;j < nov-1;j++) {
				indices.push(vbs.getBufferPiece(self.inputs, tmpIndices.slice(anchor + stride * 0, anchor + stride * 0 + stride)).index);
				indices.push(vbs.getBufferPiece(self.inputs, tmpIndices.slice(anchor + stride * j, anchor + stride * j + stride)).index);
				indices.push(vbs.getBufferPiece(self.inputs, tmpIndices.slice(anchor + stride * (j + 1), anchor + stride * (j + 1) + stride)).index);
			}
			anchor += nov * stride;
		}
	}
}

function SkinJoints(skinXML) {
	if (skinXML) {
		var bind_shape = mat4.transpose(parseArray($('bind_shape_matrix', skinXML)[0]).map(parseFloat));

		var joint_names = parseArray($('Name_array', getInput($("joints>input[semantic=JOINT]", skinXML)[0], skinXML))[0]);
		var bind_values = parseArray($('float_array', getInput($("joints>input[semantic=INV_BIND_MATRIX]", skinXML)[0], skinXML))[0]).map(parseFloat);
		var joints = joint_names.map(function(x){return{name:x, bind:mat4.transpose(bind_values.splice(0, 16))}});

		this.bindPose = bind_shape;
		this.joints = joints;
	}
}

function SkinWeights(skinXML) {
	if (skinXML) {
		var no = parseInt($("vertex_weights", skinXML).attr("count"));
		var vcount = parseArray($("vertex_weights>vcount", skinXML)[0]);
		var v = parseArray($("vertex_weights>v", skinXML)[0]);
		var weight_values = parseArray($('float_array', getInput($("vertex_weights>input[semantic=WEIGHT]", skinXML)[0], skinXML))[0]).map(parseFloat);
		var anchor = 0;
		this.array = [];
		for (var i = 0; i < no; i ++) {
			var weights = [];
			for (var j = 0; j < vcount[i]; j ++) {
				weights.push({index:v[anchor++], weight:weight_values[v[anchor++]]});
			}
			weights = weights.sort(function(a, b){return b.weight - a.weight;})
			this.array.push(weights);
		}
	}
}

function Asset(xml) {
	var self = this;
	self.geometry = {}
	$("geometry", xml).each(function(){
		var name = this.getAttribute('id');
		self.geometry[name] = new Geometry(this);
	})
	$("library_controllers controller skin", xml).each(function(){
		var skin_geometry = self.geometry[this.getAttribute('source').slice(1)];
		if (skin_geometry) {
			skin_geometry.skinJoints = new SkinJoints(this);
			skin_geometry.skinWeights = new SkinWeights(this);
		}
	});
	self.skeleton = new Skeleton(xml);
}