import { JuliaContext } from '../fractal/JuliaContext.js';
import { denormalizeRGB, getColorSettingsAbbreviations } from '../utils/colorUtils.js';
import { httpPostNewCommunityJulia } from '../utils/http.js';

// Closing of preview
const juliaPreviewCloser = document.getElementById('close-save-preview');
const juliaPreviewContainer = document.getElementById('download-preview-container');
juliaPreviewCloser.addEventListener('click', (evt) => {
    juliaPreviewContainer.style.opacity = '0';
    juliaPreviewContainer.style.visibility = 'hidden';
});

const downloadResolution = {
    x: window.screen.width * window.devicePixelRatio,
    y: window.screen.height * window.devicePixelRatio,
};

const previewDownloadImage = (
    juliaContext: JuliaContext,
    juliaPreviewContext: JuliaContext,
    juliaPreviewContainerId: string,
    borderId?: string
) => {
    const juliaPreviewContainer = document.getElementById(juliaPreviewContainerId);
    juliaPreviewContainer.style.opacity = '1';
    juliaPreviewContainer.style.visibility = 'visible';

    const borderElement = document.getElementById(borderId);

    if (borderId) juliaPreviewContext.moveCanvas(borderElement);

    updateJuliaPreviewContext(juliaPreviewContext, juliaContext);
};

// Update the values of the preview context with the values of the (main) julia context
export const updateJuliaPreviewContext = (juliaPreviewContext: JuliaContext, juliaContext: JuliaContext) => {
    juliaPreviewContext.setEscapeRadius(juliaContext.escapeRadius);
    juliaPreviewContext.setColorValues(juliaContext.rgbColor);
    juliaPreviewContext.setExponent(juliaContext.exponent);
    juliaPreviewContext.setNrIterations(juliaContext.nrIterations);
    // Need to set center explicitly because of the different canvas sizes and the way the bounds are set
    let center = juliaContext.getCurrentCenter();
    juliaPreviewContext.setZoom(center.cX, center.cY, juliaContext.zoomLevel);
    juliaPreviewContext.setCenterTo(center.cX, center.cY);
    juliaPreviewContext.setColorSettings(juliaContext.colorSettings);
    juliaPreviewContext.setJuliaCCoords(juliaContext.juliaCCoords.x, juliaContext.juliaCCoords.y);
};

