export function renderRuntimeError(root, message, onRetry) {
    root.className = 'document-mount document-mount--error';
    root.replaceChildren();
    const panel = document.createElement('section');
    panel.className = 'runtime-error';
    panel.setAttribute('role', 'alert');
    panel.setAttribute('aria-labelledby', 'runtime-error-title');
    const heading = document.createElement('h1');
    heading.id = 'runtime-error-title';
    heading.textContent = 'CV content unavailable';
    const copy = document.createElement('p');
    copy.textContent = message;
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.className = 'tool-button tool-button-primary';
    retry.textContent = 'Retry';
    retry.addEventListener('click', onRetry, { once: true });
    panel.append(heading, copy, retry);
    root.append(panel);
}
