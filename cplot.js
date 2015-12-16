function compileShaders(gl, expression, textures) {
	var fragHeader = document.getElementById("fragmentShader").text;
	var parsedExpression = parse(tokenize(expression));
	var fragExpression;
	if (parsedExpression) {
		fragExpression = "\nvec2 c = " + toGLSL(parsedExpression) + ";\n";
	} else return false;
	var fragFooter = [
		"gl_FragColor = riemann_color(c, u_earth);",
		"}"
	].join("\n");
	var vShader = document.getElementById("vertexShader").text;
	var fShader = fragHeader + fragExpression + fragFooter;
	setup(gl, vShader, fShader, textures);
	return true;
}


function init(canvas, textbox, vShader, fShader) {
	canvas = canvas || document.getElementById("plot");
	var gl = canvas.getContext("webgl");
	
	var textures = initTextures(gl);
	
	var shouldRedraw = true;
	function resize() {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
		shouldRedraw = true;
	}
	window.addEventListener('resize', resize, false);
	resize();
	
	var lastExpression = "";
	var start = function() {
		var expression = document.getElementById("textbox").value;
		if (expression != lastExpression) {
			lastExpression = expression;
			if (compileShaders(gl, expression, textures))
				render(gl);
		} else if (shouldRedraw) {
			render(gl);
		}
		shouldRedraw = false;
		window.requestAnimationFrame(start);
	};
	start();
	
}


function initTextures(gl) {
	var earthTexture = gl.createTexture();
	var frontImage = document.getElementById("earthFront");
	var topImage = document.getElementById("earthTop");
	var bottomImage = document.getElementById("earthBottom");
	var leftImage = document.getElementById("earthLeft");
	var rightImage = document.getElementById("earthRight");
	var backImage =  document.getElementById("earthBack");
	
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, earthTexture);
	gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, rightImage);
	gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, topImage);
	gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, frontImage);
	gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, leftImage);
	gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bottomImage);
	gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, backImage);
	
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
	gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
	
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
	
	return {
		"earth": [gl.TEXTURE_CUBE_MAP, earthTexture]
	}
}

function setup(gl, vSource, fSource, textures) {
	var vShader = gl.createShader(gl.VERTEX_SHADER);
	var fShader = gl.createShader(gl.FRAGMENT_SHADER);

	gl.shaderSource(vShader, vSource);
	gl.shaderSource(fShader, fSource);
	gl.compileShader(vShader);
	gl.compileShader(fShader);

	var program = gl.createProgram();
	gl.attachShader(program, vShader);
	gl.attachShader(program, fShader);
	gl.linkProgram(program);

	gl.useProgram(program);

	var aPosition = gl.getAttribLocation(program, "aPosition")
	var textureUniforms = {};
	var i = 0;
	for (texture in textures) {
		gl.activeTexture(gl["TEXTURE" + i]);
		gl.bindTexture(textures[texture][0], textures[texture][1]);
		gl.uniform1i(gl.getUniformLocation(program, "u_" + texture), i);
		++i;
	}

	gl.enableVertexAttribArray(aPosition);
	
	var verts = [
		-1, -1, 0,
		1, 1, 0,
		-1, 1, 0,
		
		-1, -1, 0,
		1, -1, 0,
		1, 1, 0
	];
	var vbo = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
	gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
}

function render(gl) {
	gl.drawArrays(gl.TRIANGLES, 0, 6);
}




