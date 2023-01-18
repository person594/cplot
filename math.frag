precision mediump float;

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


	vec2 zeta_alt(vec2 z) {
		// applicable for z with real part >= 0 and small imaginary part
		// usees an alternating series
		//Implementation of proposition 1 from page 3 of http://numbers.computation.free.fr/Constants/Miscellaneous/zetaevaluations.pdf
		#define ZETA_ITERATIONS 50
		float r[ZETA_ITERATIONS];
		r[0] = 1.0;
		r[1] = 1.0;
		r[2] = 1.0;
		r[3] = 1.0;
		r[4] = 1.0;
		r[5] = 1.0;
		r[6] = 1.0;
		r[7] = 1.0;
		r[8] = 1.0;
		r[9] = 1.0;
		r[10] = 1.0;
		r[11] = 0.9999999999999991;
		r[12] = 0.9999999999999853;
		r[13] = 0.9999999999997845;
		r[14] = 0.999999999997308;
		r[15] = 0.9999999999710746;
		r[16] = 0.999999999730425;
		r[17] = 0.9999999978052277;
		r[18] = 0.9999999842921771;
		r[19] = 0.9999999006381278;
		r[20] = 0.9999994418278422;
		r[21] = 0.999997203728888;
		r[22] = 0.9999874611374573;
		r[23] = 0.9999495073899706;
		r[24] = 0.999816871155403;
		r[25] = 0.9994002309671448;
		r[26] = 0.998221949891754;
		r[27] = 0.995218197716334;
		r[28] = 0.9883095677128684;
		r[29] = 0.973965697070464;
		r[30] = 0.9470770175272452;
		r[31] = 0.9015752858835114;
		r[32] = 0.8321038920345966;
		r[33] = 0.7364957080523137;
		r[34] = 0.6180557189399335;
		r[35] = 0.48622686149311023;
		r[36] = 0.35470746145813403;
		r[37] = 0.2374550677949638;
		r[38] = 0.14439369429808976;
		r[39] = 0.07894393711347507;
		r[40] = 0.03838994199718532;
		r[41] = 0.016409456839304695;
		r[42] = 0.006081277066324643;
		r[43] = 0.0019217474833351398;
		r[44] = 0.0005069858540111238;
		r[45] = 0.00010852115541499642;
		r[46] = 1.8090800979659343e-05;
		r[47] = 2.2018711680970302e-06;
		r[48] = 1.7394196846341903e-07;
		r[49] = 6.690075710131501e-09;

		vec2 sum = vec2(0, 0);
		float sign = 1.0;
		for (int k = 1; k <= ZETA_ITERATIONS; ++k) {
			vec2 term = vec2(sign*r[k], 0);
			float logk = log(float(k));
			term = _div(term, c_exp(logk*z));
			sum += term;
			sign *= -1.0;
		}
		float log2 = log(2.0);
		vec2 one = vec2(1, 0);
		sum = _div(sum, (one - c_exp(log2 * (one-z))));
		return sum;
	}
	
	vec2 c_zeta(vec2 z) {
		if (z.x >= 0.0) {
			return zeta_alt(z);
		} else {
			vec2 res = zeta_alt(vec2(1, 0) - z);
			res = _mult(res, _pow(vec2(2.0*PI, 0), z));
			res = _div(res, 2.0*c_gamma(z));
			res = _div(res, c_cos(PI*z / 2.0));
			return res;
			//return zomz * _pow(vec2(2.0*PI, 0), z) / 2.0*c_gamma(z) / c_cos(PI*z / 2.0);
		}
		
	}
