import { Complex, getCanvasElementById, getCanvasRenderingContext2D, getWebGL2RenderingContext } from './utils.js';
import { Viewport } from './viewport.js';
import { JuliaSet } from './JuliaSet.js';

// For a zoom, we transform the entire space
const zoomPoint = (cx: number, cy: number, z: number, a: number, b: number) => {
    return { x: a * z - z * cx + cx, y: b * z - z * cy + cy };
};
const zoom = (x: number, y: number, z: number) => {
    // (x,y) - Center of zoom
    // z - Factor of zoom

    // Transform the defining points of the viewport
    let xMin = zoomPoint(x, y, z, vpMandel.xMin, 0).x;
    let xMax = zoomPoint(x, y, z, vpMandel.xMax, 0).x;
    let yMin = zoomPoint(x, y, z, 0, vpMandel.yMin).y;
    let yMax = zoomPoint(x, y, z, 0, vpMandel.yMax).y;
    vpMandel.xMin = xMin;
    vpMandel.xMax = xMax;
    vpMandel.yMin = yMin;
    vpMandel.yMax = yMax;
    console.log(yMin);
    console.log(yMax);

    var xBoundsAttribLocation = glMandel.getUniformLocation(programMandel, 'xBounds');
    glMandel.uniform2f(xBoundsAttribLocation, vpMandel.xMin, vpMandel.xMax);
    var yBoundsAttribLocation = glMandel.getUniformLocation(programMandel, 'yBounds');
    glMandel.uniform2f(yBoundsAttribLocation, vpMandel.yMin, vpMandel.yMax);

    // Main render loop
    glMandel.drawArrays(primitiveType, offset, count);

    //drawMandelbrot(ctx);
    //drawJuliaSet(ctx, juliaSet);
};

const canvasMandel = getCanvasElementById('mandel-canvas');
canvasMandel.width = window.innerWidth;
canvasMandel.height = window.innerHeight;

canvasMandel.addEventListener('wheel', (evt) => {
    let sign = evt.deltaY < 0 ? -1 : 1; // deltaY < 0 -> zoom in
    let x = vpMandel.xToCoord(evt.clientX);
    let y = vpMandel.yToCoord(evt.clientY);
    if (sign < 0) {
        zoom(x, y, 0.5);
    } else {
        zoom(x, y, 1.5);
    }
});

var panningObjMandel = {
    panningCanvas: false,
    startXInCoords: 0,
    startYInCoords: 0,
};

