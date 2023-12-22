import { Complex } from './utils.js';

export class JuliaSet {
    c: Complex;
    nrIterations: number;
    constructor(c: Complex, nrIterations: number) {
        this.c = c;
        this.nrIterations = nrIterations;
    }

    getColorValue = (x: number, y: number) => {
        let z = { real: x, imag: y };

        for (let i = 0; i < this.nrIterations; i++) {
            let real = z.real * z.real - z.imag * z.imag + this.c.real;
            let imag = (z.imag = 2 * z.real * z.imag + this.c.imag);

            //let real = z.real ** 3 - 3 * z.real * z.imag * z.imag;
            //let imag = -(z.imag ** 3) + 3 * z.real * z.real * y;
            z.real = real;
            z.imag = imag;

            if (z.real * z.real + z.imag * z.imag > 4) {
                return 1; // Lies outside
            }
        }

        return 0; // Lies inside
    };
}
