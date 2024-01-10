import { createProgram, createShader, vertexShaderText } from './glutils.js';
import {
    ColorSettings,
    PanningObj,
    RGBColor,
    Vec3D,
    getCanvasRenderingContext2D,
    getWebGL2RenderingContext,
    hexToRGB,
    normalizeRGB,
    canvasMoveEvent,
    zoomPoint,
} from './utils.js';
import { Viewport } from './viewport.js';

export abstract class FractalContext {
    gl: WebGL2RenderingContext;
    glProgram: WebGLProgram;
    canvas2d: HTMLCanvasElement;
    context2d: CanvasRenderingContext2D;
    vp: Viewport;
    canvas: HTMLCanvasElement;
    primitiveType: number;
    offset: number;
    count: number;
    escapeRadius: number;
    escapeRadiusInput: HTMLInputElement;
    nrIterations: number;
    nrIterationsInput: HTMLInputElement;
    exponent: number;
    exponentInput: HTMLInputElement;
    rgbColor: RGBColor;
    colorInput: HTMLInputElement;
    colorSettings: ColorSettings;
    colorSettingsInputs: HTMLInputElement[];
    panningObject: PanningObj;
    timeOfLastRender: number;
    FPS: number;
    frameInterval: number;
    zoomLevel: number;
    zoomFactor: number;
    cpuRendering: boolean;
    progressBar: {
        progress: number;
        HTMLBar: HTMLElement;
        timeField: HTMLElement;
        startTime: number;
    };

    constructor(
        canvas: HTMLCanvasElement,
        canvas2d: HTMLCanvasElement,
        width: number,
        height: number,
        screenStart: { x: number; y: number },
        fragmentShaderText: string,
        nrIterations: number
    ) {
        this.canvas = canvas;
        this.canvas.width = width;
        this.canvas.height = height;

        this.canvas2d = canvas2d;
        this.canvas2d.width = width;
        this.canvas2d.height = height;
        this.context2d = getCanvasRenderingContext2D(this.canvas2d);

        this.nrIterations = nrIterations;

        this.vp = new Viewport(canvas.width, canvas.height, screenStart.x, screenStart.y, null);
        this.escapeRadius = 4.0;
        this.exponent = 2.0;

        this.zoomLevel = 1;

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

        this.progressBar = {
            progress: 0,
            HTMLBar: null,
            timeField: null,
            startTime: 0,
        };

        this.setupGL();
    }

    setColorSettings = (colorSettings: ColorSettings) => {
        this.colorSettings = colorSettings;
        var colorSettingsAttribLocation = this.gl.getUniformLocation(this.glProgram, 'colorSettings');
        this.gl.uniform1fv(colorSettingsAttribLocation, this.colorSettings);
    };

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

