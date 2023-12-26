import { FractalContext } from './FractalContext.js';
import { JuliaContext } from './JuliaContext.js';
import { MandelContext } from './MandelContext.js';

// Enables the communication between two FractalContexts via events
export class FractalCommunication {
    mandelContext: MandelContext;
    juliaContext: JuliaContext;

    currentJuliaCenter: { x: number; y: number };
    juliaXCoordInput: HTMLInputElement;
    juliaYCoordInput: HTMLInputElement;

    juliaFollowsMouse: boolean;

    constructor(context1: MandelContext, context2: JuliaContext) {
        this.mandelContext = context1;
        this.juliaContext = context2;

        this.currentJuliaCenter = { x: 0.0, y: 0.0 };
        this.juliaFollowsMouse = true;

        this.addJuliaCoordInputListeners();
    }

    addListener(
        eventType: string,
        listeningObj: HTMLElement,
        evtHandler: (mandelContext: MandelContext, juliaContext: JuliaContext, evt: Event) => void
    ) {
        listeningObj.addEventListener(eventType, (evt) => evtHandler(this.mandelContext, this.juliaContext, evt));
    }

    setCurrentJuliaCenter(xCoord: number, yCoord: number) {
        this.mandelContext.updateCenterIndicator({ x: xCoord, y: yCoord });
        this.juliaContext.updateJuliaCCoords(xCoord, yCoord);
        this.updateJuliaCenterDisplayValues();
    }

    addJuliaCoordInputListeners = () => {
        this.juliaXCoordInput = <HTMLInputElement>document.getElementById('julia-center-x');
        this.juliaYCoordInput = <HTMLInputElement>document.getElementById('julia-center-y');
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
    };

    updateJuliaCenterDisplayValues = () => {
        let x = this.juliaContext.juliaCCoords.x;
        let y = this.juliaContext.juliaCCoords.y;
        this.juliaXCoordInput.value = x.toString().substring(0, 6 + (x < 0 ? 1 : 0));
        this.juliaYCoordInput.value = y.toString().substring(0, 6 + (y < 0 ? 1 : 0));
    };
}