canvasMandel.addEventListener('mousedown', (evt) => {
    panningObjMandel.panningCanvas = true;
    panningObjMandel.startXInCoords = vpMandel.xToCoord(evt.clientX);
    panningObjMandel.startYInCoords = vpMandel.yToCoord(evt.clientY);
});
canvasMandel.addEventListener('mouseup', (evt) => {
    panningObjMandel.panningCanvas = false;
});
canvasMandel.addEventListener('mousemove', (evt) => {
    if (!panningObjMandel.panningCanvas) return;

    // Pan canvas
    // Get difference to starting point
    // Transform space from last position
    let newX = 2 * panningObjMandel.startXInCoords - vpMandel.xToCoord(evt.clientX);
    let newY = 2 * panningObjMandel.startYInCoords - vpMandel.yToCoord(evt.clientY);

    let xMin = vpMandel.xMin - panningObjMandel.startXInCoords + newX;
    let xMax = vpMandel.xMax - panningObjMandel.startXInCoords + newX;
    let yMin = vpMandel.yMin - panningObjMandel.startYInCoords + newY;
    let yMax = vpMandel.yMax - panningObjMandel.startYInCoords + newY;

    vpMandel.xMin = xMin;
    vpMandel.xMax = xMax;
    vpMandel.yMin = yMin;
    vpMandel.yMax = yMax;

    setXYRenderingBounds(glMandel, programMandel, vpMandel);

    // Main render loop
    glMandel.drawArrays(primitiveType, offset, count);
});

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
    precision highp float;
    in vec2 vertPosition;
    in vec3 vertColor;
    out vec3 fragColor;
    void main()
    {
        fragColor = vertColor;
        gl_Position = vec4(vertPosition, 0.0, 1.0);
    }`;

const nrIterations = 100;
const getFragmentShaderText = (zx: string, zy: string, cx: string, cy: string) => {
    var baseFragmentShaderText = `#version 300 es
    precision highp float;
    in vec3 fragColor;
    out vec4 myOutputColor;
    uniform vec2 screenResolution;
    uniform vec2 xBounds;
    uniform vec2 yBounds;
    void main()
    {
        // Convert position on screen to position in coordinate system, as previously done by Viewport
        float x = gl_FragCoord.x / screenResolution.x * (xBounds.y - xBounds.x) + xBounds.x;
        float y = gl_FragCoord.y / screenResolution.y * (yBounds.y - yBounds.x) + yBounds.x;
        vec2 z = vec2(${zx}, ${zy});
        vec2 c = vec2(${cx}, ${cy});
        for (float i = 0.0; i < ${nrIterations}.0; i++)
        {
            z = vec2(z.x*z.x - z.y*z.y, (z.x+z.x) * z.y) + c;
            if (z.x*z.x + z.y*z.y > 4.0) {
                float gray = i + 1. - log(log(sqrt(z.x*z.x + z.y*z.y))) / log(2.0);
                gray = gray * 0.01;
                myOutputColor= vec4(gray, gray, gray, 1.0); 
                return;
            }
        }
    myOutputColor = vec4(0.0, 0.0, 0.0, 1.0);
    }`;

    return baseFragmentShaderText;
};

const setXYRenderingBounds = (gl: WebGL2RenderingContext, program: WebGLProgram, vp: Viewport) => {
    var xBoundsAttribLocation = gl.getUniformLocation(program, 'xBounds');
    gl.uniform2f(xBoundsAttribLocation, vp.xMin, vp.xMax);
    var yBoundsAttribLocation = gl.getUniformLocation(program, 'yBounds');
    gl.uniform2f(yBoundsAttribLocation, vp.yMin, vp.yMax);
};

const setupGL = (gl: WebGL2RenderingContext, program: WebGLProgram, vp: Viewport) => {
    gl.viewport(0, 0, vp.vWidth, vp.vHeight);
    gl.clearColor(0.4, 0.75, 0.2, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // X, Y,  R, G, B
    var triangles = [
        -1.0, 1.0, 1.0, 1.0, 0.0, -1.0, -1.0, 0.8, 0.2, 1.0, 1.0, -1.0, 0.0, 0.4, 0.2, -1.0, 1.0, 1.0, 1.0, 0.0, 1.0,
        -1.0, 0.8, 0.2, 1.0, 1.0, 1.0, 0.0, 0.4, 0.2,
    ];
    var triangleVertexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexBufferObject);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangles), gl.STATIC_DRAW);

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

    setXYRenderingBounds(gl, program, vp);
};

const vpMandel = new Viewport(canvasMandel.width, canvasMandel.height, ctx);

const glMandel = getWebGL2RenderingContext(canvasMandel);
var vertexShaderMandel = createShader(glMandel, glMandel.VERTEX_SHADER, vertexShaderText);
const fragmentShaderTextMandel = getFragmentShaderText('0.0', '0.0', 'x', 'y');
var fragmentShaderMandel = createShader(glMandel, glMandel.FRAGMENT_SHADER, fragmentShaderTextMandel);

var programMandel = createProgram(glMandel, vertexShaderMandel, fragmentShaderMandel);
setupGL(glMandel, programMandel, vpMandel);

// Main render loop
const primitiveType = glMandel.TRIANGLES;
const offset = 0;
const count = 3 * 2;
glMandel.drawArrays(primitiveType, offset, count);
