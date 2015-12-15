uniform vec2[] expression;

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

void main() {
	gl_FragColor = vec4(1, 0, 0, 1);
}
