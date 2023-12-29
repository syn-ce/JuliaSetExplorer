import { FractalContext } from './FractalContext.js';
import { split } from './glutils.js';

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
        this.setCenterTo(0, 0);
    }

    updateJuliaCCoords = (x: number, y: number) => {
        this.juliaCCoords.x = x;
        this.juliaCCoords.y = y;

        var cCoordsAttribLocation = this.gl.getUniformLocation(this.glProgram, 'cCoords');
        let splitX = split(this.juliaCCoords.x);
        let splitY = split(this.juliaCCoords.y);

        this.gl.uniform4f(cCoordsAttribLocation, splitX[0], splitX[1], splitY[0], splitY[1]);

        this.render();
    };
}
