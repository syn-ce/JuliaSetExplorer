export const addDragDropEventListeners = (fractalManager, dropzoneElementId, juliaPreviewContext, juliaDrawingContext, juliaPreviewContainerId) => {
    var dropzone = document.getElementById(dropzoneElementId);
    document.body.ondragenter = (evt) => {
        fractalManager.mandelContext.indicatorFollowsMouse = false;
        dropzone.style.visibility = 'visible';
        dropzone.style.opacity = '1';
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
        if (!file)
            return;
        let name = file.name;
        fractalManager.tryUpdateRenderFractalsFromString(name, juliaPreviewContext, juliaDrawingContext, juliaPreviewContainerId);
    };
    document.body.ondragleave = (evt) => {
        if (evt.target != dropzone)
            return;
        dropzone.style.visibility = 'hidden';
        dropzone.style.opacity = '0';
    };
};
