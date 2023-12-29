import { FractalContext } from './FractalContext.js';
import { JuliaContext } from './JuliaContext.js';
import { RGBColor } from './utils.js';
import { Viewport } from './viewport.js';

const previewDownloadImage = (juliaContext: JuliaContext, juliaPreviewContext: JuliaContext, borderId?: string) => {
    const juliaPreviewContainer = document.getElementById('download-preview-container');
    juliaPreviewContainer.style.display = 'block';
    const previewCanvas = juliaPreviewContext.canvas;
    //    previewCanvas.width = window.innerWidth / 2;
    //    previewCanvas.height = window.innerHeight / 2;
    //
    //previewCanvas.style.left = `${window.innerWidth / 4}px`;
    //previewCanvas.style.top = `${window.innerHeight / 4}px`;
    //

    const borderElement = document.getElementById(borderId);

    juliaPreviewContext.render();
    if (borderId) moveCanvas(juliaPreviewContext, borderElement);
    console.log('wtf');

    setTimeout(() => {
        resizeCanvas(
            juliaPreviewContext,
            window.innerWidth / 4 - 100,
            (window.innerWidth / 4) * 3,
            window.innerHeight / 4 + 100,
            (window.innerHeight / 4) * 3
        );
        if (borderId) moveCanvas(juliaPreviewContext, borderElement);

        juliaPreviewContext.render();
        console.log('done');
        addResizing(<HTMLElement>document.getElementById(borderId), juliaPreviewContext);
    }, 1000);
};

const resizeCanvas = (
    juliaContext: JuliaContext,
    xScreenLeft: number,
    xScreenRight: number,
    yScreenBot: number,
    yScreenTop: number
) => {
    let newWidth = xScreenRight - xScreenLeft;
    let newHeight = yScreenTop - yScreenBot;

    // Update the canvas
    let canvas = <HTMLCanvasElement>juliaContext.canvas;
    canvas.width = newWidth;
    canvas.height = newHeight;

    // Extrapolate new boundaries
    let newXMin = juliaContext.vp.xToCoord(xScreenLeft);
    let newYMin = juliaContext.vp.yToCoord(yScreenTop);
    let newYMax = juliaContext.vp.yToCoord(yScreenBot);

    // Update vp
    juliaContext.vp.updateVP(xScreenLeft, yScreenBot, newWidth, newHeight);

    // Update gl
    juliaContext.gl.viewport(0, 0, newWidth, newHeight);
    juliaContext.setScreenResolution(newWidth, newHeight);

    juliaContext.setXYRenderingBounds(newYMin, newYMax, newXMin);
};

// Used to move the border around the canvas
const moveCanvas = (juliaContext: JuliaContext, borderElement: HTMLElement) => {
    const canvas = juliaContext.canvas;

    borderElement.style.left = `${juliaContext.vp.screenStart.x.toString()}px`;
    borderElement.style.top = `${juliaContext.vp.screenStart.y.toString()}px`;
};

const addResizing = (canvasBorder: HTMLElement, juliaContext: JuliaContext) => {
    let threshold = 10;
    let isDragging = false;
    const draggingDirections = { left: false, right: false, top: false, bottom: false };
    let dragStart = { x: 0, y: 0 };
    let dragStartCanvasPos = { x: 0, y: 0 };
    let dragStartCanvasSize = { width: 0, height: 0 };

    canvasBorder.addEventListener('mousemove', (evt) => {
        if (!isDragging) {
            // Check for hover on border
            let boundingRect = canvasBorder.getBoundingClientRect();

            // Check if position is near/on border, not inside of canvas
            let xDiffLeft = evt.clientX - boundingRect.left;

            let leftHit = 0 <= xDiffLeft && xDiffLeft <= threshold;

            let xDiffRight = boundingRect.right - evt.clientX;
            let rightHit = 0 <= xDiffRight && xDiffRight <= threshold;

            let yDiffTop = evt.clientY - boundingRect.top;
            let topHit = 0 <= yDiffTop && yDiffTop <= threshold;

            let yDiffBot = boundingRect.bottom - evt.clientY;
            let bottomHit = 0 <= yDiffBot && yDiffBot <= threshold;

            if ((leftHit && topHit) || (rightHit && bottomHit)) canvasBorder.style.cursor = 'nwse-resize';
            else if ((leftHit && bottomHit) || (rightHit && topHit)) canvasBorder.style.cursor = 'nesw-resize';
            else if (leftHit || rightHit) canvasBorder.style.cursor = 'ew-resize';
            else if (topHit || bottomHit) canvasBorder.style.cursor = 'ns-resize';
            else canvasBorder.style.cursor = 'default';

            if (canvasBorder.style.cursor != 'default') {
                dragStart = { x: evt.clientX, y: evt.clientY };
                dragStartCanvasPos = juliaContext.vp.screenStart;
                dragStartCanvasSize = { width: juliaContext.canvas.width, height: juliaContext.canvas.height };
                draggingDirections.left = leftHit;
                draggingDirections.right = rightHit;
                draggingDirections.top = topHit;
                draggingDirections.bottom = bottomHit;
            }
            return;
        }
        // Dragging in progress
        let xDiffLeft = 0;
        let xDiffRight = 0;
        let yDiffTop = 0;
        let yDiffBot = 0;

        if (draggingDirections.left) xDiffLeft = evt.clientX - dragStart.x;
        else if (draggingDirections.right) xDiffRight = evt.clientX - dragStart.x;

        if (draggingDirections.top) yDiffTop = evt.clientY - dragStart.y;
        else if (draggingDirections.bottom) yDiffBot = evt.clientY - dragStart.y;

        resizeCanvas(
            juliaContext,
            dragStartCanvasPos.x + xDiffLeft,
            dragStartCanvasPos.x + dragStartCanvasSize.width + xDiffRight,
            dragStartCanvasPos.y + yDiffTop,
            dragStartCanvasPos.y + dragStartCanvasSize.height + yDiffBot
        );
        moveCanvas(juliaContext, canvasBorder);

        juliaContext.render();
    });
    canvasBorder.addEventListener('mousedown', (evt) => {
        // Start dragging
        // Check the cursor (bit "unsafe", but avoids duplication and unnecessary computation)
        if (canvasBorder.style.cursor != 'default') isDragging = true;
    });
    document.addEventListener('mouseup', (evt) => {
        isDragging = false;
        console.log('false');
    });
};

