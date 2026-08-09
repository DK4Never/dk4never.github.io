export const setDraftStatus = (status) => {
    document.querySelector('#save-status')?.replaceChildren(document.createTextNode(status));
};
