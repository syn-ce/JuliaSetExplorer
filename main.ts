import { PanningObj, distance, getCanvasElementById } from './utils.js';
import { addSaveJuliaPNGBtnListeners } from './ui.js';
import { FractalContext } from './FractalContext.js';
import { getFragmentShaderText } from './glutils.js';
import { JuliaContext } from './JuliaContext.js';
import { MandelContext } from './MandelContext.js';
import { FractalManager as FractalManager } from './FractalManager.js';

const canvasMandel = getCanvasElementById('mandel-canvas');

const canvasJulia = getCanvasElementById('julia-canvas');

const nrIterations = 10;

export var escapeRadius = 4.0;

const fragmentShaderTextMandel = getFragmentShaderText(nrIterations, 'vec4(0.0,0.0,0.0,0.0)', 'vec4(xs,ys)', '');
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

const fragmentShaderTextJulia = getFragmentShaderText(nrIterations, 'vec4(xs,ys)', 'cCoords', 'uniform vec4 cCoords;');
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

addSaveJuliaPNGBtnListeners(juliaContext);

juliaContext.updateJuliaCCoords(0.0, 0.0);

// Main render loop
mandelContext.render();
juliaContext.render();

// Enables communication between mandel and julia context
const fractalManager = new FractalManager(mandelContext, juliaContext, 'julia-center-x', 'julia-center-y');

const randomMovementBtn = document.getElementById('random-movement');
randomMovementBtn.onclick = (evt) => {
    if (!fractalManager.movingRandom) {
        fractalManager.randomMovement();
        console.log(evt);
    } else {
        fractalManager.stopRandomMovement();
    }
};

setTimeout(() => fractalManager.stopRandomMovement(), 1000);
