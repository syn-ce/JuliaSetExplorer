import { FractalManager } from './FractalManager.js';
import { JuliaContext } from './JuliaContext.js';
import {
    getColorSettingsAbbreviations,
    denormalizeRGB,
    getColorSettingsFromAbbreviations,
    normalizeRGB,
    RGBToHex,
} from '../utils/utils.js';

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

const previewDownloadImage = (juliaContext: JuliaContext, juliaPreviewContext: JuliaContext, borderId?: string) => {
    const juliaPreviewContainer = document.getElementById('download-preview-container');
    juliaPreviewContainer.style.display = 'block';

    const borderElement = document.getElementById(borderId);

    if (borderId) juliaPreviewContext.moveCanvas(borderElement);

    juliaPreviewContext.setEscapeRadius(juliaContext.escapeRadius);
    juliaPreviewContext.setColorValues(juliaContext.rgbColor);
    juliaPreviewContext.setExponent(juliaContext.exponent);
    juliaPreviewContext.setNrIterations(juliaContext.nrIterations);
    // Need to set center explicitly because of the different canvas sizes and the way the bounds are set
    let center = juliaContext.getCurrentCenter();
    juliaPreviewContext.zoom(center.cX, center.cY, juliaContext.zoomLevel);
    juliaPreviewContext.setCenterTo(center.cX, center.cY);
    juliaPreviewContext.setColorSettings(juliaContext.colorSettings);
    juliaPreviewContext.setJuliaCCoords(juliaContext.juliaCCoords.x, juliaContext.juliaCCoords.y);

    juliaPreviewContext.render();
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
    let color = denormalizeRGB(juliaPreviewContext.rgbColor);
    let center = juliaPreviewContext.getCurrentCenter();
    let colorSettingsAbbreviations = getColorSettingsAbbreviations(juliaPreviewContext.colorSettings);
    downloadLink.setAttribute(
        'download',
        `JuliaSet_${color.r}_${color.g}_${color.b}_${juliaPreviewContext.nrIterations}_${
            juliaPreviewContext.exponent
        }_${juliaPreviewContext.escapeRadius}_${juliaPreviewContext.juliaCCoords.x}_${
            juliaPreviewContext.juliaCCoords.y
        }_${center.cX}_${center.cY}_${juliaPreviewContext.zoomLevel}${
            (getColorSettingsAbbreviations.length == 0 ? '' : '_') + colorSettingsAbbreviations.join('_')
        }_${juliaPreviewContext.cpuRendering ? 1 : 0}.png`
    );

    // Copy the values of the preview juliaContext with the selected resolution
    juliaDrawingContext.setEscapeRadius(juliaPreviewContext.escapeRadius);

    juliaPreviewContext.resizeCanvas(0, downloadResolution.x, 0, downloadResolution.y);

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
    juliaPrevContext.setAspectRatio(downloadResolution.x / downloadResolution.y);
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
        juliaPreviewContext.setAspectRatio(ratio);
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
        juliaPreviewContext.setAspectRatio(ratio);
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
    const openJuliaSavePreviewBtn = document.getElementById(btnId);

    openJuliaSavePreviewBtn.onclick = (evt) => {
        openSaveJuliaModal(juliaContext, juliaDrawingContext, juliaPreviewContext);
    };

    window.addEventListener('keydown', (evt) => {
        // Pressing "s" will open the save preview
        if (evt.code == 'KeyS') {
            if (juliaPreviewContainer.style.display == 'block') {
                // Close preview
                juliaPreviewCloser.click();
            } else {
                // Open preview
                openJuliaSavePreviewBtn.click();
            }
        }
    });
};

