import { normalizeRGB } from './colorUtils.js';
// Round color-values, nrIterations to integer values
export const roundInterpolatedFractalParams = (paramsList) => {
    for (const params of paramsList) {
        params.color = { r: Math.round(params.color.r), g: Math.round(params.color.g), b: Math.round(params.color.b) };
        params.nrIterations = Math.round(params.nrIterations);
    }
    return paramsList;
};
export const interpolateFractalParams = (nrFrames, currentState, goalState) => {
    const interpolatedFractalParamsList = [currentState];
    for (let i = 0; i < nrFrames; i++) {
        const step = (i + 1) / nrFrames;
        const color = {
            r: currentState.color.r + step * (goalState.color.r - currentState.color.r),
            g: currentState.color.g + step * (goalState.color.g - currentState.color.g),
            b: currentState.color.b + step * (goalState.color.b - currentState.color.b),
        };
        const fractalParams = {
            color: color,
            nrIterations: currentState.nrIterations + step * (goalState.nrIterations - currentState.nrIterations),
            exponent: currentState.exponent + step * (goalState.exponent - currentState.exponent),
            escapeRadius: currentState.escapeRadius + step * (goalState.escapeRadius - currentState.escapeRadius),
            juliaCoords: {
                x: currentState.juliaCoords.x + step * (goalState.juliaCoords.x - currentState.juliaCoords.x),
                y: currentState.juliaCoords.y + step * (goalState.juliaCoords.y - currentState.juliaCoords.y),
            },
            juliaPreviewCenter: {
                x: currentState.juliaPreviewCenter.x +
                    step * (goalState.juliaPreviewCenter.x - currentState.juliaPreviewCenter.x),
                y: currentState.juliaPreviewCenter.y +
                    step * (goalState.juliaPreviewCenter.y - currentState.juliaPreviewCenter.y),
            },
            zoomLevel: currentState.zoomLevel + step * (goalState.zoomLevel - currentState.zoomLevel),
            cpuRendering: false,
            // The way in which the shader is written (using multiplication instead of if/else) allows for
            // colorSetting-values other than 0 and 1
            colorSettings: currentState.colorSettings.map((colorSetting, ind) => colorSetting + step * (goalState.colorSettings[ind] - colorSetting)),
        };
        console.log(fractalParams.juliaPreviewCenter);
        interpolatedFractalParamsList.push(fractalParams);
    }
    return interpolatedFractalParamsList;
};
// Interpolates the correct FractalParams between startState and goalState at time t (t between 0 and 1 inclusive)
export const interpolateFractalParamsAtTime = (startState, goalState, t) => {
    const color = {
        r: startState.color.r + t * (goalState.color.r - startState.color.r),
        g: startState.color.g + t * (goalState.color.g - startState.color.g),
        b: startState.color.b + t * (goalState.color.b - startState.color.b),
    };
    const fractalParams = {
        color: color,
        nrIterations: startState.nrIterations + t * (goalState.nrIterations - startState.nrIterations),
        exponent: startState.exponent + t * (goalState.exponent - startState.exponent),
        escapeRadius: startState.escapeRadius + t * (goalState.escapeRadius - startState.escapeRadius),
        juliaCoords: {
            x: startState.juliaCoords.x + t * (goalState.juliaCoords.x - startState.juliaCoords.x),
            y: startState.juliaCoords.y + t * (goalState.juliaCoords.y - startState.juliaCoords.y),
        },
        juliaPreviewCenter: {
            x: startState.juliaPreviewCenter.x + t * (goalState.juliaPreviewCenter.x - startState.juliaPreviewCenter.x),
            y: startState.juliaPreviewCenter.y + t * (goalState.juliaPreviewCenter.y - startState.juliaPreviewCenter.y),
        },
        zoomLevel: startState.zoomLevel + t * (goalState.zoomLevel - startState.zoomLevel),
        cpuRendering: false,
        colorSettings: startState.colorSettings,
    };
};
export const setJuliaState = (juliaContext, params) => {
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
export const _transition = (juliaContext, params) => {
    //this.setCurrentJuliaCenter(params.juliaCoords.x, params.juliaCoords.y);
    //this.setFractalParamsUpdateInputs(this.juliaContext, params);
    // Only the JuliaSet will be zoomed, not the Mandelbrot
    //const currJuliaCenter = this.juliaContext.getCurrentCenter();
    //this.juliaContext.setZoom(currJuliaCenter.cX, currJuliaCenter.cY, params.zoomLevel);
    //this.juliaContext.setCenterTo(params.juliaPreviewCenter.x, params.juliaPreviewCenter.y);
    //this.setFractalParamsUpdateInputs(this.mandelContext, params);
    setJuliaState(juliaContext, params);
};
