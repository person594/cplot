varying vec2 v_z;

vec2 c_exp(vec2 z) {
	return exp(z.x) * vec2(cos(z.y), sin(z.y));
}

vec2 c_abs(vec2 z) {
	return vec2(length(z), 0);
}

vec2 c_conj(vec2 z) {
	return vec2(z.x, -z.y);
}

vec2 c_ln(vec2 z) {
	float theta = atan2(z.y, z.x);
	return vec2(log(length(z)), theta);
}

vec2 _mult(vec2 a, vec2 b) {
	return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
}

vec2 _pow(vec2 a, vec2 b) {
	return ex(mult(ln(a), b));
}

vec2 c_inv(vec2 z) {
	return conj(z)/ dot(z,z);
}


vec3 domain_color(vec2 z) {
	//hsv-rgb code taken from https://stackoverflow.com/questions/15095909/from-rgb-to-hsv-in-opengl-glsl
	float hue = atan(z.y, z.x);
	hue /= 3.1415926535898;
	if (hue < 0.0) hue += 0.5;
	float sat = atan(length(z));
	sat /= 3.1415926535898;
	vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
	vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
	return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
	gl_FragColor = vec4(1, 0, 0, 1);
}
