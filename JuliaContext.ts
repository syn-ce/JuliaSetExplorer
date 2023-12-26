import { FractalContext } from './FractalContext.js';

export class JuliaContext extends FractalContext {
    juliaCCoords: { x: number; y: number };

    juliaXCoordInput: HTMLInputElement;
    juliaYCoordInput: HTMLInputElement;

    constructor(
        canvas: HTMLCanvasElement,
        width: number,
        height: number,
        screenStart: { x: number; y: number },
        fragmentShaderText: string
    ) {
        super(canvas, width, height, screenStart, fragmentShaderText);
        this.juliaCCoords = { x: 0.0, y: 0.0 };
    }

    updateJuliaCCoords = (x: number, y: number) => {
        this.juliaCCoords.x = x;
        this.juliaCCoords.y = y;

        var cCoordsAttribLocation = this.gl.getUniformLocation(this.glProgram, 'cCoords');
        this.gl.uniform2f(cCoordsAttribLocation, this.juliaCCoords.x, this.juliaCCoords.y);

        this.render();
    };
}
