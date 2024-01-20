import { JuliaContext } from './JuliaContext.js';
import { MandelContext } from './MandelContext.js';
import { distance, limitLength } from '../utils/vectorUtils.js';
import {
    ColorSettings,
    RGBColor,
    RGBToHex,
    getColorSettingsFromAbbreviations,
    normalizeRGB,
} from '../utils/colorUtils.js';
import { updateJuliaPreviewContext } from '../ui/juliaDownload.js';

// Enables the communication between two FractalContexts via events
export class FractalManager {
    mandelContext: MandelContext;
    juliaContext: JuliaContext;

    juliaPreviewContext: JuliaContext;
    juliaDrawingContext: JuliaContext;

    currentJuliaCenter: { x: number; y: number };
    juliaXCoordInput: HTMLInputElement;
    juliaYCoordInput: HTMLInputElement;

    juliaFollowsMouse: boolean;

    movingRandom: boolean;

    constructor(
        context1: MandelContext,
        context2: JuliaContext,
        juliaCenterXInputId: string,
        juliaCenterYInputId: string
    ) {
        this.mandelContext = context1;
        this.juliaContext = context2;

        this.currentJuliaCenter = { x: 0.0, y: 0.0 };
        this.juliaFollowsMouse = true;

        this.addJuliaCoordInputListeners(juliaCenterXInputId, juliaCenterYInputId);
    }

    setCurrentJuliaCenter(xCoord: number, yCoord: number) {
        if (xCoord != this.juliaContext.juliaCCoords.x || yCoord != this.juliaContext.juliaCCoords.y) {
            // Check if update is necessary
            this.mandelContext.updateCenterIndicator({ x: xCoord, y: yCoord });
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
            this.juliaContext.render();
        });

        this.juliaYCoordInput.addEventListener('input', (evt) => {
            let y = parseFloat((<HTMLInputElement>evt.currentTarget).value);
            if (Number.isNaN(y)) return;
            this.setCurrentJuliaCenter(this.juliaContext.juliaCCoords.x, y);
            this.juliaContext.render();
        });

        this.addUpdateJuliaOnMouseMove();
        this.addPausingUpdateJulia();
    };

    // Update julia center when moving mouse on mandel canvas
    addUpdateJuliaOnMouseMove() {
        this.mandelContext.canvas.addEventListener('mousemove', (evt) => {
            if (!this.mandelContext.indicatorFollowsMouse || this.mandelContext.panningObject.panningCanvas) return;

            let x = this.mandelContext.vp.xToCoord(evt.clientX);
            let y = this.mandelContext.vp.yToCoord(evt.clientY);

            this.setCurrentJuliaCenter(x, y);
            this.juliaContext.render();
        });
    }

    // Enable pausing of reactive julia rendering
    addPausingUpdateJulia() {
        window.addEventListener('keydown', (evt) => {
            if (evt.code == 'KeyF')
                this.mandelContext.indicatorFollowsMouse = !this.mandelContext.indicatorFollowsMouse;
            else if (evt.code == 'KeyR') {
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

        let cpuRendering = params[params.length - 1] == '1' ? true : false;

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

        for (var param of Object.keys(paramsObj)) {
            // Assert that no value is null
            if (param === null) return { parsedSuccessfully: false };
        }

        return {
            ...paramsObj,
            parsedSuccessfully: true,
        };
    };

    updateRenderFractals = (params, juliaPreviewContext: JuliaContext, juliaPreviewContainerId: string) => {
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
        //juliaPreviewContext.zoom(juliaPreviewCenter.x, juliaPreviewCenter.y, zoomLevel);
        //juliaPreviewContext.setCenterTo(juliaPreviewCenter.x, juliaPreviewCenter.y);
        this.juliaContext.setColorValues(normalizeRGB(color));
        this.juliaContext.colorInput.value = RGBToHex(color);
        this.juliaContext.setExponent(exponent);
        this.juliaContext.exponentInput.value = exponent.toString();
        this.juliaContext.setNrIterations(nrIterations);
        this.juliaContext.nrIterationsInput.value = nrIterations.toString();
        this.juliaContext.setEscapeRadius(escapeRadius);
        this.juliaContext.escapeRadiusInput.value = escapeRadius.toString();
        this.juliaContext.setColorSettings(colorSettings);
        this.juliaContext.colorSettingsInputs.forEach(
            (colorSettingInput, index) => (colorSettingInput.checked = colorSettings[index] != 0)
        );
        this.juliaContext.setCenterTo(juliaPreviewCenter.x, juliaPreviewCenter.y); // Set center and zoom as specified in filename
        this.juliaContext.zoom(juliaPreviewCenter.x, juliaPreviewCenter.y, zoomLevel);

        this.mandelContext.setColorValues(normalizeRGB(color));
        this.mandelContext.colorInput.value = RGBToHex(color);
        this.mandelContext.setExponent(exponent);
        this.mandelContext.exponentInput.value = exponent.toString();
        this.mandelContext.setNrIterations(nrIterations);
        this.mandelContext.nrIterationsInput.value = nrIterations.toString();
        this.mandelContext.setEscapeRadius(escapeRadius);
        this.mandelContext.escapeRadiusInput.value = escapeRadius.toString();
        this.mandelContext.setColorSettings(colorSettings);
        this.mandelContext.colorSettingsInputs.forEach(
            (colorSettingInput, index) => (colorSettingInput.checked = colorSettings[index] != 0)
        );

        this.juliaContext.render();
        this.mandelContext.render();

        // Update preview context if necessary
        const juliaPreviewContainer = document.getElementById(juliaPreviewContainerId);
        if (juliaPreviewContainer.style.display != 'block') return;
        updateJuliaPreviewContext(juliaPreviewContext, this.juliaContext);
        juliaPreviewContext.render();

        return;
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

        this.updateRenderFractals(params, juliaPreviewContext, juliaPreviewContainerId);

        this.mandelContext.indicatorFollowsMouse = false;
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

        var nextDestination: { x: number; y: number };

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

                fractalManager.setCurrentJuliaCenter(currentCenter.x, currentCenter.y);
                fractalManager.juliaContext.render();
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
