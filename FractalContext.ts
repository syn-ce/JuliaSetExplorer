import { createProgram, createShader, vertexShaderText } from './glutils.js';
import { hexToRGB, normalizeRGB } from './ui.js';
import { PanningObj, RGBColor, getWebGL2RenderingContext, zoomPoint } from './utils.js';
import { Viewport } from './viewport.js';

export class FractalContext {
    gl: WebGL2RenderingContext;
    glProgram: WebGLProgram;
    vp: Viewport;
    canvas: HTMLCanvasElement;
    primitiveType: number;
    offset: number;
    count: number;
    escapeRadius: number;
    nrIterations: number;
    exponent: number;
    rgbColor: RGBColor;
    panningObject: PanningObj;
    timeOfLastRender: number;
    FPS: number;
    frameInterval: number;

    constructor(
        canvas: HTMLCanvasElement,
        width: number,
        height: number,
        screenStart: { x: number; y: number },
        fragmentShaderText: string
    ) {
        this.canvas = canvas;
        this.canvas.width = width;
        this.canvas.height = height;

        this.nrIterations = 100;

        this.vp = new Viewport(canvas.width, canvas.height, screenStart.x, screenStart.y, null);
        this.escapeRadius = 4.0;
        this.exponent = 2.0;

        this.gl = getWebGL2RenderingContext(canvas);
        var vertexShader = createShader(this.gl, this.gl.VERTEX_SHADER, vertexShaderText);
        //const fragmentShaderText = getFragmentShaderText(this.nrIterations, 'vec2(0.0,0.0)', 'vec2(x,y)', '');
        var fragmentShader = createShader(this.gl, this.gl.FRAGMENT_SHADER, fragmentShaderText);

        this.glProgram = createProgram(this.gl, vertexShader, fragmentShader);

        this.primitiveType = this.gl.TRIANGLES;
        this.offset = 0;
        this.count = 3 * 2;

        this.timeOfLastRender = 0.0;
        this.FPS = 120;
        this.frameInterval = 1000 / this.FPS;

        this.setupGL();
    }

    setColorValues = (rgbColor: RGBColor) => {
        this.rgbColor = rgbColor;
        var rgbColorAttribLocation = this.gl.getUniformLocation(this.glProgram, 'rgbColor');
        this.gl.uniform3f(rgbColorAttribLocation, this.rgbColor.r, this.rgbColor.g, this.rgbColor.b);
    };

    setEscapeRadius = (escapeRadius: number) => {
        this.escapeRadius = escapeRadius;
        var escapeRadiusAttribLocation = this.gl.getUniformLocation(this.glProgram, 'escapeRadius');
        this.gl.uniform1f(escapeRadiusAttribLocation, this.escapeRadius);
    };

    setXYRenderingBounds = (yMin: number, yMax: number, xMin: number) => {
        this.vp.updateXYBounds(yMin, yMax, xMin);

        var xBoundsAttribLocation = this.gl.getUniformLocation(this.glProgram, 'xBounds');
        this.gl.uniform2f(xBoundsAttribLocation, this.vp.xMin, this.vp.xMax);
        var yBoundsAttribLocation = this.gl.getUniformLocation(this.glProgram, 'yBounds');
        this.gl.uniform2f(yBoundsAttribLocation, this.vp.yMin, this.vp.yMax);
    };

    setExponent = (exponent: number) => {
        this.exponent = exponent;
        var exponentAttribLocation = this.gl.getUniformLocation(this.glProgram, 'exponent');
        this.gl.uniform1f(exponentAttribLocation, this.exponent);
    };

    render = () => {
        // Could be improved by "Queuing" the render
        if (Date.now() - this.timeOfLastRender >= this.frameInterval) {
            this.timeOfLastRender = Date.now();
            this.gl.drawArrays(this.primitiveType, this.offset, this.count);
        }
    };

    setupGL = () => {
        this.gl.viewport(0, 0, this.vp.vWidth, this.vp.vHeight);
        this.gl.clearColor(0.4, 0.75, 0.2, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        // X, Y,  R, G, B
        var triangles = [
            -1.0, 1.0, 1.0, 1.0, 0.0, -1.0, -1.0, 0.8, 0.2, 1.0, 1.0, -1.0, 0.0, 0.4, 0.2, -1.0, 1.0, 1.0, 1.0, 0.0,
            1.0, -1.0, 0.8, 0.2, 1.0, 1.0, 1.0, 0.0, 0.4, 0.2,
        ];
        var triangleVertexBufferObject = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, triangleVertexBufferObject);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(triangles), this.gl.STATIC_DRAW);

        var positionAttribLocation = this.gl.getAttribLocation(this.glProgram, 'vertPosition');
        var colorAttribLocation = this.gl.getAttribLocation(this.glProgram, 'vertColor');

        var vao = this.gl.createVertexArray();
        this.gl.bindVertexArray(vao);
        this.gl.enableVertexAttribArray(positionAttribLocation);
        this.gl.enableVertexAttribArray(colorAttribLocation);

        this.gl.vertexAttribPointer(
            positionAttribLocation, // Attribute location
            2, // Number of elements per attribute
            this.gl.FLOAT, // Type of elements
            false,
            5 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
            0 // Offset from the beginning of a single vertex to this attribute
        );

