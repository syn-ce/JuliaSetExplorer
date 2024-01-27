export const addPasteEventListeners = (fractalManager, juliaPreviewContext, juliaDrawingContext, juliaPreviewContainerId) => {
    document.body.addEventListener('paste', (evt) => {
        // try filename pasted directly
        let potFilename = evt.clipboardData.getData('text');
        if (fractalManager.tryUpdateRenderFractalsFromString(potFilename, juliaPreviewContext, juliaDrawingContext, juliaPreviewContainerId))
            return;
        // try get filename from pasted image
        let items = evt.clipboardData?.items;
        if (!(items?.length > 0))
            return;
        potFilename = items[0]?.getAsFile()?.name;
        if (potFilename)
            fractalManager.tryUpdateRenderFractalsFromString(potFilename, juliaPreviewContext, juliaDrawingContext, juliaPreviewContainerId);
    });
};
