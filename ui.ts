import { JuliaContext } from './JuliaContext.js';
import { MandelContext } from './MandelContext.js';

// Closing of preview
const juliaPreviewCloser = <HTMLElement>document.getElementById('close-save-preview');
const juliaPreviewContainer = document.getElementById('download-preview-container');
juliaPreviewCloser.addEventListener('click', (evt) => {
    juliaPreviewContainer.style.display = 'none';
});

const downloadResolution = {
    x: window.screen.width * window.devicePixelRatio,
    y: window.screen.height * window.devicePixelRatio,
};

// Will change the x-value so that the result matches the aspect ratio, will move the window to the center of the screen
const setAspectRatio = (juliaPreviewContext: JuliaContext, aspectRatio: number) => {
    // Try adjusting width and height so that the image stays on screen and has a reasonable size
    let newWidth = Math.round(juliaPreviewContext.canvas.height * aspectRatio);
    let newHeight = Math.round(newWidth / aspectRatio);

    if (100 < newWidth && newWidth <= window.innerWidth - 10) {
        // Resize canvas
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
        // Got some fixing to do
        // Try increasing the width from 300 pixels until it fits
        let newNewWidth = 300;
        let newNewHeight = newNewWidth / aspectRatio;
        while (newNewWidth <= window.innerWidth - 10) {
            if (50 < newNewHeight && newNewHeight <= window.innerHeight - 10) break;
            newNewWidth += 20;
            newNewHeight = newNewWidth / aspectRatio;
        }
        if (50 < newNewHeight && newNewHeight <= window.innerHeight - 10)
            (newWidth = newNewWidth), (newHeight = newNewHeight);

        let xLeft = window.innerWidth / 2 - newWidth / 2;
        let xRight = window.innerWidth / 2 + newWidth / 2;
        let yBot = window.innerHeight / 2 - newHeight / 2;
        let yTop = window.innerHeight / 2 + newHeight / 2;
        resizeCanvas(juliaPreviewContext, xLeft, xRight, yBot, yTop);
    }

    tryResizeCanvasMediumSize(juliaPreviewContext);

    moveCanvas(juliaPreviewContext, <HTMLElement>document.getElementById('download-preview-canvas-border'));
    juliaPreviewContext.render();
};

