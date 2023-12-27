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

    split = (a: number) => {
        const splitter = (1 << 29) + 1;
        const t = a * splitter;
        const t_hi = t - (t - a);
        const t_lo = a - t_hi;
        return [t_hi, t_lo];
    };

    updateJuliaCCoords = (x: number, y: number) => {
        this.juliaCCoords.x = x;
        this.juliaCCoords.y = y;

        var cCoordsAttribLocation = this.gl.getUniformLocation(this.glProgram, 'cCoords');
        let splitX = this.split(this.juliaCCoords.x);
        let splitY = this.split(this.juliaCCoords.y);
        console.log(splitX);
        console.log(splitY);
        this.gl.uniform4f(cCoordsAttribLocation, splitX[0], splitX[1], splitY[0], splitY[1]);

        this.render();
    };
}
