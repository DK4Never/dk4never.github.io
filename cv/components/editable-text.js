const HTML_LIKE = /<[^>]*>/;
export const escapeEditableText = (value) => value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
export const normaliseEditableText = (value, maxLength) => {
    const normalised = value.replaceAll('\r\n', '\n').replaceAll('\r', '\n').trim();
    if (HTML_LIKE.test(normalised))
        throw new Error('Editable content must be plain text');
    if (normalised.length > maxLength)
        throw new Error('Editable content exceeds the permitted length');
    return normalised;
};
export const editableText = (fieldId, label, value, maxLength, className = 'editable-text') => `<span class="${escapeEditableText(className)}" data-field-id="${escapeEditableText(fieldId)}" data-max-length="${maxLength}" contenteditable="true" role="textbox" aria-label="${escapeEditableText(label)}" tabindex="0">${escapeEditableText(value)}</span>`;
