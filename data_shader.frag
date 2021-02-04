//#include "math.frag"
	
	uniform float u_t;
	
	uniform vec2 u_c;
	uniform vec2 u_fc;
	
	varying vec2 v_z;
	
	
	float sigmoid(float x) {
		return 1.0 / (1.0 + exp(-x));
	}
	
	vec4 color(vec2 z) {
		return vec4(
			sigmoid(z.x),
			sigmoid(z.y),
			0,
			1
		);
	}
	
	vec2 f() {
%%FUNCTION
	}
	
	void main() {
		vec2 fz = f();
		gl_FragColor = color(fz);
	}
