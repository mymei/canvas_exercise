<script type="x-shader/x-fragment">
	#ifdef GL_ES
	precision mediump float;
	#endif
	varying vec4 vColor;
	void main(void) {
		// gl_FragColor = vColor;
		gl_FragColor = vec4(1, 0, 0, 1);
	}
</script>