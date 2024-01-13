import { RGBToHex, denormalizeRGB, getCanvasElementById } from './utils/utils.js';
import {
    addSaveJuliaPNGBtnListeners,
    setupHideUIButton,
    setupPreviewCenterOriginBtn,
    setupPreviewCPURenderBtn,
    setupPreviewDownload,
    addDragEventListeners,
} from './fractal/ui.js';
import { getFragmentShaderText } from './utils/glutils.js';
import { JuliaContext } from './fractal/JuliaContext.js';
import { MandelContext } from './fractal/MandelContext.js';
import { FractalManager } from './fractal/FractalManager.js';
import { setupHelpModal } from './ui/helpmodal.js';

const canvasMandel = getCanvasElementById('mandel-canvas');
const canvasMandel2d = getCanvasElementById('mandel-canvas-2d');

const canvasJulia = getCanvasElementById('julia-canvas');
const canvasJulia2d = getCanvasElementById('julia-canvas-2d');

const nrIterations = 300;

const fragmentShaderTextMandel = getFragmentShaderText('vec2(0.0,0.0)', 'vec2(x,y)', '');
const mandelContext = new MandelContext(
    canvasMandel,
    canvasMandel2d,
    window.innerWidth / 2,
    window.innerHeight,
    { x: 0, y: 0 },
    fragmentShaderTextMandel,
    nrIterations
);

mandelContext.addColorInputListener('color-picker');
mandelContext.addEscapeRadiusInputListener('escape-radius');
mandelContext.addExponentInputListener('exponent');
mandelContext.addNrIterationsInputListener('nr-iterations');
mandelContext.addColorSettingsInputs('color-dropdown');

const fragmentShaderTextJulia = getFragmentShaderText('vec2(x,y)', 'cCoords', 'uniform vec2 cCoords;');
const juliaContext = new JuliaContext(
    canvasJulia,
    canvasJulia2d,
    window.innerWidth / 2,
    window.innerHeight,
    {
        x: mandelContext.vp.vWidth,
        y: 0,
    },
    fragmentShaderTextJulia,
    nrIterations
);

juliaContext.addColorInputListener('color-picker');
juliaContext.addEscapeRadiusInputListener('escape-radius');
juliaContext.addExponentInputListener('exponent');
juliaContext.addNrIterationsInputListener('nr-iterations');
juliaContext.addColorSettingsInputs('color-dropdown');

const juliaDrawingCanvas = <HTMLCanvasElement>document.createElement('canvas');
const juliaDrawingCanvas2d = <HTMLCanvasElement>document.createElement('canvas');
const juliaDrawingContext = new JuliaContext(
    juliaDrawingCanvas,
    juliaDrawingCanvas2d,
    3092,
    1920,
    { x: 0, y: 0 },
    fragmentShaderTextJulia,
    nrIterations
);

juliaDrawingContext.setProgressBarElement('cpu-rendering-progress-bar', 'cpu-rendering-progress-bar-time');

const juliaPreviewCanvas = <HTMLCanvasElement>document.getElementById('download-preview-canvas');
const juliaPreviewCanvas2d = <HTMLCanvasElement>document.getElementById('download-preview-canvas-2d');
const juliaPreviewContext = new JuliaContext(
    juliaPreviewCanvas,
    juliaPreviewCanvas2d,
    window.innerWidth / 2,
    window.innerHeight / 2,
    { x: window.innerWidth / 4, y: window.innerHeight / 4 },
    fragmentShaderTextJulia,
    nrIterations
);

juliaPreviewContext.zoomFactor = 1.15; // Make zoom for preview less aggressive (easier to "fine-tune")
juliaPreviewContext.setProgressBarElement('live-cpu-rendering-progress-bar', '');

// Add event listeners to buttons, inputs
setupPreviewDownload(
    juliaDrawingContext,
    juliaPreviewContext,
    'download-julia-btn',
    'download-resolution-x',
    'download-resolution-y'
);

juliaPreviewContext.setCenterTo(0, 0);
juliaPreviewContext.addDoubleClickCenterPoint();
juliaPreviewContext.addCenterInputs('download-center-x', 'download-center-y');
juliaPreviewContext.addZoomInput('preview-zoom');

addSaveJuliaPNGBtnListeners(juliaContext, juliaDrawingContext, 'save-julia-png-btn', juliaPreviewContext);

// Set initial color
juliaContext.setColorValues({ r: 0.1, g: 0.46, b: 0.0 });
mandelContext.setColorValues({ r: 0.1, g: 0.46, b: 0.0 });

const colorPicker = <HTMLInputElement>document.getElementById('color-picker');
colorPicker.value = RGBToHex(denormalizeRGB({ r: 0.1, g: 0.46, b: 0.0 }));

// Set initial center value
juliaContext.setJuliaCCoords(0.0, 0.0);
mandelContext.updateCenterIndicator({ x: 0.0, y: 0.0 });

// Enables communication between mandel and julia context
const fractalManager = new FractalManager(mandelContext, juliaContext, 'julia-center-x', 'julia-center-y');

// Enable dropping of files
addDragEventListeners(fractalManager, juliaPreviewContext);

// Hide-UI-Button
setupHideUIButton('hide-ui-btn');

// Center origin in preview button
setupPreviewCenterOriginBtn(juliaPreviewContext, 'preview-center-origin-btn');

// CPU Rendering button in preview
setupPreviewCPURenderBtn(juliaPreviewContext, 'preview-cpu-render-btn');

// Help modal
setupHelpModal();

// Render
juliaContext.render();
mandelContext.render();