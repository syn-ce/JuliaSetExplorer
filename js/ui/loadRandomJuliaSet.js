import { httpGetRandomCommunityJulia, httpGetRandomSelectedJulia } from '../utils/http.js';
const randomJuliaBtnOnClick = (httpGetRandomJulia, fractalManager, juliaPreviewContext, juliaDrawingContext, juliaPreviewContainerId) => {
    httpGetRandomJulia()
        .then((resp) => {
        if (resp.status != 200) {
            console.log('Could not load Julia set. Please try again shortly.');
            return;
        }
        let filename = resp.data.filename;
        if (!fractalManager.tryUpdateRenderFractalsFromString(filename, juliaPreviewContext, juliaDrawingContext, juliaPreviewContainerId)) {
            return;
        }
    })
        .catch((e) => {
        console.log('Unexpected error occurred.');
    });
};
export const setupRandomCommunityJuliaSetBtn = (randomCommunityJuliaBtnId, juliaCommunityCheckboxId, fractalManager, juliaPreviewContext, juliaDrawingContext, juliaPreviewContainerId) => {
    const randomCommunityJuliaBtn = document.getElementById(randomCommunityJuliaBtnId);
    var juliaCommunityCheckbox = document.getElementById(juliaCommunityCheckboxId);
    juliaCommunityCheckbox.checked = true;
    juliaCommunityCheckbox.onclick = (evt) => {
        randomCommunityJuliaBtn.disabled = !juliaCommunityCheckbox.checked;
    };
    // Get random Julia set and render
    randomCommunityJuliaBtn.onclick = () => {
        randomJuliaBtnOnClick(httpGetRandomCommunityJulia, fractalManager, juliaPreviewContext, juliaDrawingContext, juliaPreviewContainerId);
    };
};
export const setupRandomSelectedJuliaSetBtn = (randomSelectedJuliaBtnId, fractalManager, juliaPreviewContext, juliaDrawingContext, juliaPreviewContainerId) => {
    const randomSelectedJuliaBtn = document.getElementById(randomSelectedJuliaBtnId);
    // Get random Julia set and render
    randomSelectedJuliaBtn.onclick = () => {
        randomJuliaBtnOnClick(httpGetRandomSelectedJulia, fractalManager, juliaPreviewContext, juliaDrawingContext, juliaPreviewContainerId);
    };
};
