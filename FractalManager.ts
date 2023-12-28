import { FractalContext } from './FractalContext.js';
import { JuliaContext } from './JuliaContext.js';
import { MandelContext } from './MandelContext.js';
import { distance, limitLength } from './utils.js';

// Enables the communication between two FractalContexts via events
export class FractalManager {
    mandelContext: MandelContext;
    juliaContext: JuliaContext;

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
        this.mandelContext.updateCenterIndicator({ x: xCoord, y: yCoord });
        this.juliaContext.updateJuliaCCoords(xCoord, yCoord);
        this.updateJuliaCenterDisplayValues();
    }

    updateJuliaCenterDisplayValues = () => {
        let x = this.juliaContext.juliaCCoords.x;
        let y = this.juliaContext.juliaCCoords.y;
        this.juliaXCoordInput.value = x.toString().substring(0, 10 + (x < 0 ? 1 : 0));
        this.juliaYCoordInput.value = y.toString().substring(0, 10 + (y < 0 ? 1 : 0));
    };

    addJuliaCoordInputListeners = (juliaCenterXInputId: string, juliaCenterYInputId: string) => {
        this.juliaXCoordInput = <HTMLInputElement>document.getElementById(juliaCenterXInputId);
        this.juliaYCoordInput = <HTMLInputElement>document.getElementById(juliaCenterYInputId);
        // Coord input
        this.juliaXCoordInput.value = '0.0';
        this.juliaYCoordInput.value = '0.0';

        this.juliaXCoordInput.addEventListener('input', (evt) => {
            let x = parseFloat((<HTMLInputElement>evt.currentTarget).value);
            this.setCurrentJuliaCenter(x, this.juliaContext.juliaCCoords.y);
            this.juliaContext.render();
        });

        this.juliaYCoordInput.addEventListener('input', (evt) => {
            let y = parseFloat((<HTMLInputElement>evt.currentTarget).value);
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
        });
    }

    // Enable pausing of reactive julia rendering
    addPausingUpdateJulia() {
        window.addEventListener('keydown', (evt) => {
            if (evt.code == 'Space')
                this.mandelContext.indicatorFollowsMouse = !this.mandelContext.indicatorFollowsMouse;
        });
    }

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

        let currentCenter = this.juliaContext.juliaCCoords;

        async function outerLoop(i: number, fractalManager: FractalManager) {
            // Determine random next point to move to inside the defined area
            nextDestination = { x: Math.random() * (xMax - xMin) + xMin, y: Math.random() * (yMax - yMin) + yMin };
            innerLoop(0, fractalManager)
                .then(() => outerLoop(i, fractalManager))
                .catch();
        }

        async function innerLoop(frameNr: number, fractalManager: FractalManager) {
            return new Promise((resolve, reject) => {
                if (!fractalManager.movingRandom) reject();
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
                        innerLoop(frameNr + 1, fractalManager)
                            .then(() => resolve(''))
                            .catch(() => reject());
                    }, delay);
                } else setTimeout(() => resolve(''), delay);
            });
        }

        outerLoop(0, this);
    }
}
