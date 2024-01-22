import { FractalManager } from '../fractal/FractalManager';
import { JuliaContext } from '../fractal/JuliaContext';
import { httpGetRandomCommunityJulia, httpGetRandomSelectedJulia } from '../utils/http.js';

const randomJuliaBtnOnClick = (
    httpGetRandomJulia: () => Promise<{ data: any; status: number }>,
    fractalManager: FractalManager,
    juliaPreviewContext: JuliaContext,
    juliaDrawingContext: JuliaContext,
    juliaPreviewContainerId: string
) => {
    httpGetRandomJulia()
        .then((resp) => {
            if (resp.status != 200) {
                console.log('Could not load Julia set. Please try again shortly.');
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
        })
        .catch((e) => {
            console.log('Unexpected error occurred.');
        });
};

export const setupRandomCommunityJuliaSetBtn = (
    randomCommunityJuliaBtnId: string,
    juliaCommunityCheckboxId: string,
    fractalManager: FractalManager,
    juliaPreviewContext: JuliaContext,
    juliaDrawingContext: JuliaContext,
    juliaPreviewContainerId: string
) => {
    const randomCommunityJuliaBtn = <HTMLInputElement>document.getElementById(randomCommunityJuliaBtnId);
    var juliaCommunityCheckbox = <HTMLInputElement>document.getElementById(juliaCommunityCheckboxId);
    juliaCommunityCheckbox.checked = true;

    juliaCommunityCheckbox.onclick = (evt) => {
        randomCommunityJuliaBtn.disabled = !juliaCommunityCheckbox.checked;
    };

    // Get random Julia set and render
    randomCommunityJuliaBtn.onclick = () => {
        randomJuliaBtnOnClick(
            httpGetRandomCommunityJulia,
            fractalManager,
            juliaPreviewContext,
            juliaDrawingContext,
            juliaPreviewContainerId
        );
    };
};

export const setupRandomSelectedJuliaSetBtn = (
    randomSelectedJuliaBtnId: string,
    fractalManager: FractalManager,
    juliaPreviewContext: JuliaContext,
    juliaDrawingContext: JuliaContext,
    juliaPreviewContainerId: string
) => {
    const randomSelectedJuliaBtn = <HTMLInputElement>document.getElementById(randomSelectedJuliaBtnId);

    // Get random Julia set and render
    randomSelectedJuliaBtn.onclick = () => {
        randomJuliaBtnOnClick(
            httpGetRandomSelectedJulia,
            fractalManager,
            juliaPreviewContext,
            juliaDrawingContext,
            juliaPreviewContainerId
        );
    };
};
