import { FractalParams } from '../fractal/FractalParams.js';
import { JuliaContext } from '../fractal/JuliaContext.js';
import { updateJuliaDrawingContext } from './juliaDownload.js';
import { FractalManager } from '../fractal/FractalManager';
import { interpolateFractalParams, setJuliaState } from '../utils/fractalUtils.js';

function createFileFormCurrentRecordedData(recordedData: Blob[]) {
    let recordedBlob = new Blob(recordedData, { type: 'video/webm' });
    let url = URL.createObjectURL(recordedBlob);

    let downloadLink = document.createElement('a');
    const filename = 'testfilename.webm';
    downloadLink.setAttribute('download', filename);
    downloadLink.setAttribute('href', url);
    downloadLink.click();
}

export const capturePreviewCanvasVideo = (
    juliaDrawingContext: JuliaContext,
    juliaPreviewContext: JuliaContext,
    canvas: HTMLCanvasElement,
    startState: FractalParams,
    goalState: FractalParams
) => {
    // Initially setup juliaDrawingContext (mainly for adjusting size, the rest is probably not needed; TODO: refactor / have a look at this again)
    updateJuliaDrawingContext(juliaDrawingContext, juliaPreviewContext);
    setJuliaState(juliaDrawingContext, startState);

    const duration = 2000;
    const frameInterval = 1000 / 60;
    const nrFrames = 120;

    const interpolatedFractalParamsList = interpolateFractalParams(nrFrames, startState, goalState);

    const data: Blob[] = [];
    const mediaStream = canvas.captureStream(60);
    mediaStream.getTracks().forEach((element) => {
        console.log(element);
    });
    const mediaRecorder = new MediaRecorder(mediaStream);
    mediaRecorder.ondataavailable = (evt) => {
        data.push(evt.data);
        console.log('Data available:', evt.data.size);
    };
    mediaRecorder.onstop = () => {
        mediaStream.getTracks().forEach((track) => track.stop());
        console.log('Recording stopped. Data length:', data.length);
        createFileFormCurrentRecordedData(data);
    };
    juliaDrawingContext.startMainRenderLoop();
    mediaRecorder.start();

    // Loop
    let i = 0;
    const loop = () => {
        setJuliaState(juliaDrawingContext, interpolatedFractalParamsList[i]);
        i++;
        if (i < nrFrames) {
            setTimeout(loop, frameInterval);
        } else {
            // Stop after all frames have been rendered; TODO: check whether 100ms "buffer" is necessary
            setTimeout(() => {
                mediaRecorder.stop();
                console.log('Recording stopped by timeout.');
                juliaDrawingContext.stopRenderLoop();
                console.log('Stopped renderLoop for juliaDrawingContext');
            }, 100);
        }
    };

    loop();
};

const changeVideoStateCaptureModalVisib = (modalElement: HTMLElement) => {
    const currVisib = modalElement.style.visibility;
    if (currVisib != 'visible') {
        modalElement.style.visibility = 'visible';
        modalElement.style.opacity = '1';
    } else {
        modalElement.style.opacity = '0';
        modalElement.style.visibility = 'hidden';
    }
};

const setupVideoStateCaptureModal = (
    fractalManager: FractalManager,
    juliaDrawingContext: JuliaContext,
    juliaPreviewContext: JuliaContext
) => {
    const modalElement = document.getElementById('video-state-capture-modal');

    modalElement.style.opacity = '0';
    modalElement.style.visibility = 'hidden';

    let startState: FractalParams;
    let goalState: FractalParams;

    const startStateDropzone = document.getElementById('video-start-state-dropzone');
    const goalStateDropzone = document.getElementById('video-goal-state-dropzone');

    const renderBtn = document.getElementById('video-state-capture-render-btn');

    startStateDropzone.ondrop = (evt) => {
        evt.preventDefault();
        let file = evt.dataTransfer.files[0];
        let params = fractalManager.tryParseParamsFromFilename(file.name);
        if (!params.parsedSuccessfully) {
            console.error('Could not parse filename');
            return;
        }
        startState = params;
        startStateDropzone.innerText = JSON.stringify(startState);
    };

    goalStateDropzone.ondrop = (evt) => {
        evt.preventDefault();
        let file = evt.dataTransfer.files[0];
        let params = fractalManager.tryParseParamsFromFilename(file.name);
        if (!params.parsedSuccessfully) {
            console.error('Could not parse filename');
            return;
        }
        goalState = params;
        goalStateDropzone.innerText = JSON.stringify(goalState);
    };

    renderBtn.onclick = (evt) =>
        capturePreviewCanvasVideo(
            juliaDrawingContext,
            juliaPreviewContext,
            juliaDrawingContext.canvas,
            startState,
            goalState
        );
};

export const setupPreviewRenderVideo = (
    fractalManager: FractalManager,
    juliaDrawingContext: JuliaContext,
    juliaPreviewContext: JuliaContext,
    modalId: string,
    buttonId: string
) => {
    setupVideoStateCaptureModal(fractalManager, juliaDrawingContext, juliaPreviewContext);
    console.log(juliaPreviewContext.canvas.width);
    const button = <HTMLButtonElement>document.getElementById(buttonId);

    console.log(juliaDrawingContext);
    console.log(juliaDrawingContext.canvas);

    const modalElement = document.getElementById(modalId);
    button.onclick = () => {
        changeVideoStateCaptureModalVisib(modalElement);
    };
};
