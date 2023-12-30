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

export const hexToRGB = (hexColor: string) => {
    const r = parseInt(hexColor.substring(1, 1 + 2), 16);
    const g = parseInt(hexColor.substring(3, 3 + 2), 16);
    const b = parseInt(hexColor.substring(5, 5 + 2), 16);
    return { r: r, g: g, b: b };
};

export const RGBToHex = (rgbColor: RGBColor) => {
    return `#${componentToHex(rgbColor.r)}${componentToHex(rgbColor.g)}${componentToHex(rgbColor.b)}`;
};

export const componentToHex = (c: number) => {
    var hex = c.toString(16);
    return hex.length == 1 ? '0' + hex : hex;
};

export const normalizeRGB = (rgbColor: RGBColor) => {
    return { r: rgbColor.r / 255, g: rgbColor.g / 255, b: rgbColor.b / 255 };
};

export const denormalizeRGB = (rgbColor: RGBColor) => {
    return { r: Math.round(rgbColor.r * 255), g: Math.round(rgbColor.g * 255), b: Math.round(rgbColor.b * 255) };
};
