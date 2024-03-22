import { JuliaContext } from './JuliaContext.js';
import { MandelContext } from './MandelContext.js';
import { distance, limitLength } from '../utils/vectorUtils.js';
import {
    ColorSettings,
    RGBColor,
    RGBToHex,
    getColorSettingsFromAbbreviations,
    normalizeRGB,
    hexToRGB,
} from '../utils/colorUtils.js';
import { updateJuliaPreviewContext } from '../ui/juliaDownload.js';
import { FractalParams } from './FractalParams';
import { FractalContext } from './FractalContext';

// Enables the communication between two FractalContexts via events
export class FractalManager {
    mandelContext: MandelContext;
    juliaContext: JuliaContext;

    juliaPreviewContext: JuliaContext;
    juliaDrawingContext: JuliaContext;
    isPreviewVisible: () => boolean;

    currentJuliaCenter: { x: number; y: number };
    juliaXCoordInput: HTMLInputElement;
    juliaYCoordInput: HTMLInputElement;

    juliaFollowsMouse: boolean;

    movingRandom: boolean;

    constructor(
        context1: MandelContext,
        context2: JuliaContext,
        juliaCenterXInputId: string,
        juliaCenterYInputId: string,
        juliaPreviewContext: JuliaContext,
        isPreviewVisible: () => boolean
    ) {
        this.mandelContext = context1;
        this.juliaContext = context2;

        this.juliaPreviewContext = juliaPreviewContext;
        this.isPreviewVisible = isPreviewVisible;
        juliaPreviewContext.startMainRenderLoop();

        this.currentJuliaCenter = { x: 0.0, y: 0.0 };
        this.juliaFollowsMouse = true;

        this.addJuliaCoordInputListeners(juliaCenterXInputId, juliaCenterYInputId);
    }

    setCurrentJuliaCenter(xCoord: number, yCoord: number) {
        if (xCoord != this.juliaContext.juliaCCoords.x || yCoord != this.juliaContext.juliaCCoords.y) {
            // Check if update is necessary
            this.mandelContext.updateCenterIndicator({ x: xCoord, y: yCoord });
            // renderState is updated in here
            this.juliaContext.setJuliaCCoords(xCoord, yCoord);
            this.updateJuliaCenterDisplayValues();
        }
    }

    updateJuliaCenterDisplayValues = () => {
        let x = this.juliaContext.juliaCCoords.x;
        let y = this.juliaContext.juliaCCoords.y;
        this.juliaXCoordInput.value = parseFloat(x.toFixed(10)).toString(); //.substring(0, 10 + (x < 0 ? 1 : 0));
        this.juliaYCoordInput.value = parseFloat(y.toFixed(10)).toString(); //.substring(0, 10 + (y < 0 ? 1 : 0));
    };

    addJuliaCoordInputListeners = (juliaCenterXInputId: string, juliaCenterYInputId: string) => {
        this.juliaXCoordInput = <HTMLInputElement>document.getElementById(juliaCenterXInputId);
        this.juliaYCoordInput = <HTMLInputElement>document.getElementById(juliaCenterYInputId);
        // Coord input
        this.juliaXCoordInput.value = '0.0';
        this.juliaYCoordInput.value = '0.0';

        this.juliaXCoordInput.addEventListener('input', (evt) => {
            let x = parseFloat((<HTMLInputElement>evt.currentTarget).value);
            if (Number.isNaN(x)) return;
            this.setCurrentJuliaCenter(x, this.juliaContext.juliaCCoords.y);
            if (!this.isPreviewVisible) return;
            this.juliaPreviewContext.setJuliaCCoords(x, this.juliaContext.juliaCCoords.y);
        });

        this.juliaYCoordInput.addEventListener('input', (evt) => {
            let y = parseFloat((<HTMLInputElement>evt.currentTarget).value);
            if (Number.isNaN(y)) return;
            this.setCurrentJuliaCenter(this.juliaContext.juliaCCoords.x, y);
            if (!this.isPreviewVisible) return;
            this.juliaPreviewContext.setJuliaCCoords(this.juliaContext.juliaCCoords.x, y);
        });

        this.addUpdateJuliaOnMouseMove();
    };

