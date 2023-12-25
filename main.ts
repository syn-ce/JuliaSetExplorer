import { Complex, getCanvasElementById, getCanvasRenderingContext2D, getWebGL2RenderingContext } from './utils.js';
import { Viewport } from './viewport.js';
import { JuliaSet } from './JuliaSet.js';

// For a zoom, we transform the entire space
const zoomPoint = (cx: number, cy: number, z: number, a: number, b: number) => {
    return { x: a * z - z * cx + cx, y: b * z - z * cy + cy };
};

// TODO: fix zoom for julia-canvas
const zoom = (gl: WebGL2RenderingContext, glProgram: WebGLProgram, vp: Viewport, x: number, y: number, z: number) => {
    // (x,y) - Center of zoom
    // z - Factor of zoom

    // Transform the defining points of the viewport
    let xMin = zoomPoint(x, y, z, vp.xMin, 0).x;
    let xMax = zoomPoint(x, y, z, vp.xMax, 0).x;
    let yMin = zoomPoint(x, y, z, 0, vp.yMin).y;
    let yMax = zoomPoint(x, y, z, 0, vp.yMax).y;
    console.log(xMin, xMax, yMin, yMax);
    vp.xMin = xMin;
    vp.xMax = xMax;
    vp.yMin = yMin;
    vp.yMax = yMax;
    console.log(yMin);
    console.log(yMax);

    setXYRenderingBounds(gl, glProgram, vp);

    // Render
    renderGL(gl);
};

const canvasMandel = getCanvasElementById('mandel-canvas');
canvasMandel.width = window.innerWidth / 2;
canvasMandel.height = window.innerHeight;

const canvasJulia = getCanvasElementById('julia-canvas');
canvasJulia.width = window.innerWidth / 2;
canvasJulia.height = window.innerHeight;
const juliaCCoords = { x: 0.0, y: 0.0 };

type PanningObj = {
    panningCanvas: boolean;
    startXInCoords: number;
    startYInCoords: number;
};

