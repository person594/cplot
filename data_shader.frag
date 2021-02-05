//#include "math.frag"
	
	uniform float u_t;
	
	uniform vec2 u_c;
	uniform vec2 u_fc;
	
	varying vec2 v_z;
	
	float eps = 1e-6;
	
	float sigmoid(float x) {
		return 1.0 / (1.0 + exp(-x));
	}
	
	vec2 encode_range(float x, float range) {
		x = clamp(x, -range, range);
		x = (x + range) / (2.0 * range);
		// x is in [0, 1] now
		x *= 255.0 + 255.0/256.0;
		vec2 encoded;
		encoded.x = floor(x) / 255.0;
		encoded.y = mod(x, 1.0) * 256./255.;
		return encoded;
	}
	
	vec4 encode(vec2 z) {
		// we have 32 bits across 4 channels
		// convert to log space and use 16 bits for each
		// log space conveniently happens to store argument and magnitude
		// separately in complex numbers :)
		vec2 lz = c_ln(z);
		return vec4(
			encode_range(lz.x, 10.0),
			encode_range(lz.y, PI)
		);
	}
	
	vec2 f() {
%%FUNCTION
	}
	
	void main() {
		vec2 fz = f();
		gl_FragColor = encode(fz);
	}
