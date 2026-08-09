import { DEFAULT_DOCUMENT_ID } from './document-registry.js';
import { isDocumentId } from './document-types.js';
export const isTheme = (value) => value === 'blue' || value === 'gold' || value === 'red';
export function parseDocumentQuery(search) {
    const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
    const requestedDocument = params.get('document');
    const requestedTheme = params.get('theme');
    return {
        documentId: isDocumentId(requestedDocument) ? requestedDocument : DEFAULT_DOCUMENT_ID,
        ...(isTheme(requestedTheme) ? { theme: requestedTheme } : {})
    };
}
export function updateDocumentQuery(currentUrl, next) {
    const url = new URL(currentUrl, 'https://pages.invalid/');
    const current = parseDocumentQuery(url.search);
    const documentId = next.documentId ?? current.documentId;
    const theme = next.theme === undefined ? current.theme : next.theme;
    url.searchParams.set('document', documentId);
    if (theme)
        url.searchParams.set('theme', theme);
    else
        url.searchParams.delete('theme');
    return `${url.pathname}${url.search}${url.hash}`;
}
export function applyDocumentQuery(next, mode = 'push') {
    const nextUrl = updateDocumentQuery(window.location.href, next);
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (nextUrl === currentUrl)
        return;
    window.history[`${mode}State`](window.history.state, '', nextUrl);
}
