import { RGBToHex, denormalizeRGB, getCanvasElementById } from './utils.js';
import {
    addDownloadBtnFunctionality,
    addDownloadResInputListener,
    addResizing,
    addSaveJuliaPNGBtnListeners,
} from './ui.js';
import { getFragmentShaderText } from './glutils.js';
import { JuliaContext } from './JuliaContext.js';
import { MandelContext } from './MandelContext.js';
import { FractalManager as FractalManager } from './FractalManager.js';

const canvasMandel = getCanvasElementById('mandel-canvas');

const canvasJulia = getCanvasElementById('julia-canvas');

const nrIterations = 100;

export var escapeRadius = 4.0;

const fragmentShaderTextMandel = getFragmentShaderText(nrIterations, 'vec2(0.0,0.0)', 'vec2(x,y)', '');
const mandelContext = new MandelContext(
    canvasMandel,
    window.innerWidth / 2,
    window.innerHeight,
    { x: 0, y: 0 },
    fragmentShaderTextMandel
);

mandelContext.addColorInputListener('color-picker');
mandelContext.addEscapeRadiusInputListener('escape-radius');
mandelContext.addExponentInputListener('exponent');

const fragmentShaderTextJulia = getFragmentShaderText(nrIterations, 'vec2(x,y)', 'cCoords', 'uniform vec2 cCoords;');
const juliaContext = new JuliaContext(
    canvasJulia,
    window.innerWidth / 2,
    window.innerHeight,
    {
        x: mandelContext.vp.vWidth,
        y: 0,
    },
    fragmentShaderTextJulia
);

juliaContext.addColorInputListener('color-picker');
juliaContext.addEscapeRadiusInputListener('escape-radius');
juliaContext.addExponentInputListener('exponent');

const juliaDrawingCanvas = <HTMLCanvasElement>document.createElement('canvas');
const juliaDrawingContext = new JuliaContext(juliaDrawingCanvas, 3092, 1920, { x: 0, y: 0 }, fragmentShaderTextJulia);

const juliaPreviewCanvas = <HTMLCanvasElement>document.getElementById('download-preview-canvas');
const juliaPreviewContext = new JuliaContext(
    juliaPreviewCanvas,
    window.innerWidth / 2,
    window.innerHeight / 2,
    { x: window.innerWidth / 4, y: window.innerHeight / 4 },
    fragmentShaderTextJulia
);

juliaPreviewContext.zoomFactor = 1.15; // Make zoom for preview less aggressive (easier to "fine-tune")

const juliaPreviewCanvasBorder = <HTMLElement>document.getElementById('download-preview-canvas-border');

addResizing(juliaPreviewCanvasBorder, juliaPreviewContext);
addDownloadResInputListener(juliaPreviewContext);

addDownloadBtnFunctionality(juliaDrawingContext, juliaPreviewContext);

juliaPreviewContext.setCenterTo(0, 0);

addSaveJuliaPNGBtnListeners(juliaContext, juliaDrawingContext, 'save-julia-png-btn', juliaPreviewContext);

juliaContext.setColorValues({ r: 0.0, g: 0.1, b: 0.1 });
mandelContext.setColorValues({ r: 0.0, g: 0.1, b: 0.1 });

juliaContext.updateJuliaCCoords(0.0, 0.0);

const colorPicker = <HTMLInputElement>document.getElementById('color-picker');
colorPicker.value = RGBToHex(denormalizeRGB({ r: 0.0, g: 0.1, b: 0.1 }));

// Main render loop
mandelContext.render();
juliaContext.render();

// Enables communication between mandel and julia context
const fractalManager = new FractalManager(mandelContext, juliaContext, 'julia-center-x', 'julia-center-y');

const randomMovementBtn = document.getElementById('random-movement');
randomMovementBtn.onclick = (evt) => {
    if (!fractalManager.movingRandom) {
        fractalManager.randomMovement();
    } else {
        fractalManager.stopRandomMovement();
    }
};

const previewCenterOriginBtn = <HTMLInputElement>document.getElementById('preview-center-origin-btn');
previewCenterOriginBtn.onclick = (evt) => {
    juliaPreviewContext.setCenterTo(0, 0);
    juliaPreviewContext.render();
};

const getColorSettings = () => {
    return colorSettingsInputs.map((input) => ((<HTMLInputElement>input).checked ? 1.0 : 0.0));
};

const colorDropdown = document.getElementById('color-dropdown');
const colorSettingsInputs: Element[] = Array.from(colorDropdown.children);
colorSettingsInputs.forEach((input) =>
    input.addEventListener('input', (evt) => {
        const colorSettings = getColorSettings();
        juliaContext.setColorSettings(colorSettings);
        juliaContext.render();
        mandelContext.setColorSettings(getColorSettings());
        mandelContext.render();
    })
);
console.log(colorDropdown.children);
