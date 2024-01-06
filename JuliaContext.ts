import { FractalContext } from './FractalContext.js';
import { addVecs, complexExp, scaleVec } from './utils.js';

export class JuliaContext extends FractalContext {
    juliaCCoords: { x: number; y: number };

    juliaXCoordInput: HTMLInputElement;
    juliaYCoordInput: HTMLInputElement;

    constructor(
        canvas: HTMLCanvasElement,
        canvas2d: HTMLCanvasElement,
        width: number,
        height: number,
        screenStart: { x: number; y: number },
        fragmentShaderText: string,
        nrIterations: number
    ) {
        super(canvas, canvas2d, width, height, screenStart, fragmentShaderText, nrIterations);
        this.juliaCCoords = { x: 0.0, y: 0.0 };
        this.setCenterTo(0, 0);
    }

    setJuliaCCoords = (x: number, y: number) => {
        this.juliaCCoords.x = x;
        this.juliaCCoords.y = y;

        var cCoordsAttribLocation = this.gl.getUniformLocation(this.glProgram, 'cCoords');
        this.gl.uniform2f(cCoordsAttribLocation, this.juliaCCoords.x, this.juliaCCoords.y);
    };

    getColorValueForPoint = (x: number, y: number) => {
        let z = { real: x, imag: y };
        let c = { real: this.juliaCCoords.x, imag: this.juliaCCoords.y };

        for (let i = 0; i < this.nrIterations; i++) {
            z = complexExp(z.real, z.imag, this.exponent);
            z.real += c.real;
            z.imag += c.imag;

            if (z.real * z.real + z.imag * z.imag > this.escapeRadius) {
                const ismoothed =
                    i -
                    Math.log2(Math.log2(z.real * z.real + z.imag * z.imag) / Math.log2(this.escapeRadius)) /
                        Math.log2(this.exponent); // https://iquilezles.org/articles/msetsmooth
                var gray =
                    this.colorSettings[0] *
                        (i +
                            1 -
                            Math.log(Math.log(Math.sqrt(z.real * z.real + z.imag * z.imag))) /
                                Math.log(this.exponent)) +
                    (1 - this.colorSettings[0]) * i;
                gray = gray / this.nrIterations;

                const tmp = addVecs(
                    addVecs(
                        addVecs(
                            scaleVec(this.colorSettings[1], { x: gray * 4.2, y: gray * 1.2, z: gray * gray }),
                            scaleVec(this.colorSettings[2] * gray * 5.0, {
                                x: this.rgbColor.r,
                                y: this.rgbColor.g,
                                z: this.rgbColor.b,
                            })
                        ),
                        scaleVec(this.colorSettings[3], {
                            x: 0.5 + 0.5 * Math.sin(3.0 + ismoothed * this.rgbColor.r * 0.3),
                            y: 0.5 + 0.5 * Math.sin(3.0 + ismoothed * this.rgbColor.g * 0.3),
                            z: 0.5 + 0.5 * Math.sin(3.0 + ismoothed * this.rgbColor.b * 0.3),
                        })
                    ),
                    scaleVec(this.colorSettings[4], {
                        x: 0.5 + 0.5 * Math.sin(5.0 + ismoothed * 0.35 + ismoothed * this.rgbColor.r * 0.3),
                        y: 0.5 + 0.5 * Math.sin(5.0 + ismoothed * 0.35 + ismoothed * this.rgbColor.g * 0.3),
                        z: 0.5 + 0.5 * Math.sin(5.0 + ismoothed * 0.35 + ismoothed * this.rgbColor.b * 0.3),
                    })
                );

                return tmp; // Lies outside
            }
        }

        return { x: 0, y: 0, z: 0 }; // Lies inside
    };
}
