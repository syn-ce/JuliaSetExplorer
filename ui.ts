import { FractalContext } from './FractalContext.js';
import { JuliaContext } from './JuliaContext.js';
import { RGBColor } from './utils.js';
import { Viewport } from './viewport.js';

// Download button
const DownloadCanvasAsImage = (juliaContext: JuliaContext, juliaDrawingContext: JuliaContext) => {
    let downloadLink = document.createElement('a');
    downloadLink.setAttribute(
        'download',
        `JuliaSet_${juliaContext.rgbColor.r}_${juliaContext.rgbColor.g}_${juliaContext.rgbColor.b}_${juliaContext.exponent}_${juliaContext.escapeRadius}_${juliaContext.juliaCCoords.x}_${juliaContext.juliaCCoords.y}.png`
    );

    // Copy the values of the original juliaContext
    juliaDrawingContext.setEscapeRadius(juliaContext.escapeRadius);
    juliaDrawingContext.setXYRenderingBounds(juliaContext.vp.yMin, juliaContext.vp.yMax, juliaContext.vp.xMin);
    juliaDrawingContext.setColorValues(juliaContext.rgbColor);
    juliaDrawingContext.setExponent(juliaContext.exponent);
    juliaDrawingContext.updateJuliaCCoords(juliaContext.juliaCCoords.x, juliaContext.juliaCCoords.y);
    // Need to set center explicitly because of the different canvas sizes and the way the bounds are set
    let xCenterJuliaContext = (juliaContext.vp.xMax + juliaContext.vp.xMin) * 0.5;
    let yCenterJuliaContext = (juliaContext.vp.yMax + juliaContext.vp.yMin) * 0.5;
    juliaDrawingContext.setCenterTo(xCenterJuliaContext, yCenterJuliaContext);

    juliaDrawingContext.render();

    juliaDrawingContext.canvas.toBlob((blob) => {
        let url = URL.createObjectURL(blob);
        downloadLink.setAttribute('href', url);
        downloadLink.click();
    });
};

export const addSaveJuliaPNGBtnListeners = (
    juliaContext: JuliaContext,
    juliaDrawingContext: JuliaContext,
    btnId: string
) => {
    const saveJuliaPNGBtn = document.getElementById(btnId);
    saveJuliaPNGBtn.onclick = (evt) => {
        DownloadCanvasAsImage(juliaContext, juliaDrawingContext);
    };
};

export const hexToRGB = (hexColor: string) => {
    const r = parseInt(hexColor.substring(1, 1 + 2), 16);
    const g = parseInt(hexColor.substring(3, 3 + 2), 16);
    const b = parseInt(hexColor.substring(5, 5 + 2), 16);
    return { r: r, g: g, b: b };
};

export const normalizeRGB = (rgbColor: RGBColor) => {
    return { r: rgbColor.r / 255, g: rgbColor.g / 255, b: rgbColor.b / 255 };
};
