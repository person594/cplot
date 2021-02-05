var u_t_visual = null;
var u_t_data = null
var uBoundsVisual = null;
var uBoundsData = null;
var u_coloring_mode = null;
var slider;
var textbox;
var canvas;
var gl;

var dataFrameBuffer;
var dataTexture;

var mouseValue = [0,0]

var T = (Date.now() % 5000) / 5000;

var z_real_span, z_imag_span, f_real_span, f_imag_span;

var coloringMode = 1;

var autoplay = true;

var vShader;
var fHeader;
var fFooter;
var dHeader;
var dFooter;

var visualProgram, dataProgram;

var x = 0, y = 0, scale = 4;

var data_pixels;

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
	shouldRedraw = true;
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
		shouldRedraw = true;
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
	
	shouldRedraw = true;
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
	return $.when($.get("shader.vert"), $.get("shader.frag"), $.get("math.frag"), $.get("data_shader.frag")).then(function(v, f, m, d) {
		vShader = v[0];
		[fHeader, fFooter] = f[0].split("%%FUNCTION");
		[dHeader, dFooter] = d[0].split("%%FUNCTION");
		fHeader = m[0] + fHeader;
		dHeader = m[0] + dHeader;
	});
}


function compileShaders(expression, textures) {

	var parsedExpression = parse(tokenize(expression));
	var fExpression;
	if (parsedExpression) {
		glsl = toGLSL(parsedExpression);
		fExpression = "return " + glsl + ";\n";
	} else return false;
	
	var fShader = fHeader + fExpression + fFooter;
	var dShader = dHeader + fExpression + dFooter;
	setup(vShader, fShader, dShader, textures);
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
	
	initDataFrameBuffer();
	var textures = initTextures();

	function resize() {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
		data_pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4)
		shouldRedraw = true;
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


function initDataFrameBuffer() {
	dataTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, dataTexture);
	//since apparently many devices can't render to float buffers, we will
	//pack our complex numbers into 4 bytes of RGBA :)
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, window.innerWidth, window.innerHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	
	dataFrameBuffer = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, dataFrameBuffer);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, dataTexture, 0);
	
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

function setup(vSource, fSource, dSource, textures) {
	var vShader = gl.createShader(gl.VERTEX_SHADER);
	var fShader = gl.createShader(gl.FRAGMENT_SHADER);
	var dShader = gl.createShader(gl.FRAGMENT_SHADER);
	

	gl.shaderSource(vShader, vSource);
	gl.shaderSource(fShader, fSource);
	gl.shaderSource(dShader, dSource);
	
	gl.compileShader(vShader);
	gl.compileShader(fShader);
	gl.compileShader(dShader);

	visualProgram = gl.createProgram();
	gl.attachShader(visualProgram, vShader);
	gl.attachShader(visualProgram, fShader);
	gl.linkProgram(visualProgram);
	
	dataProgram = gl.createProgram();
	gl.attachShader(dataProgram, vShader);
	gl.attachShader(dataProgram, dShader);
	gl.linkProgram(dataProgram);
	
	var aPosition = gl.getAttribLocation(visualProgram, "aPosition");
	gl.bindAttribLocation(dataProgram, aPosition, "aPosition");
	
	uBoundsVisual = gl.getUniformLocation(visualProgram, "uBounds");
	uBoundsData = gl.getUniformLocation(dataProgram, "uBounds");

	u_coloring_mode = gl.getUniformLocation(visualProgram, "u_coloring_mode");
	
	u_t_visual = gl.getUniformLocation(visualProgram, "u_t");
	u_t_data = gl.getUniformLocation(dataProgram, "u_t");
	
	var textureUniforms = {};
	var i = 0;
	for (texture in textures) {
		gl.activeTexture(gl["TEXTURE" + i]);
		gl.bindTexture(textures[texture][0], textures[texture][1]);
		gl.uniform1i(gl.getUniformLocation(visualProgram, "u_" + texture), i);
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
	
	shouldRedraw = true;
	
}

function decode_range(a, b, range) {
	var x = (256*a + b) / (256*256);
	return 2*range*x - range;
}

function get_pixel_value(x, y) {
	var i = 4*(y*gl.drawingBufferWidth + x);
	var real_part = decode_range(x[i], x[i+1], 10)
	var imag_part = decode_range(x[i+2], x[i+3], Math.PI)
	var r = Math.exp(real);
	var theta = imag_part;
	real_part = r * Math.cos(theta);
	imag_part = r * Math.sin(theta);
	return [real_part, imag_part]
}

function updateTime(t) {
	T = t || (Date.now() % 5000) / 5000;
	slider.value = T;
	shouldRedraw = true;
}

function render_visual() {
	var [x0, x1, y0, y1] = getBounds();
	gl.useProgram(visualProgram);
	gl.uniform4f(uBoundsVisual, x0, y0, x1, y1);
	gl.uniform1i(u_coloring_mode, coloringMode);
	gl.uniform1f(u_t_visual, T);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function render_data() {
	var [x0, x1, y0, y1] = getBounds();
	gl.useProgram(dataProgram);
	gl.uniform4f(uBoundsData, x0, y0, x1, y1);
	gl.uniform1f(u_t_data, T);
	gl.bindFramebuffer(gl.FRAMEBUFFER, dataFrameBuffer);
	gl.drawArrays(gl.TRIANGLES, 0, 6);
	gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, data_pixels);
}

function render() {
	render_visual();
	render_data();
	shouldRedraw = timeDependent;
}