        this.dispatchCanvasMoveEvent();
    };

    setExponent = (exponent: number) => {
        this.exponent = exponent;
        var exponentAttribLocation = this.gl.getUniformLocation(this.glProgram, 'exponent');
        this.gl.uniform1f(exponentAttribLocation, this.exponent);
    };

    setNrIterations = (nrIterations: number) => {
        this.nrIterations = nrIterations;
        var nrIterationsAttribLocation = this.gl.getUniformLocation(this.glProgram, 'nrIterations');
        this.gl.uniform1f(nrIterationsAttribLocation, this.nrIterations);
    };

    setProgressBarElement = (progressBarElementId: string, timeDisplayElementId: string) => {
        this.progressBar.HTMLBar = document.getElementById(progressBarElementId);
        this.progressBar.timeField = document.getElementById(timeDisplayElementId);
        this.progressBar.HTMLBar.parentElement.style.display = 'none';
    };

    canImmediatelyRender = () => {
        return Date.now() - this.timeOfLastRender >= this.frameInterval;
    };

    abstract getColorValueForPoint(x: number, y: number): Vec3D;

    updateProgressBar = (progress: number) => {
        if (!this.progressBar.HTMLBar) return;
        const maxWidth = this.progressBar.HTMLBar.parentElement.getBoundingClientRect().width;

        const currTime = performance.now();
        const elapsedTime = currTime - this.progressBar.startTime;
        const estimatedRemainingTime = (elapsedTime / (progress * maxWidth)) * (maxWidth * (1 - progress));

        this.progressBar.timeField.innerText = `${(elapsedTime / 1000).toFixed(2)} | remaining: ~ ${(
            estimatedRemainingTime / 1000
        ).toFixed(0)}`;

        const width = Math.floor(maxWidth * progress);
        if (
            // Avoid unnecessary manipulation
            0 <= progress &&
            progress <= 1 &&
            width > Math.floor(this.progressBar.progress * maxWidth)
        ) {
            this.progressBar.progress = progress;
            this.progressBar.HTMLBar.style.width = width + 'px';
        } else if (progress > 1) {
            // Value greater than one will remove the progress bar
            this.progressBar.progress = progress;
            this.progressBar.HTMLBar.parentElement.style.display = 'none';
        } else if (progress < 0) {
            // Value smaller than zero will show the progress bar (reset it)
            this.progressBar.HTMLBar.parentElement.style.display = '';
            this.progressBar.HTMLBar.style.width = '0px';
            this.progressBar.progress = 0;
            this.progressBar.startTime = performance.now();
        }
    };

    async drawSetCPU() {
        const drawNonBlocking = (y: number) => {
            return new Promise((resolve, reject) => {
                this.updateProgressBar(y / this.canvas2d.height); // Update progress bar
                for (let x = 0; x < this.canvas2d.width; x++) {
                    let ind = (y * this.canvas2d.width + x) * 4;
                    let val = this.getColorValueForPoint(
                        this.vp.xToCoord(x + this.vp.screenStart.x),
                        this.vp.yToCoord(y + this.vp.screenStart.y)
                    );
                    //if (val == 0) zeroValues++;

                    data[ind] = val.x * 255;
                    data[ind + 1] = val.y * 255;
                    data[ind + 2] = val.z * 255;
                    data[ind + 3] = 255;
                }
                setTimeout(() => resolve(''), 0);
            });
        };

        var startTime = performance.now();
        let zeroValues = 0;
        const imageData = this.context2d.getImageData(0, 0, this.canvas2d.width, this.canvas2d.height);
        const data = imageData.data;
        this.updateProgressBar(-1); // Displays the progress bar (if it exists)
        for (let y = 0; y < this.canvas2d.height; y++) {
            await drawNonBlocking(y);
        }
        //console.log((zeroValues / canvas.width / canvas.height) * (vp.xMax - vp.xMin) * (vp.yMax - vp.yMin)); // This is a VERY rough estimate for the area
        // of the set; Moreover, this assumes the entirety of the set being visible on the screen. For the Mandelbrot set at 1000 iterations, it yields a
        // value of ~1.51
        console.log(`time taken: ${performance.now() - startTime}`);
        this.context2d.putImageData(imageData, 0, 0, 0, 0, this.vp.vWidth, this.vp.vHeight);

        this.updateProgressBar(1.1); // Hides the progress bar
    }

    render = (cpuRendering = false) => {
        return new Promise((resolve, reject) => {
            // Could be improved by "Queuing" the render
            if (Date.now() - this.timeOfLastRender >= this.frameInterval) {
                this.timeOfLastRender = Date.now();
                if (cpuRendering || this.cpuRendering) {
                    this.drawSetCPU().then(() => {
                        this.canvas2d.style.display = '';
                        this.canvas.style.display = 'none';
                        resolve('');
                    });
                } else {
                    this.gl.drawArrays(this.primitiveType, this.offset, this.count);
                    this.canvas.style.display = '';
                    this.canvas2d.style.display = 'none';
                    resolve('');
                }
            }
        });
    };

    setupGL = () => {
        this.gl.viewport(0, 0, this.vp.vWidth, this.vp.vHeight);
        this.gl.clearColor(0.4, 0.75, 0.2, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        // X, Y
        var triangles = [-1.0, 1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0];
        var triangleVertexBufferObject = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, triangleVertexBufferObject);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(triangles), this.gl.STATIC_DRAW);

        var positionAttribLocation = this.gl.getAttribLocation(this.glProgram, 'vertPosition');

        var vao = this.gl.createVertexArray();
        this.gl.bindVertexArray(vao);
        this.gl.enableVertexAttribArray(positionAttribLocation);

        this.gl.vertexAttribPointer(
            positionAttribLocation, // Attribute location
            2, // Number of elements per attribute
            this.gl.FLOAT, // Type of elements
            false,
            2 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
            0 // Offset from the beginning of a single vertex to this attribute
        );

        this.gl.useProgram(this.glProgram);
        this.gl.bindVertexArray(vao); // Not sure why this is needed, seems to be working fine without it

        this.setScreenResolution(this.vp.vWidth, this.vp.vHeight);

        this.setScreenStart(this.vp.screenStart.x, this.vp.screenStart.y);

        this.setXYRenderingBounds(-2.0, 2.0, -2.0);

        this.setEscapeRadius(100.0);

        this.setExponent(2.0);

        this.setNrIterations(this.nrIterations);

        this.setColorValues({ r: 0.0, g: 0.0, b: 0.0 });

        this.zoomFactor = 1.6;
        this.addPanZoomToCanvas(this.canvas);
        this.addPanZoomToCanvas(this.canvas2d);
    };

    zoom = (x: number, y: number, zoomLevel: number) => {
        // (x,y) - Center of zoom
        // zoomLevel - New level of zoom, i.e. 2.0 for zoom of two compared to the original setting
        // z - Factor of zoom
        let z = this.zoomLevel / zoomLevel;

        let vp = this.vp;
        // Transform the defining points of the viewport
        let xMin = zoomPoint(x, y, z, vp.xMin, 0).x;
        let yMin = zoomPoint(x, y, z, 0, vp.yMin).y;
        let yMax = zoomPoint(x, y, z, 0, vp.yMax).y;

        this.zoomLevel = zoomLevel;

        this.setXYRenderingBounds(yMin, yMax, xMin);
    };

    addPanZoomToCanvas = (canvas: HTMLCanvasElement) => {
        // Zoom
        this.panningObject = { panningCanvas: false, startXInCoords: 0, startYInCoords: 0 };

        canvas.addEventListener('wheel', (evt) => {
            let sign = evt.deltaY < 0 ? -1 : 1; // deltaY < 0 -> zoom in
            let vp = this.vp;
            let x = vp.xToCoord(evt.clientX);
            let y = vp.yToCoord(evt.clientY);
            if (sign < 0) {
                this.zoom(x, y, this.zoomLevel * this.zoomFactor);
            } else {
                this.zoom(x, y, this.zoomLevel / this.zoomFactor);
            }
            this.render();
        });

        // Pan
        canvas.addEventListener('mousedown', (evt) => {
            this.panningObject.panningCanvas = true;
            let vp = this.vp;
            this.panningObject.startXInCoords = vp.xToCoord(evt.clientX);
            this.panningObject.startYInCoords = vp.yToCoord(evt.clientY);
        });
        canvas.addEventListener('mouseup', (evt) => {
            this.panningObject.panningCanvas = false;
        });
        canvas.addEventListener('mouseleave', (evt) => {
            this.panningObject.panningCanvas = false;
        });
        canvas.addEventListener('mousemove', (evt) => {
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

    dispatchCanvasMoveEvent = () => {
        const canvasMoveEvt = canvasMoveEvent();
        if (!this.cpuRendering) this.canvas2d.dispatchEvent(canvasMoveEvt);
        else this.canvas2d.dispatchEvent(canvasMoveEvt);
    };

    // When double clicking a point in the canvas, center it
    addDoubleClickCenterPoint = () => {
        const DOUBLE_CLICK_INTERVAL = 500;
        const lastClick = { time: performance.now() - DOUBLE_CLICK_INTERVAL - 1, pos: { x: 0, y: 0 } };

        const handleLastClick = (evt: MouseEvent) => {
            if (
                performance.now() - lastClick.time <= DOUBLE_CLICK_INTERVAL &&
                Math.abs(evt.clientX - lastClick.pos.x) <= 0 &&
                Math.abs(evt.clientY - lastClick.pos.y) <= 0
            ) {
                // Center clicked point
                this.setCenterTo(this.vp.xToCoord(evt.clientX), this.vp.yToCoord(evt.clientY));
                this.render();
            }

            lastClick.time = performance.now();
            lastClick.pos = { x: evt.clientX, y: evt.clientY };
        };

        this.canvas.addEventListener('click', (evt) => handleLastClick(evt));
        this.canvas2d.addEventListener('click', (evt) => handleLastClick(evt));
    };

    addColorInputListener = (colorPickerId: string) => {
        this.colorInput = <HTMLInputElement>document.getElementById(colorPickerId);

        this.colorInput.addEventListener('input', (evt) => {
            let rgbColor = normalizeRGB(hexToRGB((<HTMLInputElement>evt.currentTarget).value));
            this.setColorValues(rgbColor);
            this.render();
        });
    };

    addEscapeRadiusInputListener = (escapeRadiusInputId: string) => {
        this.escapeRadiusInput = <HTMLInputElement>document.getElementById(escapeRadiusInputId);
        this.escapeRadiusInput.value = this.escapeRadius.toString();

        this.escapeRadiusInput.addEventListener('input', (evt) => {
            let val = parseFloat((<HTMLInputElement>evt.currentTarget).value);
            this.setEscapeRadius(val);
            this.render();
        });
    };

    addExponentInputListener = (exponentInputId: string) => {
        this.exponentInput = <HTMLInputElement>document.getElementById(exponentInputId);
        this.exponentInput.value = this.exponent.toString();

        this.exponentInput.addEventListener('input', (evt) => {
            let val = parseFloat((<HTMLInputElement>evt.currentTarget).value);
            this.setExponent(val);
            this.render();
        });
    };

    addNrIterationsInputListener = (nrIterationsInputId: string) => {
        this.nrIterationsInput = <HTMLInputElement>document.getElementById(nrIterationsInputId);
        this.nrIterationsInput.value = this.nrIterations.toString();

        this.nrIterationsInput.addEventListener('input', (evt) => {
            let val = parseFloat((<HTMLInputElement>evt.currentTarget).value);
            this.setNrIterations(val);
            this.render();
        });
    };

    addColorSettingsInputs = (colorDropdownId: string) => {
        const parseColorSettings = () => {
            return this.colorSettingsInputs.map((input) => ((<HTMLInputElement>input).checked ? 1.0 : 0.0));
        };

        const colorDropdown = document.getElementById(colorDropdownId);
        this.colorSettingsInputs = Array.from(colorDropdown.getElementsByTagName('input'));
        this.colorSettingsInputs.forEach((input) =>
            input.addEventListener('input', (evt) => {
                const colorSettings = parseColorSettings();
                this.setColorSettings(colorSettings);
                this.render();
            })
        );

        // Initial color settings
        this.colorSettingsInputs[0].checked = true;
        this.colorSettingsInputs[2].checked = true;
        const colorSettings = parseColorSettings();
        this.setColorSettings(colorSettings);
    };

    getCurrentCenter = () => {
        let currCX = (this.vp.xMin + this.vp.xMax) * 0.5;
        let currCY = (this.vp.yMin + this.vp.yMax) * 0.5;
        return { cX: currCX, cY: currCY };
    };

    setCenterTo = (cX: number, cY: number) => {
        // Keep current zoom level, simply adjust the bounds
        let currCenter = this.getCurrentCenter();

        let xOffset = Number.isNaN(cX) ? 0 : cX - currCenter.cX;
        let yOffset = Number.isNaN(cY) ? 0 : cY - currCenter.cY;

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

    setCPURendering = (bool: boolean) => {
        this.cpuRendering = bool;
    };
}
