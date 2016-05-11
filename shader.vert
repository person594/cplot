uniform vec4 uBounds;

attribute vec3 aPosition;

varying vec2 v_z;

void main() {
	vec2 one = vec2(1, 1);
	vec2 t = (one + aPosition.xy) / 2.0;
	v_z = (one - t) * uBounds.xy + t * uBounds.zw;
	gl_Position = vec4(aPosition, 1);
}
