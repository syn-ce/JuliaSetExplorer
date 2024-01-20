import { FractalManager } from '../fractal/FractalManager';
import { JuliaContext } from '../fractal/JuliaContext';
import { httpGetRandomJulia } from '../utils/http.js';

export const setupRandomJuliaSetBtn = (
    randomJuliaBtnId: string,
    fractalManager: FractalManager,
    juliaPreviewContext: JuliaContext,
    juliaDrawingContext: JuliaContext,
    juliaPreviewContainerId: string
) => {
    const randomJuliaBtn = <HTMLInputElement>document.getElementById(randomJuliaBtnId);

    // Get random Julia set and render
    randomJuliaBtn.onclick = () => {
        httpGetRandomJulia().then((resp) => {
            if (resp.status != 200) {
                console.log('Could not load random Julia set. Please try again shortly.');
                return;
            }

            let filename = resp.data.filename;

            if (
                !fractalManager.tryUpdateRenderFractalsFromString(
                    filename,
                    juliaPreviewContext,
                    juliaDrawingContext,
                    juliaPreviewContainerId
                )
            ) {
                return;
            }
        });
    };
};
