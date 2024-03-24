import { FractalManager } from '../fractal/FractalManager.js';
import { JuliaContext } from '../fractal/JuliaContext.js';

export const addDragDropEventListeners = (
    fractalManager: FractalManager,
    dropzoneElementId: string,
    juliaPreviewContext: JuliaContext,
    juliaDrawingContext: JuliaContext,
    juliaPreviewContainerId: string,
    renderVideoModalId: string
) => {
    const dropzone = document.getElementById(dropzoneElementId);
    const renderVideoModal = document.getElementById(renderVideoModalId);

    document.body.ondragenter = (evt) => {
        fractalManager.mandelContext.indicatorFollowsMouse = false;
        if (renderVideoModal.style.visibility === 'visible') return; // drag and drop of video-modal overwrites generic dropzone
        dropzone.style.visibility = 'visible';
        dropzone.style.opacity = '1';
    };

    document.body.ondragover = (evt) => {
        evt.preventDefault();
    };

    document.body.ondrop = (evt) => {
        if (renderVideoModal.style.visibility === 'visible') return;
        dropzone.style.visibility = 'hidden';
        dropzone.style.opacity = '0';
        evt.stopPropagation();
        evt.preventDefault();

        let file = evt.dataTransfer.files[0];
        if (!file) return;

        let name = file.name;

        fractalManager.tryUpdateRenderFractalsFromString(
            name,
            juliaPreviewContext,
            juliaDrawingContext,
            juliaPreviewContainerId
        );
    };

    document.body.ondragleave = (evt) => {
        if (evt.target != dropzone) return;
        dropzone.style.visibility = 'hidden';
        dropzone.style.opacity = '0';
    };
};
