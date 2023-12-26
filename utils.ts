import { FractalContext } from './FractalContext';
import { Viewport } from './viewport';

export type Complex = {
    real: number;
    imag: number;
};

export type RGBColor = { r: number; g: number; b: number };

export type PanningObj = {
    panningCanvas: boolean;
    startXInCoords: number;
    startYInCoords: number;
};

export const getCanvasElementById = (id: string): HTMLCanvasElement => {
    const canvas = document.getElementById(id);

    if (!(canvas instanceof HTMLCanvasElement)) {
        throw new Error(
            `The element of id "${id}" is not a HTMLCanvasElement. Make sure a <canvas id="${id}""> element is present in the document.`
        );
    }

    return canvas;
};

export const getCanvasRenderingContext2D = (canvas: HTMLCanvasElement): CanvasRenderingContext2D => {
    const context = canvas.getContext('2d');

    if (context === null) {
        throw new Error('This browser does not support 2-dimensional canvas rendering contexts.');
    }

    return context;
};

export const getWebGL2RenderingContext = (canvas: HTMLCanvasElement): WebGL2RenderingContext => {
    const context = canvas.getContext('webgl2');

    if (context === null) {
        throw new Error('Something went wrong and so far I did not bother to fix it. Perhaps you are using IE');
    }

    return context;
};

// For a zoom, we transform the entire space
export const zoomPoint = (cx: number, cy: number, z: number, a: number, b: number) => {
    return { x: a * z - z * cx + cx, y: b * z - z * cy + cy };
};

export const distance = (point1: { x: number; y: number }, point2: { x: number; y: number }) => {
    return Math.sqrt((point2.x - point1.x) ** 2 + (point2.y - point1.y) ** 2);
};

export const limitLength = (vec2d: { x: number; y: number }, limit: number) => {
    if (vec2d.x ** 2 + vec2d.y ** 2 > limit * limit) {
        let length = Math.sqrt(vec2d.x ** 2 + vec2d.y ** 2);
        vec2d.x = (vec2d.x / length) * limit;
        vec2d.y = (vec2d.y / length) * limit;
    }
};
