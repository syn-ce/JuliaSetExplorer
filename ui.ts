import { JuliaContext } from './JuliaContext.js';
import { RGBColor } from './utils.js';

const juliaPreviewCloser = <HTMLElement>document.getElementById('close-save-preview');
const juliaPreviewContainer = document.getElementById('download-preview-container');
juliaPreviewCloser.addEventListener('click', (evt) => {
    juliaPreviewContainer.style.display = 'none';
});

const downloadResXInput = <HTMLInputElement>document.getElementById('download-resolution-x');
const downloadResYInput = <HTMLInputElement>document.getElementById('download-resolution-y');

const downloadResolution = { x: 1920, y: 1080 };

downloadResXInput.value = downloadResolution.x.toString();
downloadResYInput.value = downloadResolution.y.toString();

// Will change the x-value so that the result matches the aspect ratio, will move the window to the center of the screen
const setAspectRatio = (juliaPreviewContext: JuliaContext, aspectRatio: number) => {
    // Try adjusting aspect ratio so that the image gets bigger (if possible) but stays on screen
    console.log('aspect ratio = ' + aspectRatio);
    console.log('canvas width = ' + juliaPreviewContext.canvas.width);
    console.log('canvas height = ' + juliaPreviewContext.canvas.height);
    let newWidth = Math.round(juliaPreviewContext.canvas.height * aspectRatio);
    let newHeight = Math.round(juliaPreviewContext.canvas.width / aspectRatio);
    console.log('new width = ' + newWidth);
    console.log('new height = ' + newHeight);
    console.log('resolution: ');
    console.log(structuredClone(downloadResolution));

    if (
        (100 < newWidth && newWidth <= window.innerWidth - 10) ||
        (100 < newHeight && newHeight <= window.innerHeight - 10)
    ) {
    } else {
        // Got some fixing to do
        // Try increasing the width from 300 pixels until it fits
        let newNewWidth = 200;
        let newNewHeight = newHeight;
        while (newNewWidth <= window.innerWidth - 10) {
            if (100 < newNewHeight && newNewHeight <= window.innerHeight - 10) break;
            newNewWidth += 50;
            newNewHeight = newNewWidth / aspectRatio;
        }
        if (100 < newNewHeight && newNewHeight <= window.innerHeight - 10)
            (newWidth = newNewWidth), (newHeight = newNewWidth);
        console.log('tried = ' + newNewWidth);
        console.log('tried = ' + newNewHeight);
    }

    // Try to keep the width and height around window.innerWidth / 2 and window.innerHeight respectively
    if (newWidth <= window.innerWidth - 10) {
        let xLeft = window.innerWidth / 2 - newWidth / 2;
        let xRight = window.innerWidth / 2 + newWidth / 2;
        resizeCanvas(
            juliaPreviewContext,
            xLeft,
            xRight,
            juliaPreviewContext.vp.screenStart.y,
            juliaPreviewContext.vp.screenStart.y + juliaPreviewContext.canvas.height
        );
    } else {
        let yBot = window.innerHeight / 2 - newHeight / 2;
        let yTop = window.innerHeight / 2 + newHeight / 2;
        resizeCanvas(
            juliaPreviewContext,
            juliaPreviewContext.vp.screenStart.x,
            juliaPreviewContext.vp.screenStart.x + juliaPreviewContext.canvas.width,
            yBot,
            yTop
        );
    }

    console.log('§ULSJDFKSJDFÖKLJSDKLj');
    console.log(structuredClone(downloadResolution));

    moveCanvas(juliaPreviewContext, <HTMLElement>document.getElementById('download-preview-canvas-border'));
    juliaPreviewContext.render();
};

export const addDownloadResInputListener = (juliaPreviewContext: JuliaContext) => {
    addDownloadResXInputListener(juliaPreviewContext);
    addDownloadResYInputListener(juliaPreviewContext);
};

const addDownloadResXInputListener = (juliaPreviewContext: JuliaContext) => {
    downloadResXInput.addEventListener('input', (evt) => {
        let xVal = parseInt((<HTMLInputElement>evt.currentTarget).value);
        // Change ratio accordingly
        let ratio = xVal / downloadResolution.y;
        console.log(structuredClone(downloadResolution));
        console.log('ratio = ' + ratio);
        console.log('downloadres.x = ' + downloadResolution.x);
        console.log('xval = ' + xVal);
        console.log('jlk');
        setAspectRatio(juliaPreviewContext, ratio);
        downloadResolution.x = xVal;
    });
};

const addDownloadResYInputListener = (juliaPreviewContext: JuliaContext) => {
    downloadResYInput.addEventListener('input', (evt) => {
        let yVal = parseInt((<HTMLInputElement>evt.currentTarget).value);
        // Change ratio accordingly
        let ratio = downloadResolution.x / yVal;
        console.log(structuredClone(downloadResolution));
        console.log('ratio = ' + ratio);
        console.log('yval = ' + yVal);
        setAspectRatio(juliaPreviewContext, ratio);
        downloadResolution.y = yVal;
    });
};

