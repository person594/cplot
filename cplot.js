function compileShaders(gl, expression) {
	var fragHeader = document.getElementById("fragmentShader").text;
	var parsedExpression = parse(tokenize(expression));
	var fragExpression;
	if (parsedExpression) {
		fragExpression = "\nvec2 c = " + toGLSL(parsedExpression) + ";\n";
	} else return false;
	var fragFooter = [
		"gl_FragColor = vec4(domain_color(c), 1);",
		"}"
	].join("\n");
	var vShader = document.getElementById("vertexShader").text;
	var fShader = fragHeader + fragExpression + fragFooter;
	setup(gl, vShader, fShader);
	return true;
}


function init(canvas, textbox, vShader, fShader) {
	canvas = canvas || document.getElementById("plot");
	var gl = canvas.getContext("webgl");
	
	function resize() {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
		render(gl);
	}
	
	window.addEventListener('resize', resize, false);
	resize();
	var lastExpression = "";
	var start = function() {
		var expression = document.getElementById("textbox").value;
		if (expression != lastExpression) {
			lastExpression = expression;
			if (compileShaders(gl, expression))
				render(gl);
		}
		window.requestAnimationFrame(start);
	};
	start();
	
}

function setup(gl, vSource, fSource) {
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




