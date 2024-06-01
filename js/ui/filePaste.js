export const addPasteEventListeners = (fractalManager) => {
    document.body.addEventListener('paste', (evt) => {
        // try filename pasted directly
        let potFilename = evt.clipboardData.getData('text');
        if (fractalManager.tryUpdateRenderFractalsFromString(potFilename))
            return;
        // try get filename from pasted image
        let items = evt.clipboardData?.items;
        if (!(items?.length > 0))
            return;
        potFilename = items[0]?.getAsFile()?.name;
        if (potFilename)
            fractalManager.tryUpdateRenderFractalsFromString(potFilename);
    });
};
