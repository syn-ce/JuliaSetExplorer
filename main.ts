import { Complex, getCanvasElementById, getCanvasRenderingContext2D, getWebGL2RenderingContext } from './utils.js';
import { Viewport } from './viewport.js';
import { JuliaSet } from './JuliaSet.js';

//document.getElementById('x-offset-in').oninput = (evt) => {
//    let val = (evt.currentTarget as HTMLInputElement).value;
//    document.getElementById('x-offset-out').innerHTML = 'x-off: ' + val;
//    vp.setXOffset(parseFloat(val));
//    drawMandelbrot(ctx);
//};
//
//document.getElementById('y-offset-in').oninput = (evt) => {
//    let val = (evt.currentTarget as HTMLInputElement).value;
//    document.getElementById('y-offset-out').innerHTML = 'y-off: ' + val;
//    vp.setYOffset(parseFloat(val));
//    drawMandelbrot(ctx);
//};

// For a zoom, we transform the entire space
const zoomPoint = (cx: number, cy: number, z: number, a: number, b: number) => {
    return { x: a * z - z * cx + cx, y: b * z - z * cy + cy };
};
const zoom = (x: number, y: number, z: number) => {
    // (x,y) - Center of zoom
    // z - Factor of zoom

    // Transform the defining points of the viewport
    let xMin = zoomPoint(x, y, z, vp.xMin, 0).x;
    let xMax = zoomPoint(x, y, z, vp.xMax, 0).x;
    let yMin = zoomPoint(x, y, z, 0, vp.yMin).y;
    let yMax = zoomPoint(x, y, z, 0, vp.yMax).y;
    vp.xMin = xMin;
    vp.xMax = xMax;
    vp.yMin = yMin;
    vp.yMax = yMax;
    console.log(yMin);
    console.log(yMax);

    var xBoundsAttribLocation = gl.getUniformLocation(program, 'xBounds');
    gl.uniform2f(xBoundsAttribLocation, vp.xMin, vp.xMax);
    var yBoundsAttribLocation = gl.getUniformLocation(program, 'yBounds');
    gl.uniform2f(yBoundsAttribLocation, vp.yMin, vp.yMax);

    // Main render loop
    gl.drawArrays(primitiveType, offset, count);

    //drawMandelbrot(ctx);
    //drawJuliaSet(ctx, juliaSet);
};

const canvas = getCanvasElementById('main-canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

canvas.addEventListener('wheel', (evt) => {
    let sign = evt.deltaY < 0 ? -1 : 1; // deltaY < 0 -> zoom in
    let x = vp.xToCoord(evt.clientX);
    let y = vp.yToCoord(evt.clientY);
    if (sign < 0) {
        zoom(x, y, 0.5);
    } else {
        zoom(x, y, 1.5);
    }
});

var panningObj = {
    panningCanvas: false,
    startXInCoords: 0,
    startYInCoords: 0,
};

canvas.addEventListener('mousedown', (evt) => {
    panningObj.panningCanvas = true;
    panningObj.startXInCoords = vp.xToCoord(evt.clientX);
    panningObj.startYInCoords = vp.yToCoord(evt.clientY);
});
canvas.addEventListener('mouseup', (evt) => {
    panningObj.panningCanvas = false;
});
canvas.addEventListener('mousemove', (evt) => {
    if (!panningObj.panningCanvas) return;

    // Pan canvas
    // Get difference to starting point
    // Transform space from last position
    let newX = 2 * panningObj.startXInCoords - vp.xToCoord(evt.clientX);
    let newY = 2 * panningObj.startYInCoords - vp.yToCoord(evt.clientY);
    let matrix = [
        [1, 0, -panningObj.startXInCoords + newX],
        [0, 1, -panningObj.startYInCoords + newY],
        [0, 0, 1],
    ];
    let xMin = vp.xMin - panningObj.startXInCoords + newX;
    let xMax = vp.xMax - panningObj.startXInCoords + newX;
    let yMin = vp.yMin - panningObj.startYInCoords + newY;
    let yMax = vp.yMax - panningObj.startYInCoords + newY;

    vp.xMin = xMin;
    vp.xMax = xMax;
    vp.yMin = yMin;
    vp.yMax = yMax;

    gl.uniform2f(xBoundsAttribLocation, vp.xMin, vp.xMax);
    gl.uniform2f(yBoundsAttribLocation, vp.yMin, vp.yMax);

    // Main render loop
    gl.drawArrays(primitiveType, offset, count);
});

//canvas.onclick = (evt) => {
//    console.log(evt.clientX);
//    console.log(evt.clientY);
//    console.log(vp.xToCoord(evt.clientX));
//    console.log(vp.yToCoord(evt.clientY));
//    let startTime = performance.now();
//    zoom(vp.xToCoord(evt.clientX), vp.yToCoord(evt.clientY), 0.5);
//    console.log('time taken: ');
//    console.log(performance.now() - startTime);
//};

const ctx = null; //getCanvasRenderingContext2D(canvas);

const createShader = (gl: WebGL2RenderingContext, type: number, source: string) => {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(`ERROR compliling shader of type ${type}!`, gl.getShaderInfoLog(shader));
    } else {
        // Success
        return shader;
    }
};

