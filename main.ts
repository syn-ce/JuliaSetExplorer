import { PanningObj, getCanvasElementById } from './utils.js';
import { addSaveJuliaPNGBtnListeners } from './ui.js';
import { FractalContext } from './FractalContext.js';
import { getFragmentShaderText } from './glutils.js';
import { JuliaContext } from './JuliaContext.js';
import { MandelContext } from './MandelContext.js';
import { FractalCommunication } from './FractalCommunication.js';

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

addSaveJuliaPNGBtnListeners(juliaContext);

juliaContext.updateJuliaCCoords(0.0, 0.0);

// Main render loop
mandelContext.render();
juliaContext.render();

const fractalCommunication = new FractalCommunication(mandelContext, juliaContext);

// Update julia center when moving mouse on mandel canvas
fractalCommunication.addListener('mousemove', mandelContext.canvas, (mandelContext, juliaContext, evt: MouseEvent) => {
    if (!fractalCommunication.mandelContext.indicatorFollowsMouse || mandelContext.panningObject.panningCanvas) return;

    let x = mandelContext.vp.xToCoord(evt.clientX);
    let y = mandelContext.vp.yToCoord(evt.clientY);

    fractalCommunication.setCurrentJuliaCenter(x, y);
});

// Enable pausing of reactive julia rendering
window.addEventListener('keydown', (evt) => {
    if (evt.code == 'Space') mandelContext.indicatorFollowsMouse = !mandelContext.indicatorFollowsMouse;
});

const distance = (point1: { x: number; y: number }, point2: { x: number; y: number }) => {
    return Math.sqrt((point2.x - point1.x) ** 2 + (point2.y - point1.y) ** 2);
};

function randomJuliaMovement() {
    let xMin = -2.0;
    let xMax = 1.5;
    let yMin = -1.5;
    let yMax = 1.5;
    // Move to this destination for a couply of frames
    let nrFrames = 60;

    let acceleration = { x: 0.0, y: 0.0 };
    let velocity = { x: 0.0, y: 0.0 };

    const delay = 1000 / 60;
    var nextDestination: { x: number; y: number };

    let juliaCCoords = juliaContext.juliaCCoords;
    async function outerLoop(i: number) {
        // Determine random next point to move to inside the defined area
        nextDestination = { x: Math.random() * (xMax - xMin) + xMin, y: Math.random() * (yMax - yMin) + yMin };
        innerLoop(0).then(() => outerLoop(i));
    }

    async function innerLoop(frameNr: number) {
        return new Promise((resolve, reject) => {
            // Adjust the acceleration to point towards the destination
            acceleration = { x: nextDestination.x - juliaCCoords.x, y: nextDestination.y - juliaCCoords.y };
            velocity.x += acceleration.x * 0.0001;
            velocity.y += acceleration.y * 0.0001;

            juliaCCoords.x += velocity.x;
            juliaCCoords.y += velocity.y;

            fractalCommunication.updateJuliaCenterDisplayValues();

            juliaContext.updateJuliaCCoords(juliaCCoords.x, juliaCCoords.y);
            juliaContext.render();
            if (frameNr < nrFrames && distance(nextDestination, juliaCCoords) > 0.0001) {
                setTimeout(() => {
                    innerLoop(frameNr + 1).then(() => resolve(''));
                }, delay);
            } else setTimeout(() => resolve(''), delay);
        });
    }

    outerLoop(0);
}

const randomMovementBtn = document.getElementById('random-movement');
randomMovementBtn.onclick = (evt) => {
    randomJuliaMovement();
};
