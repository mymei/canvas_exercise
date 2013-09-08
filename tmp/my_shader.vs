<script type="x-shader/x-vertex">
	attribute vec3 aVertex;
	attribute vec3 aNormal;
	attribute vec2 aTexCoord;
	uniform mat4 uModelView;
	uniform mat4 uProjection;
	uniform mat3 uNormalMatrix;
	varying vec4 vPosition;
	varying vec3 vColor;
	varying vec3 vNormal;
	void main(void) {
		vPosition = uModelView * vec4(aVertex, 1.0);
		gl_Position = uProjection * vPosition;
		vNormal = uNormalMatrix * aNormal;
		// vColor = aVertex.xyz * 0.5 + 0.5;
		vColor = vec3(1, 0, 0);
	}
</script>