const createProgram = (gl: WebGL2RenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) => {
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.validateProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('ERROR linking program!', gl.getProgramInfoLog(program));
    } else if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
        console.error('ERROR validating program!', gl.getProgramInfoLog(program));
    } else {
        // Success
        return program;
    }

    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
};

var vertexShaderText = `#version 300 es
    precision mediump float;
    in vec2 vertPosition;
    in vec3 vertColor;
    out vec3 fragColor;
    void main()
    {
        fragColor = vertColor;
        gl_Position = vec4(vertPosition, 0.0, 1.0);
    }`;

var fragmentShaderText = `#version 300 es
    precision mediump float;
    in vec3 fragColor;
    out vec4 myOutputColor;
    uniform vec2 screenResolution;
    uniform vec2 xBounds;
    uniform vec2 yBounds;
    void main()
    {
        vec2 z = vec2(0.0, 0.0); // (x * (this.xMax - this.xMin)) / this.vWidth + this.xMin
        // Convert position on screen to position in coordinate system, as previously done by Viewport
        float x = gl_FragCoord.x / screenResolution.x * (xBounds.y - xBounds.x) + xBounds.x;
        float y = gl_FragCoord.y / screenResolution.y * (yBounds.y - yBounds.x) + yBounds.x;
        vec2 c = vec2(x, y);
        for (float i = 0.0; i < 100.0; i++)
        {
            z = vec2(z.x*z.x - z.y*z.y, 2.0 * z.x * z.y) + c;
            if (z.x*z.x + z.y*z.y > 4.0) {
                float gray = i + 1. - log(log(sqrt(z.x*z.x + z.y*z.y))) / log(2.0);
                gray = gray / 100.0;
                myOutputColor= vec4(gray, gray, gray, 1.0); 
                return;
            }
        }
    myOutputColor = vec4(0.0, 0.0, 0.0, 1.0);
    }`;

const initialiseMandelbrotShader = () => {};

const vp = new Viewport(canvas.width, canvas.height, ctx);

const gl = getWebGL2RenderingContext(canvas);
gl.viewport(0, 0, vp.vWidth, vp.vHeight);
gl.clearColor(0.4, 0.75, 0.2, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderText);
var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderText);

var program = createProgram(gl, vertexShader, fragmentShader);

// X, Y,  R, G, B
var bottomLeft = [
    -1.0, 1.0, 1.0, 1.0, 0.0, -1.0, -1.0, 0.8, 0.2, 1.0, 1.0, -1.0, 0.0, 0.4, 0.2, -1.0, 1.0, 1.0, 1.0, 0.0, 1.0, -1.0,
    0.8, 0.2, 1.0, 1.0, 1.0, 0.0, 0.4, 0.2,
];
var triangleVertexBufferObject = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexBufferObject);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bottomLeft), gl.STATIC_DRAW);

var positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
var colorAttribLocation = gl.getAttribLocation(program, 'vertColor');

var vao = gl.createVertexArray();
gl.bindVertexArray(vao);
gl.enableVertexAttribArray(positionAttribLocation);
gl.enableVertexAttribArray(colorAttribLocation);

gl.vertexAttribPointer(
    positionAttribLocation, // Attribute location
    2, // Number of elements per attribute
    gl.FLOAT, // Type of elements
    false,
    5 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
    0 // Offset from the beginning of a single vertex to this attribute
);

gl.vertexAttribPointer(
    colorAttribLocation, // Attribute location
    3, // Number of elements per attribute
    gl.FLOAT, // Type of elements
    false,
    5 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
    2 * Float32Array.BYTES_PER_ELEMENT // Offset from the beginning of a single vertex to this attribute
);

