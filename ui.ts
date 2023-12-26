import { FractalContext } from './FractalContext.js';
import { JuliaContext } from './JuliaContext.js';
import { RGBColor } from './utils.js';
import { Viewport } from './viewport.js';

// Download button
const DownloadCanvasAsImage = (escapeRadius: number, juliaCCoords: { x: number; y: number }) => {
    let downloadLink = document.createElement('a');
    downloadLink.setAttribute('download', `JuliaSet_${escapeRadius}_${juliaCCoords.x}_${juliaCCoords.y}.png`);
    let canvas = <HTMLCanvasElement>document.getElementById('julia-canvas');
    canvas.toBlob((blob) => {
        let url = URL.createObjectURL(blob);
        downloadLink.setAttribute('href', url);
        downloadLink.click();
    });
};

export const addSaveJuliaPNGBtnListeners = (juliaContext: JuliaContext) => {
    const saveJuliaPNGBtn = document.getElementById('save-julia-png-btn');
    saveJuliaPNGBtn.onclick = (evt) => {
        juliaContext.updateJuliaCCoords(juliaContext.juliaCCoords.x, juliaContext.juliaCCoords.y); // Needed because the canvas' buffer will be cleared and
        // therefore empty at this point, which would result in an empty (all transparent/black) image being downloaded
        DownloadCanvasAsImage(juliaContext.escapeRadius, juliaContext.juliaCCoords);
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
