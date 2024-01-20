export type PanningObj = {
    panningCanvas: boolean;
    startXInCoords: number;
    startYInCoords: number;
};

export const randInRange = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
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

export const canvasMoveEvent = () => {
    return new Event('moveCanvas');
};
