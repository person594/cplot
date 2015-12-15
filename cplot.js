function init(canvas, textbox, vShader, fShader) {
	canvas = canvas || document.getElementById("plot");
	vShader = vShader || document.getElementById("vertexShader").text;
	fShader = fShader || document.getElementById("fragmentShader").text;
	var context = canvas.getContext("webgl");
	setup(context, vShader, fShader);
	var start = function() {
		//canvasMaintainence(canvas);
		render(context);
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


function setupVbo(gl, program) {
	
}

function canvasMaintainence(canvas) {
	debugger;
	canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}

function render(gl) {
	gl.drawArrays(gl.TRIANGLES, 0, 6);
}




