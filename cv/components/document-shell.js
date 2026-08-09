export function getDocumentShell() {
    const root = document.querySelector('#runtime-shell');
    const mount = document.querySelector('#document-mount');
    const selector = document.querySelector('#document-selector');
    const description = document.querySelector('#document-description');
    const status = document.querySelector('#runtime-status');
    if (!root || !mount || !selector || !description || !status)
        return null;
    return { root, mount, selector, description, status };
}
export const announce = (status, message) => {
    status.textContent = message;
    status.setAttribute('data-state', 'ready');
    const documentStatus = document.querySelector('#runtime-document-status');
    if (documentStatus)
        documentStatus.textContent = message.includes('unavailable') ? 'PLANNED' : message.includes('ready') ? 'EDITABLE' : 'READY';
};
export const announceLoading = (status) => {
    status.textContent = 'Loading approved public content…';
    status.setAttribute('data-state', 'loading');
    document.querySelector('#runtime-document-status')?.replaceChildren(document.createTextNode('LOADING'));
};
export const announceDocument = (status, documentId) => {
    status.textContent = `${documentId} document ready`;
    status.setAttribute('data-state', 'ready');
};
