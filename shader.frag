		precision mediump float;
		
		uniform samplerCube u_earth;
		
		varying vec2 v_z;
		
		vec2 i = vec2(0, 1);
		
		vec2 c_exp(vec2 z) {
			return exp(z.x) * vec2(cos(z.y), sin(z.y));
		}

		vec2 c_abs(vec2 z) {
			return vec2(length(z), 0);
		}

		vec2 c_conj(vec2 z) {
			return vec2(z.x, -z.y);
		}
		
		vec2 c_inv(vec2 z) {
			return c_conj(z)/ dot(z,z);
		}


		vec2 c_ln(vec2 z) {
			float theta = atan(z.y, z.x);
			return vec2(log(length(z)), theta);
		}

		vec2 _mult(vec2 a, vec2 b) {
			return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
		}
		
		vec2 _div(vec2 a, vec2 b) {
			return _mult(a, c_inv(b));
		}
		
		vec2 c_cos(vec2 z) {
			return .5 * (c_exp(_mult(z, i)) + c_exp(_mult(z, -i)));
		}
		
		vec2 c_sin(vec2 z) {
			return _div(c_exp(_mult(z, i)) - c_exp(_mult(z, -i)), vec2(0, 2));
		}
		
		vec2 c_tan(vec2 z) {
			return _div(c_sin(z), c_cos(z));
		}
		
		vec2 c_sec(vec2 z) {
			return c_inv(c_cos(z));
		}
		
		vec2 c_csc(vec2 z) {
			return c_inv(c_sin(z));
		}
		
		vec2 c_cot(vec2 z) {
			return _div(c_cos(z), c_sin(z));
		}
		
		vec2 c_cosh(vec2 z) {
			return .5 * (c_exp(z) + c_exp(-z));
		}
		
		vec2 c_sinh(vec2 z) {
			return .5 * (c_exp(z) - c_exp(-z));
		}
		
		vec2 c_tanh(vec2 z) {
			return _div(c_sinh(z), c_cosh(z));
		}
		
		vec2 c_sech(vec2 z) {
			return c_inv(c_cosh(z));
		}
		
		vec2 c_csch(vec2 z) {
			return c_inv(c_sinh(z));
		}
		
		vec2 c_coth(vec2 z) {
			return _div(c_cosh(z), c_sinh(z));
		}

		vec2 _pow(vec2 a, vec2 b) {
			return c_exp(_mult(c_ln(a), b));
		}
		
		vec3 domain_color(vec2 z) {
			//hsv-rgb code taken from https://stackoverflow.com/questions/15095909/from-rgb-to-hsv-in-opengl-glsl
			float hue = atan(z.y, z.x);
			hue /= 2.0 * 3.1415926535898;
			if (hue < 0.0) hue += 1.0;
			float mag = atan(length(z));
			mag *= 2.0/3.1415926535898;
			vec3 c = vec3(hue, 1, 1);
			vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
			vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
			return mag * c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
		}
		
		vec4 riemann_color(vec2 z, samplerCube cubemap) {
			float theta = atan(z.x, z.y);
			float phi = atan(1.0, length(z));
			phi *= 2.0;
			vec3 direction = vec3(cos(theta), 0, sin(theta));
			direction *= sin(phi);
			direction.y = -cos(phi);
			return textureCube(cubemap, direction);
		}
		
		void main() {
			//the rest of the shader comes from javascript
			
