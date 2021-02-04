//#include "math.frag"

	precision mediump float;
	
	uniform samplerCube u_earth;
	uniform float u_t;
	
	uniform int u_coloring_mode;
	
	uniform vec2 u_c;
	uniform vec2 u_fc;
	
	varying vec2 v_z;
	
	vec4 domain_color(vec2 z) {
		//hsv-rgb code taken from https://stackoverflow.com/questions/15095909/from-rgb-to-hsv-in-opengl-glsl
		float hue = atan(z.y, -z.x);
		hue /= 2.0 * PI;
		if (hue < 0.0) hue += 1.0;
		float mag = 3.0 / (3.0 + dot(z, z));
		vec3 c = vec3(hue, 1, 1);
		vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
		vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
		return vec4(mag * c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y), 1);
	}
	
	vec4 pretty_domain_color(vec2 z) {
		//stolen rather egregiously from http://davidbau.com/conformal/ (though I re-implemented it myself)
		float grid_size = 1.0/16.0;
		vec4 dc = domain_color(z);
		vec2 m = mod(z, 2.0*grid_size);
		dc.xyz *= 1.0 - mod(step(m.x, grid_size) + step(m.y, grid_size), 2.0);
		if (length(z) < grid_size) {
			float f = mod(step(m.x, grid_size) + step(m.y, grid_size), 2.0);
			return vec4(f, f, f, 1);
		} else if (length(z) >= 1.0 - grid_size && length(z) < 1.0 + grid_size) {
			if (length(z - vec2(1, 0)) >= grid_size && length(z - vec2(0, 1)) >= grid_size && length(z - vec2(-1, 0)) >= grid_size && length(z - vec2(0, -1)) >= grid_size) {
				float theta = -atan(z.x, z.y);
				theta = mod(theta, PI/2.0);
				float grey = length(z) >= 1.0 ? 1.0 : 2.0 / 3.0;
				grey -= theta / (3.0*PI/2.0);
				return vec4(grey, grey, grey, 1);
			}
		} else if (length(z) >= 1.0/grid_size) {
			float color = (z.y > 0.0) == (z.x > 0.0) ? 1.0 : 0.0;
			vec2 condensed_z = z/length(z) * (log(length(z)) / log(1.0/grid_size));
			float grey = step(1.0, mod(length(condensed_z), 2.0))/8.0;
			dc = domain_color(condensed_z);
			dc.xyz *= color;
			dc.xyz += (1.0 - color) * grey;
		}
		return dc;
	}
	
	vec4 riemann_color(vec2 z, samplerCube cubemap) {
		vec3 direction;
		float inf = 1.0/0.0;
		if (abs(z.x) == inf || abs(z.y) == inf) direction = vec3(0, 1, 0);
		else {
			float theta = atan(z.y, z.x);
			float phi = atan(1.0, length(z));
			phi *= 2.0;
			direction = vec3(cos(theta), 0, sin(theta));
			direction *= sin(phi);
			direction.y = cos(phi);
		}
		//return vec4(mod(z.x, 1.0), mod(z.y, 1.0), 0, 1);
		return textureCube(cubemap, direction);
	}
	
	vec4 grid_color(vec2 z) {
		return vec4(z.x, dot(z, vec2(-0.5, sqrt(.75))), dot(z, vec2(-0.5, -sqrt(.75))), 1);
	}
	
	vec4 color(vec2 z) {
		if (u_coloring_mode == 0) {
			return riemann_color(z, u_earth);
		} else if (u_coloring_mode == 1) {
			return pretty_domain_color(z);
		}
		return vec4(1, 0, 1, 1);
	}
	
	vec2 f() {
%%FUNCTION
	}
	
	void main() {
		vec2 fz = f();
		gl_FragColor = color(fz);
	}
