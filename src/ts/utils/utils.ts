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

export type ColorSettings = number[];

export type Vec3D = { x: number; y: number; z: number };

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

export const scaleVec = (scalar: number, vec3d: Vec3D) => {
    return { x: vec3d.x * scalar, y: vec3d.y * scalar, z: vec3d.z * scalar };
};

export const addVecs = (vec3d1: Vec3D, vec3d2: Vec3D) => {
    return { x: vec3d1.x + vec3d2.x, y: vec3d1.y + vec3d2.y, z: vec3d1.z + vec3d2.z };
};

// c = x + i*y
export const complexExp = (x: number, y: number, exponent: number) => {
    const arg = Math.atan2(y, x);
    const r = Math.sqrt(x * x + y * y);
    // De Moivre's formula
    const r_n = Math.pow(r, exponent);
    x = r_n * Math.cos(exponent * arg);
    y = r_n * Math.sin(exponent * arg);
    return { real: x, imag: y };
};

export const canvasMoveEvent = () => {
    return new Event('moveCanvas');
};

const colorSettingsAbbreviations = ['SC', 'SO', 'LC', 'NL1', 'NL2'];

export const getColorSettingsAbbreviations = (colorSettings: ColorSettings) => {
    return colorSettingsAbbreviations.filter((colorSettingAbbr, index) => colorSettings[index] != 0);
};

export const getColorSettingsFromAbbreviations = (colorSettingsAbbrvs: string[]) => {
    const colorSettings = Array(5).fill(0);

    colorSettingsAbbrvs.forEach(
        // Set corresponding settings to 1
        (colorSettingAbbr) => (colorSettings[colorSettingsAbbreviations.indexOf(colorSettingAbbr)] = 1)
    );

    return colorSettings;
};