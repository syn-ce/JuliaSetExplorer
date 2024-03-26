import { FractalParams } from '../fractal/FractalParams.js';
import { JuliaContext } from '../fractal/JuliaContext.js';
import { RGBColor, normalizeRGB } from './colorUtils.js';

// Round color-values, nrIterations to integer values
export const roundInterpolatedFractalParams = (paramsList: FractalParams[]) => {
    for (const params of paramsList) {
        params.color = { r: Math.round(params.color.r), g: Math.round(params.color.g), b: Math.round(params.color.b) };
        params.nrIterations = Math.round(params.nrIterations);
    }
    return paramsList;
};

export const interpolateFractalParams = (nrFrames: number, currentState: FractalParams, goalState: FractalParams) => {
    const interpolatedFractalParamsList: FractalParams[] = [];
    for (let i = 0; i < nrFrames; i++) {
        const step = (i + 1) / nrFrames;
        const color: RGBColor = {
            r: currentState.color.r + step * (goalState.color.r - currentState.color.r),
            g: currentState.color.g + step * (goalState.color.g - currentState.color.g),
            b: currentState.color.b + step * (goalState.color.b - currentState.color.b),
        };

        const fractalParams: FractalParams = {
            color: color,
            nrIterations: currentState.nrIterations + step * (goalState.nrIterations - currentState.nrIterations),
            exponent: currentState.exponent + step * (goalState.exponent - currentState.exponent),
            escapeRadius: currentState.escapeRadius + step * (goalState.escapeRadius - currentState.escapeRadius),
            juliaCoords: {
                x: currentState.juliaCoords.x + step * (goalState.juliaCoords.x - currentState.juliaCoords.x),
                y: currentState.juliaCoords.y + step * (goalState.juliaCoords.y - currentState.juliaCoords.y),
            },
            juliaPreviewCenter: {
                x:
                    currentState.juliaPreviewCenter.x +
                    step * (goalState.juliaPreviewCenter.x - currentState.juliaPreviewCenter.x),
                y:
                    currentState.juliaPreviewCenter.y +
                    step * (goalState.juliaPreviewCenter.y - currentState.juliaPreviewCenter.y),
            },
            zoomLevel: currentState.zoomLevel + step * (goalState.zoomLevel - currentState.zoomLevel),
            cpuRendering: false,
            colorSettings: currentState.colorSettings,
        };

        console.log(fractalParams.juliaPreviewCenter);

        interpolatedFractalParamsList.push(fractalParams);
    }

    return interpolatedFractalParamsList;
};

export const setJuliaState = (juliaContext: JuliaContext, params: FractalParams) => {
    juliaContext.setColorValues(normalizeRGB(params.color));
    juliaContext.setNrIterations(params.nrIterations);
    juliaContext.setExponent(params.exponent);
    juliaContext.setEscapeRadius(params.escapeRadius);
    juliaContext.setColorSettings(params.colorSettings);
    juliaContext.setJuliaCCoords(params.juliaCoords.x, params.juliaCoords.y);
    juliaContext.setCPURendering(false /*params.cpuRendering*/); // Worry about cpuRendering later
    juliaContext.setColorSettings(params.colorSettings);
    juliaContext.setCenterTo(params.juliaPreviewCenter.x, params.juliaPreviewCenter.y);
    juliaContext.setZoom(params.juliaPreviewCenter.x, params.juliaPreviewCenter.y, params.zoomLevel);
};

export const _transition = (juliaContext: JuliaContext, params: FractalParams) => {
    //this.setCurrentJuliaCenter(params.juliaCoords.x, params.juliaCoords.y);
    //this.setFractalParamsUpdateInputs(this.juliaContext, params);
    // Only the JuliaSet will be zoomed, not the Mandelbrot
    //const currJuliaCenter = this.juliaContext.getCurrentCenter();
    //this.juliaContext.setZoom(currJuliaCenter.cX, currJuliaCenter.cY, params.zoomLevel);
    //this.juliaContext.setCenterTo(params.juliaPreviewCenter.x, params.juliaPreviewCenter.y);
    //this.setFractalParamsUpdateInputs(this.mandelContext, params);
    setJuliaState(juliaContext, params);
};
