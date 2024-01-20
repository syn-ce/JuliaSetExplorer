export const setupHelpModal = (infoModalShortcutCheckboxId: string) => {
    const helpElement = document.getElementById('help');
    const helpModal = document.getElementById('help-modal');

    const infoModalShortcutCheckbox = <HTMLInputElement>document.getElementById(infoModalShortcutCheckboxId);

    const changeHelpModalVisib = () => {
        const currVisib = helpModal.style.visibility;
        if (currVisib == 'visible') (helpModal.style.opacity = '0'), (helpModal.style.visibility = 'hidden');
        else (helpModal.style.visibility = 'visible'), (helpModal.style.opacity = '1');
    };

    helpElement.onclick = (evt) => {
        changeHelpModalVisib();
    };

    document.addEventListener('keydown', (evt) => {
        if (evt.code == 'KeyI' && infoModalShortcutCheckbox.checked) changeHelpModalVisib();
    });
};