// Download button
const DownloadCanvasAsImage = (
    juliaContext: JuliaContext,
    juliaDrawingContext: JuliaContext,
    juliaPreviewContext: JuliaContext
) => {
    previewDownloadImage(juliaContext, juliaPreviewContext, 'download-preview-canvas-border');
    // This should open a small preview where one can select resolution and crop / zoom

    return;
    juliaDrawingContext.setEscapeRadius(juliaContext.escapeRadius);
    juliaDrawingContext.setXYRenderingBounds(juliaContext.vp.yMin, juliaContext.vp.yMax, juliaContext.vp.xMin);
    juliaDrawingContext.setColorValues(juliaContext.rgbColor);
    juliaDrawingContext.setExponent(juliaContext.exponent);
    // Need to set center explicitly because of the different canvas sizes and the way the bounds are set
    let xCenterJuliaContext2 = (juliaContext.vp.xMax + juliaContext.vp.xMin) * 0.5;
    let yCenterJuliaContext2 = (juliaContext.vp.yMax + juliaContext.vp.yMin) * 0.5;
    juliaDrawingContext.setCenterTo(xCenterJuliaContext2, yCenterJuliaContext2);
    juliaDrawingContext.updateJuliaCCoords(juliaContext.juliaCCoords.x, juliaContext.juliaCCoords.y);

    return;

    let downloadLink = document.createElement('a');
    downloadLink.setAttribute(
        'download',
        `JuliaSet_${juliaContext.rgbColor.r}_${juliaContext.rgbColor.g}_${juliaContext.rgbColor.b}_${juliaContext.exponent}_${juliaContext.escapeRadius}_${juliaContext.juliaCCoords.x}_${juliaContext.juliaCCoords.y}.png`
    );

    // Copy the values of the original juliaContext
    juliaDrawingContext.setEscapeRadius(juliaContext.escapeRadius);
    juliaDrawingContext.setXYRenderingBounds(juliaContext.vp.yMin, juliaContext.vp.yMax, juliaContext.vp.xMin);
    juliaDrawingContext.setColorValues(juliaContext.rgbColor);
    juliaDrawingContext.setExponent(juliaContext.exponent);
    // Need to set center explicitly because of the different canvas sizes and the way the bounds are set
    let xCenterJuliaContext = (juliaContext.vp.xMax + juliaContext.vp.xMin) * 0.5;
    let yCenterJuliaContext = (juliaContext.vp.yMax + juliaContext.vp.yMin) * 0.5;
    juliaDrawingContext.setCenterTo(xCenterJuliaContext, yCenterJuliaContext);
    juliaDrawingContext.updateJuliaCCoords(juliaContext.juliaCCoords.x, juliaContext.juliaCCoords.y);

    juliaDrawingContext.canvas.toBlob((blob) => {
        let url = URL.createObjectURL(blob);
        downloadLink.setAttribute('href', url);
        downloadLink.click();
    });
};

export const addSaveJuliaPNGBtnListeners = (
    juliaContext: JuliaContext,
    juliaDrawingContext: JuliaContext,
    btnId: string,
    juliaPreviewContext: JuliaContext
) => {
    const saveJuliaPNGBtn = document.getElementById(btnId);
    saveJuliaPNGBtn.onclick = (evt) => {
        DownloadCanvasAsImage(juliaContext, juliaDrawingContext, juliaPreviewContext);
    };
};

export const hexToRGB = (hexColor: string) => {
    const r = parseInt(hexColor.substring(1, 1 + 2), 16);
    const g = parseInt(hexColor.substring(3, 3 + 2), 16);
    const b = parseInt(hexColor.substring(5, 5 + 2), 16);
    return { r: r, g: g, b: b };
};

export const normalizeRGB = (rgbColor: RGBColor) => {
    return { r: rgbColor.r / 255, g: rgbColor.g / 255, b: rgbColor.b / 255 };
};
