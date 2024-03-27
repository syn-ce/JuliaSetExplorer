import { createProgram, createShader, vertexShaderText } from '../utils/glutils.js';
import { PanningObj, getCanvasRenderingContext2D, getWebGL2RenderingContext, canvasMoveEvent } from '../utils/utils.js';
import { ColorSettings, RGBColor, hexToRGB, normalizeRGB } from '../utils/colorUtils.js';
import { Vec3D, zoomPoint } from '../utils/vectorUtils.js';
import { Viewport } from './viewport.js';
import { interpolateFractalParamsAtTime } from '../utils/fractalUtils.js';
import { FractalParams } from './FractalParams.js';

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
    renderQueued: boolean;
    renderInProgress: boolean;
    progressBar: {
        progress: number;
        HTMLBar: HTMLElement;
        timeField: HTMLElement;
        startTime: number;
    };
    renderState: {
        wasUpdatedSinceLastRender: boolean;
        shouldRender: boolean;
        animationDuration: number;
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
        this.renderState = {
            wasUpdatedSinceLastRender: true,
            shouldRender: false,
            animationDuration: 1000,
        };
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
        let vertexShader = createShader(this.gl, this.gl.VERTEX_SHADER, vertexShaderText);
        let fragmentShader = createShader(this.gl, this.gl.FRAGMENT_SHADER, fragmentShaderText);

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
        this.renderState.wasUpdatedSinceLastRender = true;
        this.colorSettings = colorSettings;
    };

    __setColorSettings = () => {
        let colorSettingsAttribLocation = this.gl.getUniformLocation(this.glProgram, 'colorSettings');
        this.gl.uniform1fv(colorSettingsAttribLocation, this.colorSettings);
    };

    setColorValues = (rgbColor: RGBColor) => {
        this.renderState.wasUpdatedSinceLastRender = true;
        this.rgbColor = rgbColor;
    };

    __setColorValues = () => {
        let rgbColorAttribLocation = this.gl.getUniformLocation(this.glProgram, 'rgbColor');
        this.gl.uniform3f(rgbColorAttribLocation, this.rgbColor.r, this.rgbColor.g, this.rgbColor.b);
    };

    setEscapeRadius = (escapeRadius: number) => {
        this.renderState.wasUpdatedSinceLastRender = true;
        this.escapeRadius = escapeRadius;
    };

    __setEscapeRadius = () => {
        let escapeRadiusAttribLocation = this.gl.getUniformLocation(this.glProgram, 'escapeRadius');
        this.gl.uniform1f(escapeRadiusAttribLocation, this.escapeRadius);
    };

    setXYRenderingBounds = (yMin: number, yMax: number, xMin: number) => {
        this.renderState.wasUpdatedSinceLastRender = true;
        this.vp.updateXYBounds(yMin, yMax, xMin);
    };

    __setXYRenderingBounds = () => {
        let xBoundsAttribLocation = this.gl.getUniformLocation(this.glProgram, 'xBounds');
        this.gl.uniform2f(xBoundsAttribLocation, this.vp.xMin, this.vp.xMax);
        let yBoundsAttribLocation = this.gl.getUniformLocation(this.glProgram, 'yBounds');
        this.gl.uniform2f(yBoundsAttribLocation, this.vp.yMin, this.vp.yMax);

        this.dispatchCanvasMoveEvent();
    };

    setExponent = (exponent: number) => {
        this.renderState.wasUpdatedSinceLastRender = true;
        this.exponent = exponent;
    };

    __setExponent = () => {
        let exponentAttribLocation = this.gl.getUniformLocation(this.glProgram, 'exponent');
        this.gl.uniform1f(exponentAttribLocation, this.exponent);
    };

    setNrIterations = (nrIterations: number) => {
        this.renderState.wasUpdatedSinceLastRender = true;
        this.nrIterations = nrIterations;
    };

    __setNrIterations = () => {
        let nrIterationsAttribLocation = this.gl.getUniformLocation(this.glProgram, 'nrIterations');
        this.gl.uniform1f(nrIterationsAttribLocation, this.nrIterations);
    };

    setProgressBarElement = (progressBarElementId: string, timeDisplayElementId: string) => {
        this.progressBar.HTMLBar = document.getElementById(progressBarElementId);
        this.progressBar.timeField = timeDisplayElementId
            ? document.getElementById(timeDisplayElementId)
            : document.createElement('div'); // Dummy element
        this.progressBar.HTMLBar.parentElement.style.display = 'none';
    };

    animation = (
        timeStamp: number,
        startState: FractalParams,
        goalState: FractalParams,
        start: number,
        prevTimeStamp: number
    ) => {
        if (start === undefined) {
            start = timeStamp;
        }
        const elapsed = timeStamp - start;

        if (prevTimeStamp != timeStamp) {
            let t = elapsed / this.renderState.animationDuration;
            t = Math.max(Math.min(t, 1), 0);
            const newState = interpolateFractalParamsAtTime(startState, goalState, t);
            // Render
            if (this.cpuRendering) {
                requestAnimationFrame(() => {
                    this.drawSetCPU().then(() => {
                        this.canvas2d.style.display = '';
                        this.canvas.style.display = 'none';
                    });
                });
            } else {
                requestAnimationFrame(() => {
                    this.gl.drawArrays(this.primitiveType, this.offset, this.count);
                    this.canvas.style.display = '';
                    this.canvas2d.style.display = 'none';
                });
            }
        }

        if (elapsed < this.renderState.animationDuration) {
            prevTimeStamp = timeStamp;
            requestAnimationFrame((timeStamp) =>
                this.animation(timeStamp, startState, goalState, start, prevTimeStamp)
            );
        }
    };

    // Used for updating additional attributes such as Julia Center Coords in JuliaContext
    abstract __updateClassSpecificCanvasAndGL: () => void;

    __updateCanvasAndGLAttributes = () => {
        this.__resizeCanvas();
        this.__setScreenResolution();
        this.__setScreenStart();
        this.__setXYRenderingBounds();
        this.__setEscapeRadius();
        this.__setExponent();
        this.__setNrIterations();
        this.__setColorValues();
        this.__setColorSettings();
        this.__updateClassSpecificCanvasAndGL();
    };

    __renderCanvas = () => {
        // Render
        if (this.cpuRendering) {
            this.drawSetCPU().then(() => {
                this.canvas2d.style.display = '';
                this.canvas.style.display = 'none';
            });
        } else {
            this.gl.drawArrays(this.primitiveType, this.offset, this.count);
            this.canvas.style.display = '';
            this.canvas2d.style.display = 'none';
        }
    };

    // Used for rendering once when the renderLoop is not running, e.g. when downloading from the invisible canvas
    manualImmediateRender = () => {
        this.__updateCanvasAndGLAttributes();
        this.__renderCanvas();
    };

    renderLoop = (timeStamp: number) => {
        if (!this.renderState.shouldRender) return;
        // Only render if necessary
        if (!this.renderState.wasUpdatedSinceLastRender) {
            requestAnimationFrame(this.renderLoop);
            return;
        }

        this.renderState.wasUpdatedSinceLastRender = false;
        // Update canvas, webgl
        this.__updateCanvasAndGLAttributes();

        this.__renderCanvas();

        // Keep renderLoop running
        requestAnimationFrame(this.renderLoop);
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

                    data[ind] = val.x * 255;
                    data[ind + 1] = val.y * 255;
                    data[ind + 2] = val.z * 255;
                    data[ind + 3] = 255;
                }
                setTimeout(() => resolve(''), 0);
            });
        };

        let startTime = performance.now();
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
            if (Date.now() - this.timeOfLastRender >= this.frameInterval && !this.renderInProgress) {
                this.renderInProgress = true;
                this.timeOfLastRender = Date.now();
                if (cpuRendering || this.cpuRendering) {
                    this.drawSetCPU().then(() => {
                        this.canvas2d.style.display = '';
                        this.canvas.style.display = 'none';
                        resolve('');
                        this.renderInProgress = false;
                        if (this.renderQueued) {
                            // setup next render if there was another one queued
                            this.renderQueued = false;
                            setTimeout(this.render, this.frameInterval + 1 - (Date.now() - this.timeOfLastRender)); // 1 millisecond as a buffer
                        }
                    });
                } else {
                    this.gl.drawArrays(this.primitiveType, this.offset, this.count);
                    this.canvas.style.display = '';
                    this.canvas2d.style.display = 'none';
                    resolve('');
                    this.renderInProgress = false;
                    if (this.renderQueued) {
                        // setup next renderprogress-bar if there was another one queued
                        this.renderQueued = false;
                        setTimeout(this.render, this.frameInterval + 1 - (Date.now() - this.timeOfLastRender)); // 1 millisecond as a buffer
                    }
                }
            } else {
                this.renderQueued = true;
                resolve('');
            }
        });
    };

    setupGL = () => {
        this.gl.viewport(0, 0, this.vp.vWidth, this.vp.vHeight);
        this.gl.clearColor(0.4, 0.75, 0.2, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        // X, Y
        let triangles = [-1.0, 1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0];
        let triangleVertexBufferObject = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, triangleVertexBufferObject);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(triangles), this.gl.STATIC_DRAW);

        let positionAttribLocation = this.gl.getAttribLocation(this.glProgram, 'vertPosition');

        let vao = this.gl.createVertexArray();
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

    startMainRenderLoop() {
        // Start renderLoop
        this.renderState.shouldRender = true;
        requestAnimationFrame(this.renderLoop);
    }

    stopRenderLoop = () => (this.renderState.shouldRender = false);

    setZoom(cX: number, cY: number, zoomLevel: number) {
        // Set zoom-level of canvas, towards current center
        this.renderState.wasUpdatedSinceLastRender = true;
        this.zoom(cX, cY, zoomLevel);
    }

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
            evt.preventDefault(); // Prevent zooming of entire window on windows-machines
            let sign = evt.deltaY < 0 ? -1 : 1; // deltaY < 0 -> zoom in
            let vp = this.vp;
            let x = vp.xToCoord(evt.clientX);
            let y = vp.yToCoord(evt.clientY);
            if (sign < 0) {
                this.setZoom(x, y, this.zoomLevel * this.zoomFactor);
            } else {
                this.setZoom(x, y, this.zoomLevel / this.zoomFactor);
            }
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
            //this.render();
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
            }

            lastClick.time = performance.now();
            lastClick.pos = { x: evt.clientX, y: evt.clientY };
        };

        this.canvas.addEventListener('click', (evt) => handleLastClick(evt));
        this.canvas2d.addEventListener('click', (evt) => handleLastClick(evt));
    };

    addColorInputListener = (colorPickerId: string, isVisible: () => boolean = () => true) => {
        this.colorInput = <HTMLInputElement>document.getElementById(colorPickerId);

        this.colorInput.addEventListener('input', (evt) => {
            if (!isVisible()) return;
            let rgbColor = normalizeRGB(hexToRGB((<HTMLInputElement>evt.currentTarget).value));
            this.setColorValues(rgbColor);
        });
    };

    addEscapeRadiusInputListener = (escapeRadiusInputId: string, isVisible: () => boolean = () => true) => {
        this.escapeRadiusInput = <HTMLInputElement>document.getElementById(escapeRadiusInputId);
        this.escapeRadiusInput.value = this.escapeRadius.toString();

        this.escapeRadiusInput.addEventListener('input', (evt) => {
            if (!isVisible()) return;
            let val = parseFloat((<HTMLInputElement>evt.currentTarget).value);
            this.setEscapeRadius(val);
        });
    };

    addExponentInputListener = (exponentInputId: string, isVisible: () => boolean = () => true) => {
        this.exponentInput = <HTMLInputElement>document.getElementById(exponentInputId);
        this.exponentInput.value = this.exponent.toString();

        this.exponentInput.addEventListener('input', (evt) => {
            if (!isVisible()) return;
            let val = parseFloat((<HTMLInputElement>evt.currentTarget).value);
            this.setExponent(val);
        });
    };

    addNrIterationsInputListener = (nrIterationsInputId: string, isVisible: () => boolean = () => true) => {
        this.nrIterationsInput = <HTMLInputElement>document.getElementById(nrIterationsInputId);
        this.nrIterationsInput.value = this.nrIterations.toString();

        this.nrIterationsInput.addEventListener('input', (evt) => {
            if (!isVisible()) return;
            let val = parseFloat((<HTMLInputElement>evt.currentTarget).value);
            this.setNrIterations(val);
        });
    };

    addColorSettingsInputs = (colorDropdownId: string, isVisible: () => boolean = () => true) => {
        const parseColorSettings = () => {
            return this.colorSettingsInputs.map((input) => (input.checked ? 1.0 : 0.0));
        };

        const colorDropdown = document.getElementById(colorDropdownId);
        this.colorSettingsInputs = Array.from(colorDropdown.getElementsByTagName('input'));
        this.colorSettingsInputs.forEach((input) =>
            input.addEventListener('input', (evt) => {
                if (!isVisible()) return;
                const colorSettings = parseColorSettings();
                this.setColorSettings(colorSettings);
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
        this.renderState.wasUpdatedSinceLastRender = true;
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
        this.renderState.wasUpdatedSinceLastRender = true;
        this.vp.updateVP(this.vp.screenStart.x, this.vp.screenStart.y, width, height);
    };

    __setScreenResolution = () => {
        let screenResAttribLocation = this.gl.getUniformLocation(this.glProgram, 'screenResolution');
        this.gl.uniform2f(screenResAttribLocation, this.vp.vWidth, this.vp.vHeight);
    };

    setScreenStart = (screenStartX: number, screenStartY: number) => {
        this.vp.updateVP(screenStartX, screenStartY, this.vp.vWidth, this.vp.vHeight);
    };

    __setScreenStart = () => {
        let screenStartAttribLocation = this.gl.getUniformLocation(this.glProgram, 'screenStart');
        this.gl.uniform2f(screenStartAttribLocation, this.vp.screenStart.x, this.vp.screenStart.y);
    };

    setCPURendering = (bool: boolean) => {
        this.renderState.wasUpdatedSinceLastRender = this.cpuRendering != bool;
        this.cpuRendering = bool;
    };

    resizeCanvas = (xScreenLeft: number, xScreenRight: number, yScreenBot: number, yScreenTop: number) => {
        let newWidth = xScreenRight - xScreenLeft;
        let newHeight = yScreenTop - yScreenBot;

        // Extrapolate new boundaries
        let newXMin = this.vp.xToCoord(xScreenLeft);
        let newYMin = this.vp.yToCoord(yScreenTop);
        let newYMax = this.vp.yToCoord(yScreenBot);

        // Update vp
        this.vp.updateVP(xScreenLeft, yScreenBot, newWidth, newHeight);

        this.setScreenResolution(newWidth, newHeight);

        this.setXYRenderingBounds(newYMin, newYMax, newXMin);
    };

    __resizeCanvas = () => {
        // Update webgl canvas
        let canvas = this.canvas;
        canvas.width = this.vp.vWidth;
        canvas.height = this.vp.vHeight;

        // Update 2d canvas
        let canvas2d = this.canvas2d;
        canvas2d.width = this.vp.vWidth;
        canvas2d.height = this.vp.vHeight;

        // Update gl
        this.gl.viewport(0, 0, this.vp.vWidth, this.vp.vHeight);
    };

    // Used to move the border around the canvas
    moveCanvas = (canvasBorderElement: HTMLElement) => {
        canvasBorderElement.style.left = `${this.vp.screenStart.x.toString()}px`;
        canvasBorderElement.style.top = `${this.vp.screenStart.y.toString()}px`;
    };

    // Will change the x-value so that the result matches the aspect ratio, will move the window to the center of the screen
    setAspectRatio = (aspectRatio: number) => {
        // Try adjusting width and height so that the image stays on screen and has a reasonable size
        let newWidth = Math.round(this.canvas.height * aspectRatio);
        let newHeight = Math.round(newWidth / aspectRatio);
        this.renderState.wasUpdatedSinceLastRender = true;

        if (
            100 < newWidth &&
            newWidth <= window.innerWidth * 0.75 &&
            100 < newHeight &&
            newHeight <= window.innerHeight * 0.75
        ) {
            // Resize canvas
            let xLeft = window.innerWidth / 2 - newWidth / 2;
            let xRight = window.innerWidth / 2 + newWidth / 2;
            this.resizeCanvas(xLeft, xRight, this.vp.screenStart.y, this.vp.screenStart.y + this.canvas.height);
        } else {
            // Got some fixing to do
            // Try increasing the width from 300 pixels until it fits
            let newNewWidth = 300;
            let newNewHeight = newNewWidth / aspectRatio;
            while (newNewWidth <= window.innerWidth - 10) {
                if (50 < newNewHeight && newNewHeight <= window.innerHeight - 10) break;
                newNewWidth += 20;
                newNewHeight = newNewWidth / aspectRatio;
            }
            if (50 < newNewHeight && newNewHeight <= window.innerHeight - 10) {
                newWidth = newNewWidth;
                newHeight = newNewHeight;
            }

            let xLeft = window.innerWidth / 2 - newWidth / 2;
            let xRight = window.innerWidth / 2 + newWidth / 2;
            let yBot = window.innerHeight / 2 - newHeight / 2;
            let yTop = window.innerHeight / 2 + newHeight / 2;
            this.resizeCanvas(xLeft, xRight, yBot, yTop);
        }

        this.tryResizeCanvasMediumSize();

        this.moveCanvas(document.getElementById('download-preview-canvas-border'));
    };

    // Tries to resize the canvas to a "medium" width and height if both are small
    tryResizeCanvasMediumSize = () => {
        let canvas = this.canvas;
        let width = canvas.width;
        let height = canvas.height;
        let ratio = width / height;
        if (width < window.innerWidth * 0.5 && height < window.innerHeight * 0.5) {
            // Increase width
            while (width <= window.innerWidth * 0.6 && height <= window.innerHeight * 0.6) {
                width += 10;
                height = width / ratio;
            }
            width -= 10;
            height = width / ratio;

            this.resizeCanvas(
                window.innerWidth * 0.5 - width * 0.5,
                window.innerWidth * 0.5 + width * 0.5,
                window.innerHeight * 0.5 - height * 0.5,
                window.innerHeight * 0.5 + height * 0.5
            );
        }
    };
}