// Tries to resize the canvas to a a "medium" width and height if both are small
const tryResizeCanvasMediumSize = (juliaPrevContext: JuliaContext) => {
    let canvas = juliaPrevContext.canvas;
    let width = canvas.width;
    let height = canvas.height;
    let ratio = width / height;
    if (width < window.innerWidth * 0.3 && height < window.innerHeight * 0.3) {
        // Increase width
        while (width <= window.innerWidth * 0.55 && height <= window.innerHeight * 0.55) {
            width += 10;
            height = width / ratio;
        }
        width -= 10;
        height = width / ratio;

        resizeCanvas(
            juliaPrevContext,
            window.innerWidth * 0.5 - width * 0.5,
            window.innerWidth * 0.5 + width * 0.5,
            window.innerHeight * 0.5 - height * 0.5,
            window.innerHeight * 0.5 + height * 0.5
        );
    }
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
    juliaPreviewContext.setNrIterations(juliaContext.nrIterations);
    // Need to set center explicitly because of the different canvas sizes and the way the bounds are set
    let xCenterJuliaContext2 = (juliaContext.vp.xMax + juliaContext.vp.xMin) * 0.5;
    let yCenterJuliaContext2 = (juliaContext.vp.yMax + juliaContext.vp.yMin) * 0.5;
    juliaPreviewContext.setCenterTo(xCenterJuliaContext2, yCenterJuliaContext2);
    juliaPreviewContext.setColorSettings(juliaContext.colorSettings);
    juliaPreviewContext.setJuliaCCoords(juliaContext.juliaCCoords.x, juliaContext.juliaCCoords.y);

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

    // Update webgl canvas
    let canvas = <HTMLCanvasElement>juliaContext.canvas;
    canvas.width = newWidth;
    canvas.height = newHeight;

    // Update 2d canvas
    let canvas2d = <HTMLCanvasElement>juliaContext.canvas2d;
    canvas2d.width = newWidth;
    canvas2d.height = newHeight;

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

// Downloads the Julia Image as per the current settings and the center / zoom of the preview image
const downloadJuliaPNG = (
    juliaDrawingContext: JuliaContext,
    juliaPreviewContext: JuliaContext,
    disableDownloadBtn: () => void,
    enableDownloadBtn: () => void
) => {
    disableDownloadBtn();

    let downloadLink = document.createElement('a');
    downloadLink.setAttribute(
        'download',
        `JuliaSet_${juliaPreviewContext.rgbColor.r}_${juliaPreviewContext.rgbColor.g}_${juliaPreviewContext.rgbColor.b}_${juliaPreviewContext.nrIterations}_${juliaPreviewContext.exponent}_${juliaPreviewContext.escapeRadius}_${juliaPreviewContext.juliaCCoords.x}_${juliaPreviewContext.juliaCCoords.y}.png`
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
    juliaDrawingContext.setNrIterations(juliaPreviewContext.nrIterations);
    // Need to set center explicitly because of the different canvas sizes and the way the bounds are set
    let xCenterJuliaPreviewContext = (juliaPreviewContext.vp.xMax + juliaPreviewContext.vp.xMin) * 0.5;
    let yCenterJuliaPreviewContext = (juliaPreviewContext.vp.yMax + juliaPreviewContext.vp.yMin) * 0.5;
    juliaDrawingContext.setCenterTo(xCenterJuliaPreviewContext, yCenterJuliaPreviewContext);
    juliaDrawingContext.setColorSettings(juliaPreviewContext.colorSettings);
    juliaDrawingContext.setJuliaCCoords(juliaPreviewContext.juliaCCoords.x, juliaPreviewContext.juliaCCoords.y);

    const cpuRendering = juliaPreviewContext.cpuRendering; // Save the current state so changes (i.e. cpu rendering gets
    // deactivated) during the render won't affect download

    juliaDrawingContext.render(cpuRendering).then(() => {
        // Wait for render to finish, then download
        if (cpuRendering) {
            juliaDrawingContext.canvas2d.toBlob((blob) => {
                let url = URL.createObjectURL(blob);
                downloadLink.setAttribute('href', url);
                downloadLink.click();
            });
        } else {
            juliaDrawingContext.canvas.toBlob((blob) => {
                let url = URL.createObjectURL(blob);
                downloadLink.setAttribute('href', url);
                downloadLink.click();
            });
        }

        enableDownloadBtn();
    });
};

// Open preview / editor for download of Julia-Image
const openSaveJuliaModal = (
    juliaContext: JuliaContext,
    juliaDrawingContext: JuliaContext,
    juliaPreviewContext: JuliaContext
) => {
    // This opens a small preview where one can select resolution and crop / zoom
    previewDownloadImage(juliaContext, juliaPreviewContext, 'download-preview-canvas-border');
};

export const setupDownloadPreview = (
    juliaPrevContext: JuliaContext,
    downloadResXInput: HTMLInputElement,
    downloadResYInput: HTMLInputElement
) => {
    downloadResXInput.value = downloadResolution.x.toString();
    downloadResYInput.value = downloadResolution.y.toString();
    setAspectRatio(juliaPrevContext, downloadResolution.x / downloadResolution.y);
};

export const addDownloadBtnFunctionality = (
    juliaDrawingContext: JuliaContext,
    juliaPreviewContext: JuliaContext,
    downloadJuliaBtn: HTMLInputElement
) => {
    downloadJuliaBtn.onclick = (evt) =>
        downloadJuliaPNG(
            juliaDrawingContext,
            juliaPreviewContext,
            () => ((downloadJuliaBtn.disabled = true), console.log('disabled')),
            () => (downloadJuliaBtn.disabled = false)
        );
};

const addDownloadResXInputListener = (juliaPreviewContext: JuliaContext, downloadResXInput: HTMLInputElement) => {
    downloadResXInput.addEventListener('input', (evt) => {
        let xVal = parseInt((<HTMLInputElement>evt.currentTarget).value);
        if (Number.isNaN(xVal) || xVal < 9) {
            // Too small
            return;
        } // Change ratio accordingly
        let ratio = xVal / downloadResolution.y;
        setAspectRatio(juliaPreviewContext, ratio);
        downloadResolution.x = xVal;
    });
};

const addDownloadResYInputListener = (juliaPreviewContext: JuliaContext, downloadResYInput: HTMLInputElement) => {
    downloadResYInput.addEventListener('input', (evt) => {
        let yVal = parseInt((<HTMLInputElement>evt.currentTarget).value);
        if (Number.isNaN(yVal) || yVal < 9) {
            // Too small
            return;
        }
        // Change ratio accordingly
        let ratio = downloadResolution.x / yVal;
        setAspectRatio(juliaPreviewContext, ratio);
        downloadResolution.y = yVal;
    });
};

export const setupPreviewDownload = (
    juliaDrawingContext: JuliaContext,
    juliaPreviewContext: JuliaContext,
    downloadJuliaBtnId: string,
    downloadResXInputId: string,
    downloadResYInputId: string
) => {
    const downloadJuliaBtn = <HTMLInputElement>document.getElementById(downloadJuliaBtnId);

    const downloadResXInput = <HTMLInputElement>document.getElementById(downloadResXInputId);
    const downloadResYInput = <HTMLInputElement>document.getElementById(downloadResYInputId);

    addDownloadResXInputListener(juliaPreviewContext, downloadResXInput);
    addDownloadResYInputListener(juliaPreviewContext, downloadResYInput);

    addDownloadBtnFunctionality(juliaDrawingContext, juliaPreviewContext, downloadJuliaBtn);

    setupDownloadPreview(juliaPreviewContext, downloadResXInput, downloadResYInput);
};

export const addSaveJuliaPNGBtnListeners = (
    juliaContext: JuliaContext,
    juliaDrawingContext: JuliaContext,
    btnId: string,
    juliaPreviewContext: JuliaContext
) => {
    const saveJuliaPNGBtn = document.getElementById(btnId);
    saveJuliaPNGBtn.onclick = (evt) => {
        openSaveJuliaModal(juliaContext, juliaDrawingContext, juliaPreviewContext);
    };
};

export const setupColorSettingsInputs = (
    juliaContext: JuliaContext,
    mandelContext: MandelContext,
    colorDropdownId: string
) => {
    const getColorSettings = () => {
        return colorSettingsInputs.map((input) => ((<HTMLInputElement>input).checked ? 1.0 : 0.0));
    };

    const colorDropdown = document.getElementById(colorDropdownId);
    const colorSettingsInputs: HTMLInputElement[] = Array.from(colorDropdown.getElementsByTagName('input'));
    colorSettingsInputs.forEach((input) =>
        input.addEventListener('input', (evt) => {
            const colorSettings = getColorSettings();
            juliaContext.setColorSettings(colorSettings);
            juliaContext.render();
            mandelContext.setColorSettings(colorSettings);
            mandelContext.render();
        })
    );

    // Initial color settings
    colorSettingsInputs[0].checked = true;
    colorSettingsInputs[2].checked = true;
    const colorSettings = getColorSettings();
    juliaContext.setColorSettings(colorSettings);
    mandelContext.setColorSettings(colorSettings);
};

export const setupHideUIButton = (hideUIBtnId: string) => {
    const hideUIButton = <HTMLInputElement>document.getElementById(hideUIBtnId);
    const uiControlDiv = document.getElementById('controls');
    const uiControlInputs = Array.from(uiControlDiv.getElementsByTagName('input'));
    const uiControlButtons = Array.from(uiControlDiv.getElementsByTagName('button'));

    var uiShown = true;

    hideUIButton.onclick = () => {
        if (uiShown) {
            uiControlInputs.forEach((el) => (el.tabIndex = -1));
            uiControlButtons.forEach((el) => (el.tabIndex = -1));
            hideUIButton.innerText = 'Show UI';
            uiControlDiv.classList.add('invisible');
        } else {
            uiControlInputs.forEach((el) => (el.tabIndex = 1));
            uiControlButtons.forEach((el) => (el.tabIndex = 1));
            hideUIButton.innerText = 'Hide UI';
            uiControlDiv.classList.remove('invisible');
        }
        uiShown = !uiShown;
    };
};

export const setupPreviewCenterOriginBtn = (juliaPreviewContext: JuliaContext, centerOriginBtnId: string) => {
    const previewCenterOriginBtn = <HTMLInputElement>document.getElementById(centerOriginBtnId);
    previewCenterOriginBtn.onclick = (evt) => {
        juliaPreviewContext.setCenterTo(0, 0);
        juliaPreviewContext.render();
    };
};

export const setupPreviewCPURenderBtn = (juliaPreviewContext: JuliaContext, previewCPURenderBtnId: string) => {
    const previewCPURenderButton = document.getElementById(previewCPURenderBtnId);
    previewCPURenderButton.onclick = () => {
        juliaPreviewContext.setCPURendering(!juliaPreviewContext.cpuRendering);
        previewCPURenderButton.innerText = 'Turn CPU Rendering ' + (juliaPreviewContext.cpuRendering ? 'OFF' : 'ON');
    };
};
