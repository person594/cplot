var u_t = null;
var uBounds = null;

var canvas;
var gl;

var vShader;
var fHeader;
var fFooter = [
	"gl_FragColor = riemann_color(c, u_earth);",
	//"gl_FragColor = domain_color(c);",
	"}"
	].join("\n");
	
var x = 0, y = 0, scale = 4;

function updateBounds() {
	var width = canvas.width;
	var height = canvas.height;
	var min = Math.min(width, height);
	width /= min;
	height /= min;
	var x0 = x - scale * width/2;
	var x1 = x + scale * width/2;
	var y0 = y - scale * height/2;
	var y1 = y + scale * height/2;
	gl.uniform4f(uBounds, x0, y0, x1, y1);
	shouldRedraw = true;
}

function onMouseMove(e) {
	if (e.buttons & 1) {
		min = Math.min(canvas.width, canvas.height);
		x -= e.movementX * scale / min;
		y += e.movementY * scale / min;
		updateBounds();
	}
}

function onWheel(e) {
	var min = Math.min(canvas.width, canvas.height);
	var xt = (e.x - canvas.width/2) / min;
	var zoomX = xt * scale + x;
	var yt = -(e.y - canvas.height/2) / min;
	var zoomY = yt * scale + y;
	
	scale *= Math.exp(Math.sign(e.deltaY) / 10);
	
	x = zoomX - scale*xt;
	y = zoomY - scale*yt;
	
	updateBounds();
}

function loadShaders() {
	return $.when($.get("shader.vert"), $.get("shader.frag")).then(function(v, f) {
		vShader = v[0];
		fHeader = f[0];
	});
}


function compileShaders(expression, textures) {

	var parsedExpression = parse(tokenize(expression));
	var fExpression;
	if (parsedExpression) {
		fExpression = "\nvec2 c = " + toGLSL(parsedExpression) + ";\n";
	} else return false;
	
	var fShader = fHeader + fExpression + fFooter;
	setup(vShader, fShader, textures);
	return true;
}


function init(plotCanvas, textbox, vShader, fShader) {
	canvas = canvas || document.getElementById("plot");
	gl = canvas.getContext("webgl");
	
	var textures = initTextures();
	
	var shouldRedraw = true;
	function resize() {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
		updateBounds();
		shouldRedraw = true;
	}
	window.addEventListener('resize', resize, false);
	resize();
	
	canvas.addEventListener("mousemove", onMouseMove, false);
	canvas.addEventListener("wheel", onWheel, false);
	
	var lastExpression = "";
	var start = function() {
		var expression = document.getElementById("textbox").value;
		if (expression != lastExpression) {
			lastExpression = expression;
			if (compileShaders(expression, textures))
				render();
		} else if (shouldRedraw) {
			render();
		}
		shouldRedraw = true;
		window.requestAnimationFrame(start);
	};
	loadShaders().then(start)
	
}


function initTextures() {
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

function setup(vSource, fSource, textures) {
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
	
	var aPosition = gl.getAttribLocation(program, "aPosition");
	
	width = 16;
	height = 9;
	uBounds = gl.getUniformLocation(program, "uBounds");
	updateBounds();
	u_t = gl.getUniformLocation(program, "u_t");
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

function render() {
	gl.uniform1f(u_t, (Date.now() % 5000) / 5000);
	gl.drawArrays(gl.TRIANGLES, 0, 6);
}