gl.useProgram(program);
gl.bindVertexArray(vao); // Not sure why this is needed, seems to be working fine without it

var screenResAttribLocation = gl.getUniformLocation(program, 'screenResolution');
gl.uniform2f(screenResAttribLocation, vp.vWidth, vp.vHeight);

var xBoundsAttribLocation = gl.getUniformLocation(program, 'xBounds');
gl.uniform2f(xBoundsAttribLocation, vp.xMin, vp.xMax);
var yBoundsAttribLocation = gl.getUniformLocation(program, 'yBounds');
gl.uniform2f(yBoundsAttribLocation, vp.yMin, vp.yMax);

// Main render loop
const primitiveType = gl.TRIANGLES;
const offset = 0;
const count = 3 * 2;
gl.drawArrays(primitiveType, offset, count);

const nrIterations = 100;

const getColorValueMandelbrot = (x: number, y: number) => {
    let z = { real: 0, imag: 0 };
    let c = { real: x, imag: y };

    for (let i = 0; i < nrIterations; i++) {
        let real = z.real * z.real - z.imag * z.imag + c.real;
        let imag = (z.imag = 2 * z.real * z.imag + c.imag);

        //let real = z.real ** 3 - 3 * z.real * z.imag * z.imag;
        //let imag = -(z.imag ** 3) + 3 * z.real * z.real * y;
        z.real = real;
        z.imag = imag;

        if (z.real * z.real + z.imag * z.imag > 4) {
            return 1; // Lies outside
        }
    }

    return 0; // Lies inside
};

const drawSet = (ctx: CanvasRenderingContext2D, getColor: (x: number, y: number) => number) => {
    var startTime = performance.now();
    let zeroValues = 0;
    const imageData = ctx.getImageData(0, 0, window.innerWidth, window.innerHeight);
    const data = imageData.data;
    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            let ind = (y * canvas.width + x) * 4;
            let val = getColor(vp.xToCoord(x), vp.yToCoord(y));
            if (val == 0) zeroValues++;

            data[ind] = val * 255;
            data[ind + 1] = val * 255;
            data[ind + 2] = val * 255;
            data[ind + 3] = 255;
        }
    }
    console.log((zeroValues / canvas.width / canvas.height) * (vp.xMax - vp.xMin) * (vp.yMax - vp.yMin)); // This is a VERY rough estimate for the area
    // of the set; Moreover, this assumes the entirety of the set being visible on the screen. For the Mandelbrot set at 1000 iterations, it yields a
    // value of ~1.51
    console.log(`time taken: ${performance.now() - startTime}`);
    ctx.putImageData(imageData, 0, 0, 0, 0, window.innerWidth, window.innerHeight);
};

const getEscapeTime = (x: number, y: number) => {
    let z = { real: 0, imag: 0 };
    let c = { real: x, imag: y };

    for (let i = 0; i < nrIterations; i++) {
        let real = z.real * z.real - z.imag * z.imag + c.real;
        let imag = (z.imag = 2 * z.real * z.imag + c.imag);

        z.real = real;
        z.imag = imag;

        if (z.real * z.real + z.imag * z.imag > 4) {
            return i; // Lies outside
        }
    }

    return 0;
};

const drawMandelbrotEscapeTime = (ctx: CanvasRenderingContext2D) => {
    const values: number[] = [];
    let max = 0;
    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            let val = getEscapeTime(vp.xToCoord(x), vp.yToCoord(y));
            values.push(val);
            if (val > max) max = val;
        }
    }

    const imageData = ctx.getImageData(0, 0, window.innerWidth, window.innerHeight);
    const data = imageData.data;
    for (let i = 0; i < values.length; i++) {
        let val = (values[i] / max) * 255;
        let ind = i * 4;
        data[ind] = val;
        data[ind + 1] = val;
        data[ind + 2] = val;
        data[ind + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0, 0, 0, window.innerWidth, window.innerHeight);
};

const drawMandelbrot = (ctx: CanvasRenderingContext2D) => drawSet(ctx, getColorValueMandelbrot);
//drawMandelbrot(ctx);
//drawMandelbrotEscapeTime(ctx);

const juliaSet = new JuliaSet({ real: -0.5, imag: 0.5 }, nrIterations);
const drawJuliaSet = (ctx: CanvasRenderingContext2D, juliaSet: JuliaSet) => drawSet(ctx, juliaSet.getColorValue);
//drawJuliaSet(ctx, juliaSet);