// Downloads the Julia Image as per the current settings and the center / zoom of the preview image
const downloadJuliaPNG = (
    juliaDrawingContext: JuliaContext,
    juliaPreviewContext: JuliaContext,
    disableDownloadBtn: () => void,
    enableDownloadBtn: () => void,
    juliaCommunityCheckbox: HTMLInputElement
) => {
    disableDownloadBtn();

    let downloadLink = document.createElement('a');
    let color = denormalizeRGB(juliaPreviewContext.rgbColor);
    let center = juliaPreviewContext.getCurrentCenter();
    let colorSettingsAbbreviations = getColorSettingsAbbreviations(juliaPreviewContext.colorSettings);
    let filename = `JuliaSet_${color.r}_${color.g}_${color.b}_${juliaPreviewContext.nrIterations}_${
        juliaPreviewContext.exponent
    }_${juliaPreviewContext.escapeRadius}_${juliaPreviewContext.juliaCCoords.x}_${juliaPreviewContext.juliaCCoords.y}_${
        center.cX
    }_${center.cY}_${juliaPreviewContext.zoomLevel}${
        (getColorSettingsAbbreviations.length == 0 ? '' : '_') + colorSettingsAbbreviations.join('_')
    }_${juliaPreviewContext.cpuRendering ? 1 : 0}.png`;

    downloadLink.setAttribute('download', filename);

    if (juliaCommunityCheckbox.checked) httpPostNewCommunityJulia(filename.slice(0, filename.length - 4));

    // Update drawing context with values of preview context
    updateJuliaDrawingContext(juliaDrawingContext, juliaPreviewContext);

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

// Update the values of the drawing context with the values of the preview context
export const updateJuliaDrawingContext = (juliaDrawingContext: JuliaContext, juliaPreviewContext: JuliaContext) => {
    // Copy the values of the preview juliaContext with the selected resolution
    juliaDrawingContext.setEscapeRadius(juliaPreviewContext.escapeRadius);

    juliaDrawingContext.resizeCanvas(0, downloadResolution.x, 0, downloadResolution.y);

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
};

// Open preview / editor for download of Julia-Image
const openSaveJuliaModal = (
    juliaContext: JuliaContext,
    juliaDrawingContext: JuliaContext,
    juliaPreviewContext: JuliaContext,
    juliaPreviewContainerId: string
) => {
    // This opens a small preview where one can select resolution and crop / zoom
    previewDownloadImage(juliaContext, juliaPreviewContext, juliaPreviewContainerId, 'download-preview-canvas-border');
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
    downloadJuliaBtn: HTMLInputElement,
    juliaCommunityCheckbox: HTMLInputElement
) => {
    downloadJuliaBtn.onclick = (evt) =>
        downloadJuliaPNG(
            juliaDrawingContext,
            juliaPreviewContext,
            () => (downloadJuliaBtn.disabled = true),
            () => (downloadJuliaBtn.disabled = false),
            juliaCommunityCheckbox
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
    downloadResYInputId: string,
    juliaCommunityCheckboxId: string
) => {
    const downloadJuliaBtn = <HTMLInputElement>document.getElementById(downloadJuliaBtnId);

    const downloadResXInput = <HTMLInputElement>document.getElementById(downloadResXInputId);
    const downloadResYInput = <HTMLInputElement>document.getElementById(downloadResYInputId);

    const juliaCommunityCheckbox = <HTMLInputElement>document.getElementById(juliaCommunityCheckboxId);

    addDownloadResXInputListener(juliaPreviewContext, downloadResXInput);
    addDownloadResYInputListener(juliaPreviewContext, downloadResYInput);

    addDownloadBtnFunctionality(juliaDrawingContext, juliaPreviewContext, downloadJuliaBtn, juliaCommunityCheckbox);

    setupDownloadPreview(juliaPreviewContext, downloadResXInput, downloadResYInput);
};

export const addSaveJuliaPNGBtnListeners = (
    juliaContext: JuliaContext,
    juliaDrawingContext: JuliaContext,
    btnId: string,
    juliaPreviewContext: JuliaContext,
    juliaPreviewContainerId: string,
    saveShortcutCheckboxId: string
) => {
    const openJuliaSavePreviewBtn = document.getElementById(btnId);
    const saveShortcutCheckbox = <HTMLInputElement>document.getElementById(saveShortcutCheckboxId);

    openJuliaSavePreviewBtn.onclick = (evt) => {
        openSaveJuliaModal(juliaContext, juliaDrawingContext, juliaPreviewContext, juliaPreviewContainerId);
    };

    window.addEventListener('keydown', (evt) => {
        // Pressing "s" will open the save preview
        if (evt.code == 'KeyS' && saveShortcutCheckbox.checked) {
            if (juliaPreviewContainer.style.visibility == 'visible') {
                // Close preview
                juliaPreviewCloser.click();
            } else {
                // Open preview
                openJuliaSavePreviewBtn.click();
            }
        }
    });
};

export const setupPreviewCenterOriginBtn = (juliaPreviewContext: JuliaContext, centerOriginBtnId: string) => {
    const previewCenterOriginBtn = <HTMLInputElement>document.getElementById(centerOriginBtnId);
    previewCenterOriginBtn.onclick = (evt) => {
        juliaPreviewContext.setCenterTo(0, 0);
    };
};

export const setupPreviewCPURenderBtn = (juliaPreviewContext: JuliaContext, previewCPURenderBtnId: string) => {
    const previewCPURenderButton = document.getElementById(previewCPURenderBtnId);
    previewCPURenderButton.onclick = () => {
        juliaPreviewContext.setCPURendering(!juliaPreviewContext.cpuRendering);
        previewCPURenderButton.innerText = 'Turn CPU Rendering ' + (juliaPreviewContext.cpuRendering ? 'OFF' : 'ON');
    };
};
