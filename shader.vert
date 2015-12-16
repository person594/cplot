attribute vec3 aPosition;

varying vec2 v_z;

void main() {
	v_z = aPosition.xy * vec2(16, 9);
	gl_Position = vec4(aPosition, 1);
}
