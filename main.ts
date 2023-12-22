import { getCanvasElementById, getCanvasRenderingContext2D } from './utils.js';

console.log('test');

class Pixel {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

class Viewport {
    vWidth: number;
    vHeight: number;
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
    ctx: CanvasRenderingContext2D;

    constructor(vWidth: number, vHeight: number, ctx: CanvasRenderingContext2D) {
        this.vWidth = vWidth;
        this.vHeight = vHeight;
        let aspectRatio = vWidth / vHeight;
        this.xMin = -aspectRatio - 0.5;
        this.xMax = aspectRatio - 0.5;
        this.yMin = -1;
        this.yMax = 1;
    }

    xToCoord(x: number) {
        return (x * (this.xMax - this.xMin)) / this.vWidth + this.xMin;
    }
    yToCoord(y: number) {
        return (y * (this.yMax - this.yMin)) / this.vHeight + this.yMin;
    }
    pixelToCoords(pixel: Pixel) {
        return new Pixel(
            (pixel.x * (this.xMax - this.xMin)) / this.vWidth + this.xMin,
            (pixel.y * (this.yMax - this.yMin)) / this.vHeight + this.yMin
        );
    }

    fillRect(topLeft: Pixel, bottomRight: Pixel) {
        const topLeftCoords = this.pixelToCoords(topLeft);
        const bottomRightCoords = this.pixelToCoords(bottomRight);
    }
}

const canvas = getCanvasElementById('main-canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ctx = getCanvasRenderingContext2D(canvas);

const vp = new Viewport(window.innerWidth, window.innerHeight, ctx);
ctx.fillRect(200, 400, 100, 50);

const nrIterations = 10;

const getColorValue = (x: number, y: number) => {
    let z = { real: 0, imag: 0 };
    let c = { real: x, imag: y };

    for (let i = 0; i < nrIterations; i++) {
        z.real = z.real * z.real - z.imag * z.imag + c.real;
        z.imag = 2 * z.real * z.imag + c.imag;

        if (z.real * z.real + z.imag * z.imag > 4) {
            return 1; // Lies outside
        }
    }

    return 0; // Lies inside
};

const drawMandelbrot = (ctx: CanvasRenderingContext2D) => {
    const imageData = ctx.getImageData(0, 0, window.innerWidth, window.innerHeight);
    const data = imageData.data;
    console.log(data);
    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            let ind = (y * canvas.width + x) * 4;
            let val = getColorValue(vp.xToCoord(x), vp.yToCoord(y));

            data[ind] = val * 255;
            data[ind + 1] = val * 255;
            data[ind + 2] = val * 255;
            data[ind + 3] = 255;
        }
    }

    console.log('yup');
    console.log(imageData);
    ctx.putImageData(imageData, 0, 0, 0, 0, window.innerWidth, window.innerHeight);
};

drawMandelbrot(ctx);
