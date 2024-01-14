import { FractalManager } from './FractalManager.js';
import { JuliaContext } from './JuliaContext.js';
import {
    getColorSettingsAbbreviations,
    denormalizeRGB,
    getColorSettingsFromAbbreviations,
    normalizeRGB,
    RGBToHex,
} from '../utils/utils.js';

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
