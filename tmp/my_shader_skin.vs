<script type="x-shader/x-vertex">
	const int BoneCount = 20;
	attribute vec3 aVertex;
	attribute vec3 aNormal;
	attribute vec2 aTexCoord;
	attribute vec4 aBoneIndices;
	attribute vec4 aBoneWeights;
	uniform mat4 uModelView;
	uniform mat3 uNormalMatrix;
	uniform mat4 uProjection;
	uniform mat4 uBindPose;
	uniform mat4 uBoneBind[BoneCount];
	uniform mat4 uBoneTransform[BoneCount];
	varying vec3 vColor;
	varying vec4 vPosition;
	varying vec3 vNormal;
	void main(void) {
		// gl_Position = uProjection * uModelView * vec4(aVertex, 1.0);
		vec4 bind_pos = uBindPose * vec4(aVertex, 1.0);
		vec4 a = aBoneWeights.x * uBoneTransform[int(aBoneIndices.x)] * uBoneBind[int(aBoneIndices.x)] * bind_pos;
		vec4 b = aBoneWeights.y * uBoneTransform[int(aBoneIndices.y)] * uBoneBind[int(aBoneIndices.y)] * bind_pos;
		vec4 c = aBoneWeights.z * uBoneTransform[int(aBoneIndices.z)] * uBoneBind[int(aBoneIndices.z)] * bind_pos;
		vec4 d = aBoneWeights.w * uBoneTransform[int(aBoneIndices.w)] * uBoneBind[int(aBoneIndices.w)] * bind_pos;

		vec3 bind_normal = mat3(uBindPose) * aNormal;
		vec3 an = aBoneWeights.x * mat3(uBoneTransform[int(aBoneIndices.x)] * uBoneBind[int(aBoneIndices.x)]) * bind_normal;
		vec3 bn = aBoneWeights.y * mat3(uBoneTransform[int(aBoneIndices.y)] * uBoneBind[int(aBoneIndices.y)]) * bind_normal;
		vec3 cn = aBoneWeights.z * mat3(uBoneTransform[int(aBoneIndices.z)] * uBoneBind[int(aBoneIndices.z)]) * bind_normal;
		vec3 dn = aBoneWeights.w * mat3(uBoneTransform[int(aBoneIndices.w)] * uBoneBind[int(aBoneIndices.w)]) * bind_normal;

		// gl_Position = uProjection * uModelView * uBoneBind[0] * bind_pos;
		// gl_Position = uProjection * uModelView * uBoneTransform[6] * uBoneBind[6] * bind_pos;
		vPosition = uModelView * (a + b + c + d);
		vNormal = uNormalMatrix * (an + bn + cn + dn);
		gl_Position = uProjection * (vPosition);
		// vColor = aBoneIndices.xxxx * aBoneWeights.xxxx / 6.0 + vec4((aVertex.xyz + 1.0) / 2.0, 1.0);
		// vColor = vec4((aNormal.xyz + 1.0) / 2.0, 1.0);
		vColor = vec3(1, 0, 0);

	}
</script>