export const setupHideUIButton = (hideUIBtnId, hideButtonShortcutCheckboxId) => {
    const hideUIButton = document.getElementById(hideUIBtnId);
    const hideButtonShortcutCheckbox = document.getElementById(hideButtonShortcutCheckboxId);
    const uiControlDiv = document.getElementById('controls');
    const uiControlInputs = Array.from(uiControlDiv.getElementsByTagName('input'));
    const uiControlButtons = Array.from(uiControlDiv.getElementsByTagName('button'));
    const metaControlDiv = document.getElementById('meta-controls');
    const metaControlButtons = Array.from(metaControlDiv.getElementsByTagName('button'));
    let uiShown = true;
    // Pressing "h" will hide / show the ui
    document.addEventListener('keydown', (evt) => {
        if (evt.key == 'h' && hideButtonShortcutCheckbox.checked)
            hideUIButton.click();
    });
    hideUIButton.onclick = () => {
        if (uiShown) {
            uiControlInputs.forEach((el) => (el.tabIndex = -1));
            uiControlButtons.forEach((el) => (el.tabIndex = -1));
            metaControlButtons.forEach((el) => {
                el.tabIndex = -1;
                el.classList.add('invisible');
            });
            hideUIButton.classList.remove('invisible');
            hideUIButton.style.opacity = '0.2';
            hideUIButton.innerText = 'Show UI';
            uiControlDiv.classList.add('invisible');
        }
        else {
            uiControlInputs.forEach((el) => (el.tabIndex = 1));
            uiControlButtons.forEach((el) => (el.tabIndex = 1));
            metaControlButtons.forEach((el) => {
                el.tabIndex = 1;
                el.classList.remove('invisible');
            });
            hideUIButton.style.opacity = '1.0';
            hideUIButton.innerText = 'Hide UI';
            uiControlDiv.classList.remove('invisible');
        }
        uiShown = !uiShown;
    };
};