export const setupHideUIButton = (hideUIBtnId: string) => {
    const hideUIButton = <HTMLInputElement>document.getElementById(hideUIBtnId);

    const uiControlDiv = document.getElementById('controls');
    const uiControlInputs = Array.from(uiControlDiv.getElementsByTagName('input'));
    const uiControlButtons = Array.from(uiControlDiv.getElementsByTagName('button'));

    const metaControlDiv = document.getElementById('meta-controls');
    const metaControlButtons = Array.from(metaControlDiv.getElementsByTagName('button'));

    var uiShown = true;

    // Pressing "h" will hide / show the ui
    document.addEventListener('keydown', (evt) => {
        if (evt.key == 'h') hideUIButton.click();
    });

    hideUIButton.onclick = () => {
        if (uiShown) {
            uiControlInputs.forEach((el) => (el.tabIndex = -1));
            uiControlButtons.forEach((el) => (el.tabIndex = -1));
            metaControlButtons.forEach((el) => {
                el.tabIndex = -1;
                el.classList.add('invisible');
            });
            hideUIButton.classList.remove('invisible');
            hideUIButton.style.opacity = '0.2';
            hideUIButton.innerText = 'Show UI';
            uiControlDiv.classList.add('invisible');
        } else {
            uiControlInputs.forEach((el) => (el.tabIndex = 1));
            uiControlButtons.forEach((el) => (el.tabIndex = 1));
            metaControlButtons.forEach((el) => {
                el.tabIndex = 1;
                el.classList.remove('invisible');
            });
            hideUIButton.style.opacity = '1.0';
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
        juliaPreviewContext.render();
        previewCPURenderButton.innerText = 'Turn CPU Rendering ' + (juliaPreviewContext.cpuRendering ? 'OFF' : 'ON');
    };
};

export const addDragEventListeners = (fractalManager: FractalManager, juliaPreviewContext: JuliaContext) => {
    var dropzone = document.getElementById('dropzone');

    document.body.ondragenter = (evt) => {
        fractalManager.mandelContext.indicatorFollowsMouse = false;
        //dropzone.style.visibility = 'visible';
        //dropzone.style.opacity = '1';
        console.log('fired');
    };

    document.body.ondragover = (evt) => {
        evt.preventDefault();
    };

    document.body.ondrop = (evt) => {
        dropzone.style.visibility = 'hidden';
        dropzone.style.opacity = '0';
        evt.stopPropagation();
        evt.preventDefault();

        let file = evt.dataTransfer.files[0];
        if (!file) return;

        fractalManager.mandelContext.indicatorFollowsMouse = false;

        let name = file.name;

        // Extract parameters
        let params = name.split('_').slice(1); // Split into attributes, remove "JuliaSet"-prefix
        if (params.length < 12) return; // Not enough params

        let color = { r: parseFloat(params[0]), g: parseFloat(params[1]), b: parseFloat(params[2]) };
        let nrIterations = parseFloat(params[3]);
        let exponent = parseFloat(params[4]);
        let escapeRadius = parseFloat(params[5]);

        let juliaCoords = { x: parseFloat(params[6]), y: parseFloat(params[7]) };
        let juliaPreviewCenter = { x: parseFloat(params[8]), y: parseFloat(params[9]) };

        let zoomLevel = parseFloat(params[10]);

        let cpuRendering = params[params.length - 1] == '1' ? true : false;

        let colorSettings = getColorSettingsFromAbbreviations(params.slice(11, params.length - 1));

        // Set the values
        fractalManager.setCurrentJuliaCenter(juliaCoords.x, juliaCoords.y);
        //juliaPreviewContext.zoom(juliaPreviewCenter.x, juliaPreviewCenter.y, zoomLevel);
        //juliaPreviewContext.setCenterTo(juliaPreviewCenter.x, juliaPreviewCenter.y);
        fractalManager.juliaContext.setColorValues(normalizeRGB(color));
        fractalManager.juliaContext.colorInput.value = RGBToHex(color);
        fractalManager.juliaContext.setExponent(exponent);
        fractalManager.juliaContext.exponentInput.value = exponent.toString();
        fractalManager.juliaContext.setNrIterations(nrIterations);
        fractalManager.juliaContext.nrIterationsInput.value = nrIterations.toString();
        fractalManager.juliaContext.setEscapeRadius(escapeRadius);
        fractalManager.juliaContext.escapeRadiusInput.value = escapeRadius.toString();
        fractalManager.juliaContext.setColorSettings(colorSettings);
        fractalManager.juliaContext.colorSettingsInputs.forEach(
            (colorSettingInput, index) => (colorSettingInput.checked = colorSettings[index] != 0)
        );
        fractalManager.juliaContext.setCenterTo(juliaPreviewCenter.x, juliaPreviewCenter.y); // Set center and zoom as specified in filename
        fractalManager.juliaContext.zoom(juliaPreviewCenter.x, juliaPreviewCenter.y, zoomLevel);

        fractalManager.mandelContext.setColorValues(normalizeRGB(color));
        fractalManager.mandelContext.colorInput.value = RGBToHex(color);
        fractalManager.mandelContext.setExponent(exponent);
        fractalManager.mandelContext.exponentInput.value = exponent.toString();
        fractalManager.mandelContext.setNrIterations(nrIterations);
        fractalManager.mandelContext.nrIterationsInput.value = nrIterations.toString();
        fractalManager.mandelContext.setEscapeRadius(escapeRadius);
        fractalManager.mandelContext.escapeRadiusInput.value = escapeRadius.toString();
        fractalManager.mandelContext.setColorSettings(colorSettings);
        fractalManager.mandelContext.colorSettingsInputs.forEach(
            (colorSettingInput, index) => (colorSettingInput.checked = colorSettings[index] != 0)
        );

        fractalManager.juliaContext.render();
        fractalManager.mandelContext.render();
    };

    document.body.ondragleave = (evt) => {
        console.log('left');
        dropzone.style.visibility = 'hidden';
        dropzone.style.opacity = '0';
    };
};
