export function renderDocumentUnavailable(root, entry, onReturn) {
    root.className = 'document-mount document-mount--unavailable';
    root.replaceChildren();
    const panel = document.createElement('section');
    panel.className = 'document-unavailable';
    panel.setAttribute('aria-labelledby', 'document-unavailable-title');
    const heading = document.createElement('h1');
    heading.id = 'document-unavailable-title';
    heading.textContent = entry.label;
    const status = document.createElement('p');
    status.className = 'document-unavailable-status';
    status.textContent = 'Approved content ready';
    const message = document.createElement('p');
    message.textContent = 'The document template will be implemented in the next stage.';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tool-button tool-button-primary';
    button.textContent = 'Return to Page One';
    button.addEventListener('click', onReturn, { once: true });
    panel.append(heading, status, message, button);
    root.append(panel);
}
