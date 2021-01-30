var u_t = null;
var uBounds = null;
var u_coloring_mode = null;
var slider;
var textbox;
var canvas;
var gl;

var mouseValue = [0,0]

var z_real_span, z_imag_span, f_real_span, f_imag_span;

var coloringMode = 1;

var autoplay = true;

var vShader;
var fHeader;
var fFooter = [
	//"gl_FragColor = riemann_color(c, u_earth);",
	//"gl_FragColor = pretty_domain_color(c);",
	"gl_FragColor = color(c);",
	"}"
	].join("\n");
	
var x = 0, y = 0, scale = 4;

var shouldRedraw = true;

function earthColor() {
	coloringMode = 0;
	gl.uniform1i(u_coloring_mode, 0);
	shouldRedraw = true;
}

function gridColor() {
	coloringMode = 1;
	gl.uniform1i(u_coloring_mode, 1);
	shouldRedraw = true;
}

function resetView() {
	x = 0;
	y = 0;
	scale = 4;
	updateBounds()
}

function getBounds() {
	var width = canvas.width;
	var height = canvas.height;
	var min = Math.min(width, height);
	width /= min;
	height /= min;
	var x0 = x - scale * width/2;
	var x1 = x + scale * width/2;
	var y0 = y - scale * height/2;
	var y1 = y + scale * height/2;
	return [x0, x1, y0, y1];
}

function updateBounds() {
	var [x0, x1, y0, y1] = getBounds();
	gl.uniform4f(uBounds, x0, y0, x1, y1);
	shouldRedraw = true;
}

function onMouseMove(e) {
	var x_rel = e.clientX / canvas.width;
	var y_rel = 1 - (e.clientY / canvas.height);
	var [x0, x1, y0, y1] = getBounds();
	var z_real = x_rel * x1 + (1 - x_rel) * x0;
	var z_imag = y_rel * y1 + (1-y_rel) * y0;

	mouseValue[0] = z_real
	mouseValue[1] = z_imag
	
	z_real_span.innerText = z_real.toFixed(2);
	z_imag_span.innerText = z_imag.toFixed(2);
	
	// even if the function doesn't depend on the mouse position, we need to
	// render to get the correct f(z) to display for the mouse position
	shouldRedraw = true;
	
	
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

function onSliderInput() {
	autoplay = false;
	sliderChanged = true;
	updateTime(slider.value);
}
var sliderChanged = false;
function onSliderPress() {
	sliderChanged = false;
}

function onSliderClick() {
	if (!sliderChanged) {
		autoplay = !autoplay;
	}
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
		glsl = toGLSL(parsedExpression);
		fExpression = "\n\
		vec2 z = v_z;\n\
		vec2 c = " + glsl + ";\n\
		z = u_c;\n\
		u_fc = " + glsl + ";\n\
		";
	} else return false;
	
	var fShader = fHeader + fExpression + fFooter;
	setup(vShader, fShader, textures);
	return true;
}


function init() {
	slider = document.getElementById("slider");
	textbox = document.getElementById("textbox");
	
	z_real_span = document.getElementById("z-real")
	z_imag_span = document.getElementById("z-imag")
	f_real_span = document.getElementById("f-real")
	f_imag_span = document.getElementById("f-imag")
	
	canvas = document.getElementById("plot");
	gl = canvas.getContext("webgl");
	
	var textures = initTextures();

	function resize() {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
		updateBounds();
	}
	window.addEventListener('resize', resize, false);
	resize();
	
	canvas.addEventListener("mousemove", onMouseMove, false);
	canvas.addEventListener("wheel", onWheel, false);
	
	slider.addEventListener("mousedown", onSliderPress, false);
	slider.addEventListener("click", onSliderClick, false);
	slider.addEventListener("input", onSliderInput, true);
	
	
	
	var textbox = document.getElementById("textbox");
	
	function onHashChange() {
		if (window.location.hash.length > 0) {
			expression = window.location.hash.substring(1)
			expression = decodeURIComponent(expression)
			textbox.value = expression
		}
	}
	window.onhashchange = onHashChange
	onHashChange()
	
	var lastExpression = "";
	var start = function() {
		var expression = textbox.value;
		if (expression != lastExpression) {
			lastExpression = expression;
			if (compileShaders(expression, textures)) {
				autoplay = true;
				shouldRedraw = true;
				textbox.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
				window.location.hash = encodeURIComponent(expression)
			} else {
				textbox.style.backgroundColor = "rgba(1, 0, 0, 0.5)";
			}
		}
		
		if (timeDependent) {
			slider.style.visibility = "visible";
			if (autoplay) {
				updateTime();
			}
		} else {
			slider.style.visibility = "hidden";
		}
		if (shouldRedraw) {
			render();
		}
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
	u_coloring_mode = gl.getUniformLocation(program, "u_coloring_mode");
	gl.uniform1i(u_coloring_mode, coloringMode);
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

function updateTime(t) {
	t = t || (Date.now() % 5000) / 5000;
	slider.value = t;
	gl.uniform1f(u_t, t);
	shouldRedraw = true;
}

function render() {
	gl.drawArrays(gl.TRIANGLES, 0, 6);
	shouldRedraw = timeDependent;
}