    // Update julia center when moving mouse on mandel canvas
    addUpdateJuliaOnMouseMove() {
        this.mandelContext.canvas.addEventListener('mousemove', (evt) => {
            if (!this.mandelContext.indicatorFollowsMouse || this.mandelContext.panningObject.panningCanvas) return;

            let x = this.mandelContext.vp.xToCoord(evt.clientX);
            let y = this.mandelContext.vp.yToCoord(evt.clientY);

            this.setCurrentJuliaCenter(x, y);
        });
    }

    // Enable pausing of reactive julia rendering
    addPausingUpdateJulia(indfollowmouseShortcutCheckboxId: string, randmoveShortcutCheckboxId: string) {
        const indfollowmouseShortcutCheckbox = <HTMLInputElement>(
            document.getElementById(indfollowmouseShortcutCheckboxId)
        );
        const randmoveShortcutCheckbox = <HTMLInputElement>document.getElementById(randmoveShortcutCheckboxId);
        window.addEventListener('keydown', (evt) => {
            if (evt.code == 'KeyF' && indfollowmouseShortcutCheckbox.checked)
                this.mandelContext.indicatorFollowsMouse = !this.mandelContext.indicatorFollowsMouse;
            else if (evt.code == 'KeyR' && randmoveShortcutCheckbox.checked) {
                if (!this.movingRandom) this.randomMovement();
                else this.stopRandomMovement();
            }
        });
    }

    tryParseParamsFromFilename = (
        filename: string
    ): // Explicit typing necessary to avoid returning all attributes when parsing was not successful
    | { parsedSuccessfully: false }
        | {
              parsedSuccessfully: true;
              color: RGBColor;
              nrIterations: number;
              exponent: number;
              escapeRadius: number;
              juliaCoords: { x: number; y: number };
              juliaPreviewCenter: { x: number; y: number };
              zoomLevel: number;
              cpuRendering: boolean;
              colorSettings: ColorSettings;
          } => {
        // Extract parameters
        let params = filename.split('_').slice(1); // Split into attributes, remove "JuliaSet"-prefix
        if (params.length < 12) return { parsedSuccessfully: false }; // Not enough params

        let color = { r: parseFloat(params[0]), g: parseFloat(params[1]), b: parseFloat(params[2]) };
        let nrIterations = parseFloat(params[3]);
        let exponent = parseFloat(params[4]);
        let escapeRadius = parseFloat(params[5]);

        let juliaCoords = { x: parseFloat(params[6]), y: parseFloat(params[7]) };
        let juliaPreviewCenter = { x: parseFloat(params[8]), y: parseFloat(params[9]) };

        let zoomLevel = parseFloat(params[10]);

        let cpuRendering = params[params.length - 1] == '1';

        let colorSettings = getColorSettingsFromAbbreviations(params.slice(11, params.length - 1));

        let paramsObj = {
            color,
            nrIterations,
            exponent,
            escapeRadius,
            juliaCoords,
            juliaPreviewCenter,
            zoomLevel,
            cpuRendering,
            colorSettings,
        };

        for (let param of Object.keys(paramsObj)) {
            // Assert that no value is null
            if (param === null) return { parsedSuccessfully: false };
        }

        return {
            ...paramsObj,
            parsedSuccessfully: true,
        };
    };

    updateRenderFractals = (
        params: FractalParams,
        juliaPreviewContext: JuliaContext,
        juliaPreviewContainerId: string
    ) => {
        const {
            color,
            nrIterations,
            exponent,
            escapeRadius,
            juliaCoords,
            juliaPreviewCenter,
            zoomLevel,
            cpuRendering,
            colorSettings,
        } = params;

        // Set the values
        this.setCurrentJuliaCenter(juliaCoords.x, juliaCoords.y);

        this.setFractalParams(this.juliaContext, params);

        this.juliaContext.setCenterTo(juliaPreviewCenter.x, juliaPreviewCenter.y); // Set center and zoom as specified in filename
        this.juliaContext.zoom(juliaPreviewCenter.x, juliaPreviewCenter.y, zoomLevel);

        this.setFractalParams(this.mandelContext, params);

        // Update preview context if necessary
        const juliaPreviewContainer = document.getElementById(juliaPreviewContainerId);
        if (juliaPreviewContainer.style.visibility != 'visible') return;
        updateJuliaPreviewContext(juliaPreviewContext, this.juliaContext);
    };