        this.gl.vertexAttribPointer(
            colorAttribLocation, // Attribute location
            3, // Number of elements per attribute
            this.gl.FLOAT, // Type of elements
            false,
            5 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
            2 * Float32Array.BYTES_PER_ELEMENT // Offset from the beginning of a single vertex to this attribute
        );

        this.gl.useProgram(this.glProgram);
        this.gl.bindVertexArray(vao); // Not sure why this is needed, seems to be working fine without it

        this.setScreenResolution(this.vp.vWidth, this.vp.vHeight);

        this.setScreenStart(this.vp.screenStart.x, this.vp.screenStart.y);

        this.setXYRenderingBounds(-2.0, 2.0, -2.0);

        this.setEscapeRadius(100.0);

        this.setExponent(2.0);

        this.setColorValues({ r: 0.0, g: 0.1, b: 0.1 });

        this.addPanZoomToCanvas();
    };

    zoom = (x: number, y: number, z: number) => {
        // (x,y) - Center of zoom
        // z - Factor of zoom

        let vp = this.vp;
        // Transform the defining points of the viewport
        let xMin = zoomPoint(x, y, z, vp.xMin, 0).x;
        let yMin = zoomPoint(x, y, z, 0, vp.yMin).y;
        let yMax = zoomPoint(x, y, z, 0, vp.yMax).y;

        this.setXYRenderingBounds(yMin, yMax, xMin);

        // Render
        this.render();
    };

    addPanZoomToCanvas = () => {
        // Zoom
        this.panningObject = { panningCanvas: false, startXInCoords: 0, startYInCoords: 0 };

        this.canvas.addEventListener('wheel', (evt) => {
            let sign = evt.deltaY < 0 ? -1 : 1; // deltaY < 0 -> zoom in
            let vp = this.vp;
            let x = vp.xToCoord(evt.clientX);
            let y = vp.yToCoord(evt.clientY);
            if (sign < 0) {
                this.zoom(x, y, 0.625);
            } else {
                this.zoom(x, y, 1.6);
            }
        });

        // Pan
        this.canvas.addEventListener('mousedown', (evt) => {
            this.panningObject.panningCanvas = true;
            let vp = this.vp;
            this.panningObject.startXInCoords = vp.xToCoord(evt.clientX);
            this.panningObject.startYInCoords = vp.yToCoord(evt.clientY);
        });
        this.canvas.addEventListener('mouseup', (evt) => {
            this.panningObject.panningCanvas = false;
        });
        this.canvas.addEventListener('mousemove', (evt) => {
            if (!this.panningObject.panningCanvas) return;
            let vp = this.vp;

            // Pan canvas
            // Get difference to starting point
            // Transform space from last position
            let newX = 2 * this.panningObject.startXInCoords - vp.xToCoord(evt.clientX);
            let newY = 2 * this.panningObject.startYInCoords - vp.yToCoord(evt.clientY);

            let xMin = vp.xMin - this.panningObject.startXInCoords + newX;
            let yMin = vp.yMin - this.panningObject.startYInCoords + newY;
            let yMax = vp.yMax - this.panningObject.startYInCoords + newY;

            this.setXYRenderingBounds(yMin, yMax, xMin);

            // Main render loop
            this.render();
        });
    };

    addColorInputListener = (colorPickerId: string) => {
        const colorPicker = document.getElementById(colorPickerId);

        colorPicker.addEventListener('input', (evt) => {
            let rgbColor = normalizeRGB(hexToRGB((<HTMLInputElement>evt.currentTarget).value));
            this.setColorValues(rgbColor);
            this.render();
        });
    };

    addEscapeRadiusInputListener = (escapeRadiusInputId: string) => {
        const escapeRadiusInput = <HTMLInputElement>document.getElementById(escapeRadiusInputId);
        escapeRadiusInput.value = this.escapeRadius.toString();

        escapeRadiusInput.addEventListener('input', (evt) => {
            let val = parseFloat((<HTMLInputElement>evt.currentTarget).value);
            this.setEscapeRadius(val);
            this.render();
        });
    };

    addExponentInputListener = (exponentInputId: string) => {
        const exponentInput = <HTMLInputElement>document.getElementById(exponentInputId);
        exponentInput.value = this.exponent.toString();

        exponentInput.addEventListener('input', (evt) => {
            let val = parseFloat((<HTMLInputElement>evt.currentTarget).value);
            this.setExponent(val);
            this.render();
        });
    };

    setCenterTo = (cX: number, cY: number) => {
        // Keep current zoom level, simply adjust the bounds
        let currCX = (this.vp.xMin + this.vp.xMax) * 0.5;
        let currCY = (this.vp.yMin + this.vp.yMax) * 0.5;

        let xOffset = cX - currCX;
        let yOffset = cY - currCY;

        let newXMin = this.vp.xMin + xOffset;
        let newYMin = this.vp.yMin + yOffset;
        let newYMax = this.vp.yMax + yOffset;

        this.setXYRenderingBounds(newYMin, newYMax, newXMin);
    };

    setScreenResolution = (width: number, height: number) => {
        var screenResAttribLocation = this.gl.getUniformLocation(this.glProgram, 'screenResolution');
        this.gl.uniform2f(screenResAttribLocation, width, height);
    };
    setScreenStart = (screenStartX: number, screenStartY: number) => {
        var screenStartAttribLocation = this.gl.getUniformLocation(this.glProgram, 'screenStart');
        this.gl.uniform2f(screenStartAttribLocation, screenStartX, screenStartY);
    };
}
