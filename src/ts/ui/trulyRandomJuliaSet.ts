import { FractalManager } from '../fractal/FractalManager';
import { JuliaContext } from '../fractal/JuliaContext';
import { RGBColor, randomRGB } from '../utils/colorUtils.js';
import { randInRange } from '../utils/utils.js';

// Adds functionality to the button and a keydown-listener for the key 't'
export const setupTrulyRandomJuliaBtn = (
    juliaBtnId: string,
    fractalManager: FractalManager,
    juliaPreviewContext: JuliaContext,
    juliaPreviewContainerId: string,
    randjuliaShortcutCheckboxId: string
) => {
    const trulyRandomJuliaBtn = <HTMLInputElement>document.getElementById(juliaBtnId);
    const randjuliaShortcutCheckbox = <HTMLInputElement>document.getElementById(randjuliaShortcutCheckboxId);

    window.addEventListener('keydown', (evt) => {
        if (evt.code == 'KeyT' && randjuliaShortcutCheckbox.checked) {
            trulyRandomJuliaBtn.click();
        }
    });

    trulyRandomJuliaBtn.onclick = () => {
        const color: RGBColor = randomRGB();
        const nrIterations = randInRange(1, 2000);
        const exponent = Math.random() * 4 + 1;
        const escapeRadius = randInRange(0, 9999);
        const juliaCoords = { x: Math.random() * 3 - 2, y: Math.random() * 2.6 - 1.3 };
        const juliaPreviewCenter = { x: 0, y: 0 }; // { x: Math.random() * 3 - 1.5, y: 2.4 - 1.2 };
        const zoomLevel = 1; //Math.random() * 99.5 + 0.5; // 0.5 to 10000
        const cpuRendering = Math.random() < 0.5;
        const colorSettings = Array(5).fill(0);

        for (let i = 0; i < 5; i++) colorSettings[i] = Math.random() < 0.3 ? 1 : 0;

        if (colorSettings.slice(1).filter((val) => val == 0).length == 4) colorSettings[randInRange(1, 4)] = 1; // Set at least one color-option (excluding SC)

        const params = {
            color,
            nrIterations,
            exponent,
            escapeRadius,
            juliaCoords,
            juliaPreviewCenter,
            zoomLevel,
            cpuRendering,
            colorSettings,
        };

        fractalManager.updateRenderFractals(params, juliaPreviewContext, juliaPreviewContainerId);
    };
};
