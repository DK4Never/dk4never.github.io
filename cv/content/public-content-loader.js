import { DOCUMENT_IDS, isDocumentId } from '../app/document-types.js';
export class PublicContentLoadError extends Error {
    constructor(message = 'Approved public CV content could not be loaded.') {
        super(message);
        this.name = 'PublicContentLoadError';
    }
}
const isRecord = (value) => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const asArray = (value) => Array.isArray(value);
const asString = (value) => typeof value === 'string';
const validateManifest = (value, expectedId) => {
    if (!isRecord(value) || value.id !== expectedId || value.schemaVersion !== 1)
        return false;
    if (!isRecord(value.contact) || !isRecord(value.positioning) || !isRecord(value.education) || !isRecord(value.skills))
        return false;
    if (!asString(value.label) || !asString(value.summary))
        return false;
    if (!asString(value.contact.name) || !asString(value.contact.location) || !asString(value.contact.email))
        return false;
    if (!asString(value.contact.phoneDisplay) || !asString(value.contact.phoneHref) || !asString(value.contact.portfolio) || !asString(value.contact.github) || !asString(value.contact.linkedin))
        return false;
    if (!asString(value.positioning.primary) || !asString(value.positioning.secondary))
        return false;
    if (!asString(value.education.institution) || !asString(value.education.qualification) || !asString(value.education.completed))
        return false;
    return asArray(value.themeSupport) && asArray(value.languages) && asArray(value.experience) && asArray(value.projects) && asArray(value.achievements) && asArray(value.professionalDevelopment);
};
export function validatePublicContent(input) {
    if (!isRecord(input) || input.schemaVersion !== 1 || !isRecord(input.site) || !isRecord(input.documents)) {
        throw new PublicContentLoadError();
    }
    if (input.site.defaultDocument !== 'page-one' || !asString(input.site.name))
        throw new PublicContentLoadError();
    const ids = Object.keys(input.documents).sort();
    if (JSON.stringify(ids) !== JSON.stringify([...DOCUMENT_IDS].sort()))
        throw new PublicContentLoadError();
    for (const id of DOCUMENT_IDS) {
        if (!validateManifest(input.documents[id], id))
            throw new PublicContentLoadError();
    }
    return input;
}
export function selectPublicDocument(content, documentId) {
    if (!isDocumentId(documentId) || !content.documents[documentId] || content.documents[documentId].id !== documentId) {
        throw new PublicContentLoadError();
    }
    return content.documents[documentId];
}
export async function loadPublicContent(fetchImpl = fetch, baseURI) {
    const resolvedBase = baseURI ?? (typeof document !== 'undefined' ? document.baseURI : undefined);
    if (!resolvedBase)
        throw new PublicContentLoadError();
    const url = new URL('data/public-content.json', resolvedBase);
    try {
        const response = await fetchImpl(url.href, { headers: { accept: 'application/json' } });
        if (!response.ok)
            throw new PublicContentLoadError();
        return validatePublicContent(await response.json());
    }
    catch (error) {
        if (error instanceof PublicContentLoadError)
            throw error;
        throw new PublicContentLoadError();
    }
}