    // Returns whether the rendering was successful or not
    tryUpdateRenderFractalsFromString = (
        filename: string,
        juliaPreviewContext: JuliaContext,
        juliaDrawingContext: JuliaContext,
        juliaPreviewContainerId: string
    ) => {
        let params = this.tryParseParamsFromFilename(filename);
        if (!params.parsedSuccessfully) return false;

        //this.updateRenderFractals(params, juliaPreviewContext, juliaPreviewContainerId);
        this.transitionIntoState(params, 3000);

        this.mandelContext.indicatorFollowsMouse = false;
    };

    getCurrentJuliaParams = () => {
        const currPreviewCenter = this.juliaPreviewContext.getCurrentCenter();
        const params: FractalParams = {
            color: hexToRGB(this.juliaContext.colorInput.value),
            nrIterations: this.juliaContext.nrIterations,
            exponent: this.juliaContext.exponent,
            escapeRadius: this.juliaContext.escapeRadius,
            juliaCoords: this.juliaContext.juliaCCoords,
            juliaPreviewCenter: { x: currPreviewCenter.cX, y: currPreviewCenter.cY },
            zoomLevel: this.juliaContext.zoomLevel,
            colorSettings: this.juliaContext.colorSettings,
            cpuRendering: this.juliaContext.cpuRendering,
        };
        return params;
    };

    _transition = (params: FractalParams) => {
        this.setCurrentJuliaCenter(params.juliaCoords.x, params.juliaCoords.y);
        this.setFractalParams(this.juliaContext, params);
        // Only the JuliaSet will be zoomed, not the Mandelbrot
        const currJuliaCenter = this.juliaContext.getCurrentCenter();
        this.juliaContext.setZoom(currJuliaCenter.cX, currJuliaCenter.cY, params.zoomLevel);
        this.juliaContext.setCenterTo(params.juliaPreviewCenter.x, params.juliaPreviewCenter.y);
        this.setFractalParams(this.mandelContext, params);
    };

    // Duration in ms
    transitionIntoState = (goalParams: FractalParams, duration: number) => {
        // Number of frames to render
        const frameInterval = Math.min(this.mandelContext.frameInterval, this.juliaContext.frameInterval);
        const nrFrames = duration / frameInterval;
        console.log(frameInterval);

        // Current state
        const currentState = this.getCurrentJuliaParams();
        // Calculate intermediate values
        // Colors

        const interpolatedFractalParamsList: FractalParams[] = [];
        for (let i = 0; i < nrFrames; i++) {
            const step = (i + 1) / nrFrames;
            const color: RGBColor = {
                r: currentState.color.r + step * (goalParams.color.r - currentState.color.r),
                g: currentState.color.g + step * (goalParams.color.g - currentState.color.g),
                b: currentState.color.b + step * (goalParams.color.b - currentState.color.b),
            };

            const fractalParams: FractalParams = {
                color: color,
                nrIterations: currentState.nrIterations + step * (goalParams.nrIterations - currentState.nrIterations),
                exponent: currentState.exponent + step * (goalParams.exponent - currentState.exponent),
                escapeRadius: currentState.escapeRadius + step * (goalParams.escapeRadius - currentState.escapeRadius),
                juliaCoords: {
                    x: currentState.juliaCoords.x + step * (goalParams.juliaCoords.x - currentState.juliaCoords.x),
                    y: currentState.juliaCoords.y + step * (goalParams.juliaCoords.y - currentState.juliaCoords.y),
                },
                juliaPreviewCenter: {
                    x:
                        currentState.juliaPreviewCenter.x +
                        step * (goalParams.juliaPreviewCenter.x - currentState.juliaPreviewCenter.x),
                    y:
                        currentState.juliaPreviewCenter.y +
                        step * (goalParams.juliaPreviewCenter.y - currentState.juliaPreviewCenter.y),
                },
                zoomLevel: currentState.zoomLevel + step * (goalParams.zoomLevel - currentState.zoomLevel),
                cpuRendering: false,
                colorSettings: currentState.colorSettings,
            };

            interpolatedFractalParamsList.push(fractalParams);
        }

        // Loop
        let i = 0;
        const loop = () => {
            this._transition(interpolatedFractalParamsList[i]);
            i++;
            if (i < nrFrames) {
                setTimeout(loop, frameInterval);
            }
        };

        loop();
    };