const previewDownloadImage = (juliaContext: JuliaContext, juliaPreviewContext: JuliaContext, borderId?: string) => {
    const juliaPreviewContainer = document.getElementById('download-preview-container');
    juliaPreviewContainer.style.display = 'block';

    const borderElement = document.getElementById(borderId);

    if (borderId) moveCanvas(juliaPreviewContext, borderElement);

    juliaPreviewContext.setEscapeRadius(juliaContext.escapeRadius);
    juliaPreviewContext.setXYRenderingBounds(juliaContext.vp.yMin, juliaContext.vp.yMax, juliaContext.vp.xMin);
    juliaPreviewContext.setColorValues(juliaContext.rgbColor);
    juliaPreviewContext.setExponent(juliaContext.exponent);
    // Need to set center explicitly because of the different canvas sizes and the way the bounds are set
    let xCenterJuliaContext2 = (juliaContext.vp.xMax + juliaContext.vp.xMin) * 0.5;
    let yCenterJuliaContext2 = (juliaContext.vp.yMax + juliaContext.vp.yMin) * 0.5;
    juliaPreviewContext.setCenterTo(xCenterJuliaContext2, yCenterJuliaContext2);
    juliaPreviewContext.updateJuliaCCoords(juliaContext.juliaCCoords.x, juliaContext.juliaCCoords.y);

    juliaPreviewContext.render();
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

export const addResizing = (canvasBorder: HTMLElement, juliaPrevContext: JuliaContext) => {
    let threshold = 10;
    let isDragging = false;
    const draggingDirections = { left: false, right: false, top: false, bottom: false };
    let dragStart = { x: 0, y: 0 };
    let dragStartCanvasPos = { x: 0, y: 0 };
    let dragStartCanvasSize = { width: 0, height: 0 };

    // Set initial values for downloadResolution
    downloadResolution.x = juliaPrevContext.canvas.width;
    downloadResolution.y = juliaPrevContext.canvas.height;

    downloadResXInput.value = downloadResolution.x.toString();
    downloadResYInput.value = downloadResolution.y.toString();

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
                dragStartCanvasPos = juliaPrevContext.vp.screenStart;
                dragStartCanvasSize = { width: juliaPrevContext.canvas.width, height: juliaPrevContext.canvas.height };
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
            juliaPrevContext,
            dragStartCanvasPos.x + xDiffLeft,
            dragStartCanvasPos.x + dragStartCanvasSize.width + xDiffRight,
            dragStartCanvasPos.y + yDiffTop,
            dragStartCanvasPos.y + dragStartCanvasSize.height + yDiffBot
        );
        moveCanvas(juliaPrevContext, canvasBorder);

        let newDisplayValues = { x: 0, y: 0 };
        let currentAspectRatio = juliaPrevContext.canvas.width / juliaPrevContext.canvas.height;

        if (draggingDirections.left || draggingDirections.right)
            // Update display value
            newDisplayValues.x = downloadResolution.y * currentAspectRatio;
        else newDisplayValues.x = downloadResolution.x;
        if (draggingDirections.top || draggingDirections.bottom)
            newDisplayValues.y = downloadResolution.x / currentAspectRatio;
        else newDisplayValues.y = downloadResolution.y;

        downloadResolution.x = Math.max(Math.round(newDisplayValues.x), 1);
        downloadResolution.y = Math.max(Math.round(newDisplayValues.y), 1);

        downloadResXInput.value = downloadResolution.x.toString();
        downloadResYInput.value = downloadResolution.y.toString();

        juliaPrevContext.render();
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

const download = (juliaDrawingContext: JuliaContext, juliaPreviewContext: JuliaContext) => {
    let downloadLink = document.createElement('a');
    downloadLink.setAttribute(
        'download',
        `JuliaSet_${juliaPreviewContext.rgbColor.r}_${juliaPreviewContext.rgbColor.g}_${juliaPreviewContext.rgbColor.b}_${juliaPreviewContext.exponent}_${juliaPreviewContext.escapeRadius}_${juliaPreviewContext.juliaCCoords.x}_${juliaPreviewContext.juliaCCoords.y}.png`
    );

    // Copy the values of the preview juliaContext with the selected resolution
    juliaDrawingContext.setEscapeRadius(juliaPreviewContext.escapeRadius);

    resizeCanvas(juliaDrawingContext, 0, downloadResolution.x, 0, downloadResolution.y);

    juliaDrawingContext.setXYRenderingBounds(
        juliaPreviewContext.vp.yMin,
        juliaPreviewContext.vp.yMax,
        juliaPreviewContext.vp.xMin
    );
    juliaDrawingContext.setColorValues(juliaPreviewContext.rgbColor);
    juliaDrawingContext.setExponent(juliaPreviewContext.exponent);
    // Need to set center explicitly because of the different canvas sizes and the way the bounds are set
    let xCenterJuliaPreviewContext = (juliaPreviewContext.vp.xMax + juliaPreviewContext.vp.xMin) * 0.5;
    let yCenterJuliaPreviewContext = (juliaPreviewContext.vp.yMax + juliaPreviewContext.vp.yMin) * 0.5;
    juliaDrawingContext.setCenterTo(xCenterJuliaPreviewContext, yCenterJuliaPreviewContext);
    juliaDrawingContext.updateJuliaCCoords(juliaPreviewContext.juliaCCoords.x, juliaPreviewContext.juliaCCoords.y);

    console.log(juliaDrawingContext);

    juliaDrawingContext.canvas.toBlob((blob) => {
        let url = URL.createObjectURL(blob);
        downloadLink.setAttribute('href', url);
        downloadLink.click();
    });
};

// Download button
const DownloadCanvasAsImage = (
    juliaContext: JuliaContext,
    juliaDrawingContext: JuliaContext,
    juliaPreviewContext: JuliaContext
) => {
    // This should open a small preview where one can select resolution and crop / zoom
    previewDownloadImage(juliaContext, juliaPreviewContext, 'download-preview-canvas-border');
};

export const addDownloadBtnFunctionality = (juliaDrawingContext: JuliaContext, juliaPreviewContext: JuliaContext) => {
    downloadJuliaBtn.onclick = (evt) => download(juliaDrawingContext, juliaPreviewContext);
};

const downloadJuliaBtn = <HTMLElement>document.getElementById('download-julia-btn');

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
