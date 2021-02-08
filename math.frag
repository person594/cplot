precision mediump float;

uniform float u_stieltjes[100];

		#define PI 3.1415926535898
		
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
		
		vec2 c_real(vec2 z) {
			return vec2(z.x, 0);
		}
		
		vec2 c_imag(vec2 z) {
			return vec2(z.y, 0);
		}
		
		vec2 c_arg(vec2 z) {
			return vec2(atan(z.y, z.x), 0);
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
		
		vec2 c_sqrt(vec2 z) {
			return _pow(z, vec2(0.5, 0));
		}
		
		vec2 c_gamma(vec2 z) {
			//uses the Lanczos approximation, with code gratefully lifted from
			//the python example at https://en.wikipedia.org/wiki/Lanczos_approximation
			#define GAMMA_ITERATIONS 8
			float p[8];
			p[0] = 676.5203681218851;
			p[1] = -1259.1392167224028;
			p[2] = 771.32342877765313;
			p[3] = -176.61502916214059;
			p[4] = 12.507343278686905;
			p[5] = -0.13857109526572012;
			p[6] = 9.9843695780195716e-6;
			p[7] = 1.5056327351493116e-7;
			
			bool flipped = false;
			if (z.x < 0.5) {
				z = vec2(1, 0) - z;
				flipped = true;
			}
			z.x -= 1.0;
			vec2 x = vec2(0.99999999999980993, 0); //magic number blindly taken from wikipedia 
			for (int j = 0; j < GAMMA_ITERATIONS; ++j) {
				vec2 z2 = z;
				z2.x += float(j) + 1.0;
				x += _div(vec2(p[j], 0), z2);
			}
			vec2 t = z + vec2(float(GAMMA_ITERATIONS) - 0.5, 0);
			vec2 result = sqrt(2.0*PI) * _mult(_pow(t, z + vec2(0.5, 0)), _mult(c_exp(-t), x));
			if (flipped) {
				//the well known identity calls for the positive quotient, not the negative.
				//however, we subtracted 1 from z earlier, shifting the sin function by
				//one half period, therefore negating the value
				result = -_div(vec2(PI, 0), _mult(c_sin(PI*z), result));
			}
			return result;
		}
		
		vec2 c_zeta(vec2 s) {
			s.x -= 1.0;
			
			vec2 s_to_the_n = vec2(1, 0);

			vec2 sm = vec2(0);
			
			// we will work in log space so that s^n doesn't get too big
			
			vec2 logs = c_ln(s);
			
			for (int n = 0; n <= 100; ++n) {
				// we want sm += e^(ln gamma + ln s^n)
				// since gamma can be negative, do some trickery
				vec2 loggamma = c_ln(vec2(u_stieltjes[n], 0));
				sm += exp(loggamma + float(n) * logs);
			}
			return c_inv(s) + sm;
		}