const canvasAddPanZoom = (
    canvas: HTMLCanvasElement,
    panningObject: PanningObj,
    vp: Viewport,
    gl: WebGL2RenderingContext,
    glProgram: WebGLProgram
) => {
    // Zoom
    canvas.addEventListener('wheel', (evt) => {
        let sign = evt.deltaY < 0 ? -1 : 1; // deltaY < 0 -> zoom in
        let x = vp.xToCoord(evt.clientX);
        let y = vp.yToCoord(evt.clientY);
        if (sign < 0) {
            zoom(gl, glProgram, vp, x, y, 0.5);
        } else {
            zoom(gl, glProgram, vp, x, y, 1.5);
        }
    });

    // Pan
    canvas.addEventListener('mousedown', (evt) => {
        panningObject.panningCanvas = true;
        panningObject.startXInCoords = vp.xToCoord(evt.clientX);
        panningObject.startYInCoords = vp.yToCoord(evt.clientY);
    });
    canvas.addEventListener('mouseup', (evt) => {
        panningObject.panningCanvas = false;
    });
    canvas.addEventListener('mousemove', (evt) => {
        if (!panningObject.panningCanvas) return;

        // Pan canvas
        // Get difference to starting point
        // Transform space from last position
        let newX = 2 * panningObject.startXInCoords - vp.xToCoord(evt.clientX);
        let newY = 2 * panningObject.startYInCoords - vp.yToCoord(evt.clientY);

        let xMin = vp.xMin - panningObject.startXInCoords + newX;
        let xMax = vp.xMax - panningObject.startXInCoords + newX;
        let yMin = vp.yMin - panningObject.startYInCoords + newY;
        let yMax = vp.yMax - panningObject.startYInCoords + newY;

        vp.xMin = xMin;
        vp.xMax = xMax;
        vp.yMin = yMin;
        vp.yMax = yMax;

        setXYRenderingBounds(gl, glProgram, vp);

        // Main render loop
        renderGL(gl);
    });
};

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
const getFragmentShaderText = (z: string, c: string, additionalVariables: string) => {
    var baseFragmentShaderText = `#version 300 es
    precision highp float;
    in vec3 fragColor;
    out vec4 myOutputColor;
    uniform vec2 screenResolution;
    uniform float escapeRadius;
    ${additionalVariables}
    uniform vec2 xBounds;
    uniform vec2 yBounds;
    void main()
    {
        // Convert position on screen to position in coordinate system, as previously done by Viewport
        float x = gl_FragCoord.x / screenResolution.x * (xBounds.y - xBounds.x) + xBounds.x;
        float y = gl_FragCoord.y / screenResolution.y * (yBounds.y - yBounds.x) + yBounds.x;
        vec2 z = ${z};
        vec2 c = ${c};
        for (float i = 0.0; i < ${nrIterations}.0; i++)
        {
            z = vec2(z.x*z.x - z.y*z.y, (z.x+z.x) * z.y) + c;
            if (z.x*z.x + z.y*z.y > escapeRadius) {
                float gray = i + 1. - log(log(sqrt(z.x*z.x + z.y*z.y))) / log(2.0);
                gray = gray / ${nrIterations + 1}.0;
                myOutputColor= vec4(gray*0.2, gray*1.2, gray*gray, 1.0); 
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

    var screenStartAttribLocation = gl.getUniformLocation(program, 'screenStart');
    gl.uniform2f(screenStartAttribLocation, vp.screenStart.x, vp.screenStart.y);

    setXYRenderingBounds(gl, program, vp);

    setEscapeRadius(gl, program, vp, escapeRadius);
};

var escapeRadius = 4.0;
const renderGL = (gl: WebGL2RenderingContext) => gl.drawArrays(primitiveType, offset, count);

const setEscapeRadius = (gl: WebGL2RenderingContext, glProgram: WebGLProgram, vp: Viewport, escapeRadius: number) => {
    var escapeRadiusAttribLocation = gl.getUniformLocation(glProgram, 'escapeRadius');
    gl.uniform1f(escapeRadiusAttribLocation, escapeRadius);
};

const escapeRadiusInput = <HTMLInputElement>document.getElementById('escape-radius');
escapeRadiusInput.value = escapeRadius.toString();
escapeRadiusInput.addEventListener('input', (evt) => {
    let val = parseFloat((<HTMLInputElement>evt.currentTarget).value);
    setEscapeRadius(glMandel, programMandel, vpMandel, val);
    setEscapeRadius(glJulia, programJulia, vpJulia, val);

    renderGL(glMandel);
    renderGL(glJulia);
});

// Mandel-canvas
const vpMandel = new Viewport(canvasMandel.width, canvasMandel.height, 0, 0, ctx);
const glMandel = getWebGL2RenderingContext(canvasMandel);
var vertexShaderMandel = createShader(glMandel, glMandel.VERTEX_SHADER, vertexShaderText);
const fragmentShaderTextMandel = getFragmentShaderText('vec2(0.0,0.0)', 'vec2(x,y)', '');
var fragmentShaderMandel = createShader(glMandel, glMandel.FRAGMENT_SHADER, fragmentShaderTextMandel);

var programMandel = createProgram(glMandel, vertexShaderMandel, fragmentShaderMandel);
setupGL(glMandel, programMandel, vpMandel);

var panningObjMandel: PanningObj = {
    panningCanvas: false,
    startXInCoords: 0,
    startYInCoords: 0,
};

canvasAddPanZoom(canvasMandel, panningObjMandel, vpMandel, glMandel, programMandel);
var juliaFollowsMouse = true;
// Enable reactive julia rendering
canvasMandel.addEventListener('mousemove', (evt) => {
    if (!juliaFollowsMouse || panningObjMandel.panningCanvas) return;

    // Draw the juliaSet corresponding to the point hovered
    let x = vpMandel.xToCoord(evt.clientX);
    let y = vpMandel.yToCoord(evt.clientY);

    updateJuliaCCoords(x, y);
});

// Enable pausing of reactive julia rendering
window.addEventListener('keydown', (evt) => {
    if (evt.code == 'Space') juliaFollowsMouse = !juliaFollowsMouse;
});

function DownloadCanvasAsImage() {
    let downloadLink = document.createElement('a');
    downloadLink.setAttribute('download', `JuliaSet_${escapeRadius}_${juliaCCoords.x}_${juliaCCoords.y}.png`);
    let canvas = <HTMLCanvasElement>document.getElementById('julia-canvas');
    canvas.toBlob((blob) => {
        let url = URL.createObjectURL(blob);
        downloadLink.setAttribute('href', url);
        downloadLink.click();
    });
}

const saveJuliaPNGBtn = document.getElementById('save-julia-png-btn');
saveJuliaPNGBtn.onclick = (evt) => {
    updateJuliaCCoords(juliaCCoords.x, juliaCCoords.y); // Needed because the canvas' buffer will be cleared and
    // therefore empty at this point, which would result in an empty (all transparent/black) image being downloaded
    DownloadCanvasAsImage();
};

const primitiveType = glMandel.TRIANGLES;
const offset = 0;
const count = 3 * 2;

// Julia-canvas
const vpJulia = new Viewport(canvasJulia.width, canvasJulia.height, vpMandel.vWidth, 0, ctx); // Located to the right of vpMandel
const glJulia = getWebGL2RenderingContext(canvasJulia);
var vertextShaderJulia = createShader(glJulia, glJulia.VERTEX_SHADER, vertexShaderText);
const fragmentShaderTextJulia = getFragmentShaderText('vec2(x,y)', 'cCoords', 'uniform vec2 cCoords;');

const fragmentShaderJulia = createShader(glJulia, glJulia.FRAGMENT_SHADER, fragmentShaderTextJulia);
const programJulia = createProgram(glJulia, vertextShaderJulia, fragmentShaderJulia);
setupGL(glJulia, programJulia, vpJulia);

const juliaCenterIndicatorWrapper = document.getElementById('julia-center-coords-indicator-wrapper');
const juliaCenterIndicator = document.getElementById('julia-center-coords-indicator');
const juliaCenterIndicatorDimensions = { x: 5, y: 5 };
juliaCenterIndicatorWrapper.style.width = juliaCenterIndicatorDimensions.x.toString();
juliaCenterIndicatorWrapper.style.height = juliaCenterIndicatorDimensions.y.toString();

const updateCenterIndicator = (
    vpMandel: Viewport,
    juliaCCoords: { x: number; y: number },
    juliaCenterIndicatorWrapper: HTMLElement,
    juliaCenterIndicatorDimensions: { x: number; y: number }
) => {
    let xIndicator = vpMandel.coordToX(juliaCCoords.x) - juliaCenterIndicatorDimensions.x / 2;
    let yIndicator = vpMandel.coordToY(juliaCCoords.y) - juliaCenterIndicatorDimensions.y / 2;

    if (
        // Check if indicator is out of bounds (hide overflow)
        xIndicator - juliaCenterIndicatorDimensions.x < vpMandel.screenStart.x ||
        xIndicator + juliaCenterIndicatorDimensions.x > vpMandel.screenStart.x + vpMandel.vWidth ||
        yIndicator - juliaCenterIndicatorDimensions.y < vpMandel.screenStart.y ||
        yIndicator + juliaCenterIndicatorDimensions.y > vpMandel.screenStart.y + vpMandel.vHeight
    ) {
        juliaCenterIndicatorWrapper.style.display = 'none';
    } else {
        juliaCenterIndicatorWrapper.style.display = '';
    }

    juliaCenterIndicatorWrapper.style.left = xIndicator.toString();
    juliaCenterIndicatorWrapper.style.top = yIndicator.toString();
};

const updateJuliaCCoords = (x: number, y: number) => {
    juliaCCoords.x = x;
    juliaCCoords.y = y;

    updateCenterIndicator(vpMandel, juliaCCoords, juliaCenterIndicatorWrapper, juliaCenterIndicatorDimensions);

    var cCoordsAttribLocation = glJulia.getUniformLocation(programJulia, 'cCoords');
    glJulia.uniform2f(cCoordsAttribLocation, juliaCCoords.x, juliaCCoords.y);

    renderGL(glJulia);
};

updateJuliaCCoords(0.0, 0.0);

var panningObjJulia: PanningObj = {
    panningCanvas: false,
    startXInCoords: 0,
    startYInCoords: 0,
};

canvasAddPanZoom(canvasJulia, panningObjJulia, vpJulia, glJulia, programJulia);

// Main render loop
renderGL(glMandel);

renderGL(glJulia);

// Update center indicator when panning
canvasMandel.addEventListener('mousemove', (evt) => {
    if (!panningObjMandel.panningCanvas) return;

    updateCenterIndicator(vpMandel, juliaCCoords, juliaCenterIndicatorWrapper, juliaCenterIndicatorDimensions);
});

// Update center indicator when zooming
canvasMandel.addEventListener('wheel', (evt) => {
    updateCenterIndicator(vpMandel, juliaCCoords, juliaCenterIndicatorWrapper, juliaCenterIndicatorDimensions);
});

const juliaXCoordInput = <HTMLInputElement>document.getElementById('julia-center-x');
const juliaYCoordInput = <HTMLInputElement>document.getElementById('julia-center-y');
juliaXCoordInput.value = juliaCCoords.x.toString();
juliaYCoordInput.value = juliaCCoords.y.toString();

juliaXCoordInput.addEventListener('input', (evt) => {
    juliaCCoords.x = parseFloat((<HTMLInputElement>evt.currentTarget).value);
    updateJuliaCCoords(juliaCCoords.x, juliaCCoords.y);
    renderGL(glJulia);
});

juliaYCoordInput.addEventListener('input', (evt) => {
    juliaCCoords.y = parseFloat((<HTMLInputElement>evt.currentTarget).value);
    updateJuliaCCoords(juliaCCoords.x, juliaCCoords.y);
    renderGL(glJulia);
});

const updateJuliaCenterDisplayValues = (x: number, y: number) => {
    juliaXCoordInput.value = x.toString().substring(0, 6 + (x < 0 ? 1 : 0));
    juliaYCoordInput.value = y.toString().substring(0, 6 + (y < 0 ? 1 : 0));
};

canvasMandel.addEventListener('mousemove', (evt) => {
    let x = vpMandel.xToCoord(evt.clientX);
    let y = vpMandel.yToCoord(evt.clientY);
    if (!juliaFollowsMouse) return;
    updateJuliaCenterDisplayValues(x, y);
});

const distance = (point1: { x: number; y: number }, point2: { x: number; y: number }) => {
    return Math.sqrt((point2.x - point1.x) ** 2 + (point2.y - point1.y) ** 2);
};

function randomJuliaMovement() {
    let xMin = -2.0;
    let xMax = 1.5;
    let yMin = -1.5;
    let yMax = 1.5;
    // Move to this destination for a couply of frames
    let nrFrames = 60;

    let acceleration = { x: 0.0, y: 0.0 };
    let velocity = { x: 0.0, y: 0.0 };

    const delay = 1000 / 60;
    var nextDestination: { x: number; y: number };

    async function outerLoop(i: number) {
        // Determine random next point to move to inside the defined area
        nextDestination = { x: Math.random() * (xMax - xMin) + xMin, y: Math.random() * (yMax - yMin) + yMin };
        innerLoop(0).then(() => outerLoop(i));
    }

    async function innerLoop(frameNr: number) {
        return new Promise((resolve, reject) => {
            // Adjust the acceleration to point towards the destination
            acceleration = { x: nextDestination.x - juliaCCoords.x, y: nextDestination.y - juliaCCoords.y };
            velocity.x += acceleration.x * 0.0001;
            velocity.y += acceleration.y * 0.0001;

            juliaCCoords.x += velocity.x;
            juliaCCoords.y += velocity.y;

            updateJuliaCenterDisplayValues(juliaCCoords.x, juliaCCoords.y);

            updateJuliaCCoords(juliaCCoords.x, juliaCCoords.y);
            renderGL(glJulia);
            if (frameNr < nrFrames && distance(nextDestination, juliaCCoords) > 0.0001) {
                setTimeout(() => {
                    innerLoop(frameNr + 1).then(() => resolve(''));
                }, delay);
            } else setTimeout(() => resolve(''), delay);
        });
    }

    outerLoop(0);
}

const randomMovementBtn = document.getElementById('random-movement');
randomMovementBtn.onclick = (evt) => {
    randomJuliaMovement();
};
