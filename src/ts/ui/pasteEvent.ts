import { FractalManager } from '../fractal/FractalManager';

export const addPasteEventListeners = (fractalManager: FractalManager) => {
    document.body.addEventListener('paste', (evt) => {
        let potFilename = evt.clipboardData.getData('text');

        fractalManager.tryUpdateRenderFractalsFromString(potFilename);
    });
};