    setFractalParams = (fractalContext: FractalContext, params: FractalParams) => {
        fractalContext.setColorValues(normalizeRGB(params.color));
        fractalContext.colorInput.value = RGBToHex(params.color);
        fractalContext.setExponent(params.exponent);
        fractalContext.exponentInput.value = params.exponent.toString();
        fractalContext.setNrIterations(params.nrIterations);
        fractalContext.nrIterationsInput.value = params.nrIterations.toString();
        fractalContext.setEscapeRadius(params.escapeRadius);
        fractalContext.escapeRadiusInput.value = params.escapeRadius.toString();
        fractalContext.setColorSettings(params.colorSettings);
        fractalContext.colorSettingsInputs.forEach(
            (colorSettingInput, index) => (colorSettingInput.checked = params.colorSettings[index] != 0)
        );
    };

    stopRandomMovement() {
        this.movingRandom = false;
    }

    randomMovement() {
        if (this.movingRandom) return; // Already moving rdm
        this.movingRandom = true;
        let xMin = -1.5;
        let xMax = 0.5;
        let yMin = -1.0;
        let yMax = 1.0;
        // Move to this destination for a couply of frames
        let nrFrames = 60;

        let acceleration = { x: 0.0, y: 0.0 };
        let velocity = { x: 0.0, y: 0.0 };

        const delay = 1000 / 60;
        const maxSpeed = 0.5 / 60;

        let nextDestination: { x: number; y: number };

        let currentCenter = { x: this.juliaContext.juliaCCoords.x, y: this.juliaContext.juliaCCoords.y };

        async function outerLoop(i: number, fractalManager: FractalManager) {
            // Determine random next point to move to inside the defined area
            nextDestination = { x: Math.random() * (xMax - xMin) + xMin, y: Math.random() * (yMax - yMin) + yMin };
            innerLoop(0, fractalManager)
                .then(() => outerLoop(i, fractalManager))
                .catch((e) => {});
        }

        async function innerLoop(frameNr: number, fractalManager: FractalManager) {
            return new Promise((resolve, reject) => {
                if (!fractalManager.movingRandom) reject();
                currentCenter = {
                    // Update in case the values were changed by other events
                    x: fractalManager.juliaContext.juliaCCoords.x,
                    y: fractalManager.juliaContext.juliaCCoords.y,
                };
                // Adjust the acceleration to point towards the destination
                acceleration = { x: nextDestination.x - currentCenter.x, y: nextDestination.y - currentCenter.y };
                velocity.x += acceleration.x * 0.0001;
                velocity.y += acceleration.y * 0.0001;

                limitLength(velocity, maxSpeed);

                currentCenter.x += velocity.x;
                currentCenter.y += velocity.y;

                // renderState updated in here
                fractalManager.setCurrentJuliaCenter(currentCenter.x, currentCenter.y);
                if (frameNr < nrFrames && distance(nextDestination, currentCenter) > 0.0001) {
                    setTimeout(() => {
                        if (fractalManager.movingRandom) {
                            innerLoop(frameNr + 1, fractalManager)
                                .then(() => resolve(''))
                                .catch(() => reject());
                        }
                    }, delay);
                } else setTimeout(() => resolve(''), delay);
            });
        }

        outerLoop(0, this);
    }
}
