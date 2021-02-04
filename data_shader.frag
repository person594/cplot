//#include "math.frag"
	
	uniform float u_t;
	
	uniform vec2 u_c;
	uniform vec2 u_fc;
	
	varying vec2 v_z;
	
	float eps = 1e-6
	
	float sigmoid(float x) {
		return 1.0 / (1.0 + exp(-x));
	}
	
	vec2 encode_range(float x, float range) {
		x = clamp(x, -range, range);
		x = (x + range) / (2.0 * range) - eps;
		// x is in [0, 1) now
		vec2 encoded;
		encoded.x = x; // ignores
		x *= 256.0;
		encoded.y = mod(x, 1.0);
		return encoded;
	}
	
	vec4 encode(vec2 z) {
		// we have 32 bits across 4 channels
		// convert to log space and use 16 bits for each
		// log space conveniently happens to store argument and magnitude
		// separately in complex numbers :)
		vec2 lz = c_ln(z);
		return vec4(
			encode_range(lz.x, 10),
			encode_range(lz, PI/2)
		);
	}
	
	vec2 f() {
%%FUNCTION
	}
	
	void main() {
		vec2 fz = f();
		gl_FragColor = encode(fz);
	}