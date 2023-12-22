import { getCanvasElementById, getCanvasRenderingContext2D } from './utils.js';

//document.getElementById('x-offset-in').oninput = (evt) => {
//    let val = (evt.currentTarget as HTMLInputElement).value;
//    document.getElementById('x-offset-out').innerHTML = 'x-off: ' + val;
//    vp.setXOffset(parseFloat(val));
//    drawMandelbrot(ctx);
//};
//
//document.getElementById('y-offset-in').oninput = (evt) => {
//    let val = (evt.currentTarget as HTMLInputElement).value;
//    document.getElementById('y-offset-out').innerHTML = 'y-off: ' + val;
//    vp.setYOffset(parseFloat(val));
//    drawMandelbrot(ctx);
//};

// For a zoom, we transform the entire space
const zoomPoint = (cx: number, cy: number, z: number, a: number, b: number) => {
    return { x: a * z - z * cx + cx, y: b * z - z * cy + cy };
};
const zoom = (x: number, y: number, z: number) => {
    // (x,y) - Center of zoom
    // z - Factor of zoom

    // Transform the defining points of the viewport
    console.log(`Zooming into ${x}, ${y}! zoooOOOOM`);
    console.log('old');
    console.log(vp.xMin);
    let xMin = zoomPoint(x, y, z, vp.xMin, 0).x;
    let xMax = zoomPoint(x, y, z, vp.xMax, 0).x;
    let yMin = zoomPoint(x, y, z, 0, vp.yMin).y;
    let yMax = zoomPoint(x, y, z, 0, vp.yMax).y;
    vp.xMin = xMin;
    vp.xMax = xMax;
    vp.yMin = yMin;
    vp.yMax = yMax;
    console.log('new');
    console.log('xMin = ' + vp.xMin);
    console.log('xMax = ' + vp.xMax);
    console.log('yMin = ' + vp.yMin);
    console.log('yMax = ' + vp.yMax);
    drawMandelbrot(ctx);
};

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
    xOffset: number;
    yOffset: number;

    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
    ctx: CanvasRenderingContext2D;

    constructor(vWidth: number, vHeight: number, ctx: CanvasRenderingContext2D) {
        this.vWidth = vWidth;
        this.vHeight = vHeight;
        this.xOffset = 0;
        this.yOffset = 0;
        this.yMin = -1; //+ this.yOffset;
        this.yMax = 1; //+ this.yOffset;
        this.xMin = -2; //+ this.xOffset;
        // The third value is calculated based on the aspect ratio of the screen
        this.xMax = (vWidth / vHeight) * (this.yMax - this.yMin) + this.xMin;
    }

    xToCoord(x: number) {
        return (x * (this.xMax - this.xMin)) / this.vWidth + this.xMin;
    }
    yToCoord(y: number) {
        return (y / this.vHeight) * (this.yMin - this.yMax) + this.yMax; // Flip so that the y-axis grows towards the top
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

    setXOffset(xOff: number) {
        this.xOffset = xOff;
        this.xMin = -2 + this.xOffset;
        this.xMax = (this.vWidth / this.vHeight) * (this.yMax - this.yMin) + this.xMin;
    }

    setYOffset(yOff: number) {
        this.yOffset = yOff;
        this.yMin = -1 + this.yOffset;
        this.yMax = 1 + this.yOffset;
        this.xMax = (this.vWidth / this.vHeight) * (this.yMax - this.yMin) + this.xMin;
    }
}

const canvas = getCanvasElementById('main-canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas.onclick = (evt) => {
    console.log(evt.clientX);
    console.log(evt.clientY);
    console.log(vp.xToCoord(evt.clientX));
    console.log(vp.yToCoord(evt.clientY));
    zoom(vp.xToCoord(evt.clientX), vp.yToCoord(evt.clientY), 0.5);
};

const ctx = getCanvasRenderingContext2D(canvas);

const vp = new Viewport(window.innerWidth, window.innerHeight, ctx);
ctx.fillRect(200, 400, 100, 50);

const nrIterations = 100;

const getColorValue = (x: number, y: number) => {
    let z = { real: 0, imag: 0 };
    let c = { real: x, imag: y };

    for (let i = 0; i < nrIterations; i++) {
        let real = z.real * z.real - z.imag * z.imag + c.real;
        let imag = (z.imag = 2 * z.real * z.imag + c.imag);

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

const drawMandelbrot = (ctx: CanvasRenderingContext2D) => {
    var startTime = performance.now();
    const imageData = ctx.getImageData(0, 0, window.innerWidth, window.innerHeight);
    const data = imageData.data;
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
    console.log(`time taken: ${performance.now() - startTime}`);
    ctx.putImageData(imageData, 0, 0, 0, 0, window.innerWidth, window.innerHeight);
};

const getEscapeTime = (x: number, y: number) => {
    let z = { real: 0, imag: 0 };
    let c = { real: x, imag: y };

    for (let i = 0; i < nrIterations; i++) {
        let real = z.real * z.real - z.imag * z.imag + c.real;
        let imag = (z.imag = 2 * z.real * z.imag + c.imag);

        z.real = real;
        z.imag = imag;

        if (z.real * z.real + z.imag * z.imag > 4) {
            return i; // Lies outside
        }
    }

    return 0;
};
const drawMandelbrotEscapeTime = (ctx: CanvasRenderingContext2D) => {
    const values: number[] = [];
    let max = 0;
    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            let val = getEscapeTime(vp.xToCoord(x), vp.yToCoord(y));
            values.push(val);
            if (val > max) max = val;
        }
    }

    const imageData = ctx.getImageData(0, 0, window.innerWidth, window.innerHeight);
    const data = imageData.data;
    for (let i = 0; i < values.length; i++) {
        let val = (values[i] / max) * 255;
        let ind = i * 4;
        data[ind] = val;
        data[ind + 1] = val;
        data[ind + 2] = val;
        data[ind + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0, 0, 0, window.innerWidth, window.innerHeight);
    console.log('Done');
};

//drawMandelbrot(ctx);
drawMandelbrotEscapeTime(ctx);
