import { registryEntry } from './document-registry.js';
import { isDocumentId } from './document-types.js';
import { createDefaultDocument, hasPrototypeSensitiveKeys, normaliseDocument } from '../content/page-one-model.js';
import { isPackagedIconName } from '../utils/asset-url.js';
import { isSafeCustomIconData } from '../utils/custom-icon.js';
export const DRAFT_SCHEMA_VERSION = 1;
export const DRAFT_CONTENT_VERSION = 1;
export const LEGACY_PAGE_ONE_KEY = 'legend-systems-a4-cv-builder';
export const PAGE_ONE_DRAFT_KEY = 'legend-systems-cv:draft:page-one:v1';
export const LEGACY_MIGRATION_MARKER = 'legend-systems-cv:migration:page-one:v1';
const isRecord = (value) => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const MAX_DRAFT_BYTES = 5_000_000;
const assertSafeImportedPayload = (input) => {
    const portrait = input.portrait;
    if (portrait && typeof portrait === 'object' && !Array.isArray(portrait)) {
        const source = portrait.src;
        if (typeof source !== 'string' || (!(source.startsWith('assets/') && !source.includes('..')) && !/^data:image\/(?:png|jpeg|webp|gif);base64,/i.test(source)))
            throw new Error('Portrait source is not a permitted local asset');
    }
    const iconArrays = [
        input.technology?.items,
        input.capabilities,
        input.systems?.items
    ];
    for (const values of iconArrays) {
        if (!Array.isArray(values))
            continue;
        for (const item of values) {
            if (item && typeof item === 'object' && !isPackagedIconName(item.icon))
                throw new Error('Import contains an unsupported icon');
            if (item && typeof item === 'object' && item.customIconData !== undefined && !isSafeCustomIconData(item.customIconData))
                throw new Error('Import contains an unsafe custom icon');
            if (item && typeof item === 'object' && item.iconRef !== undefined && !/^[a-z0-9][a-z0-9._-]*\.(?:svg|png|webp)$/i.test(String(item.iconRef)))
                throw new Error('Import contains an unsafe icon reference');
        }
    }
};
const getBrowserStorage = () => {
    try {
        return typeof window === 'undefined' ? null : window.localStorage;
    }
    catch {
        return null;
    }
};
const parseEnvelope = (raw, expectedId) => {
    if (!raw || raw.length > MAX_DRAFT_BYTES)
        return null;
    try {
        const value = JSON.parse(raw);
        if (!isRecord(value) || hasPrototypeSensitiveKeys(value))
            return null;
        if (value.schemaVersion !== DRAFT_SCHEMA_VERSION || value.contentVersion !== DRAFT_CONTENT_VERSION || value.documentId !== expectedId)
            return null;
        if (typeof value.savedAt !== 'string' || !isRecord(value.payload))
            return null;
        return {
            schemaVersion: 1,
            documentId: expectedId,
            contentVersion: 1,
            savedAt: value.savedAt,
            payload: value.payload
        };
    }
    catch {
        return null;
    }
};
const readStorage = (storage, key) => {
    try {
        return storage?.getItem(key) ?? null;
    }
    catch {
        return null;
    }
};
const writeStorage = (storage, key, value) => {
    try {
        storage?.setItem(key, value);
        return Boolean(storage);
    }
    catch {
        return false;
    }
};
const removeStorage = (storage, key) => {
    try {
        storage?.removeItem(key);
        return Boolean(storage);
    }
    catch {
        return false;
    }
};
export function draftKeyFor(documentId) {
    return registryEntry(documentId).draftKey;
}
export function createDraftEnvelope(documentId, payload, savedAt = new Date().toISOString()) {
    if (!isDocumentId(documentId) || !isRecord(payload) || hasPrototypeSensitiveKeys(payload))
        throw new Error('Draft payload is not safe');
    return { schemaVersion: 1, documentId, contentVersion: 1, savedAt, payload: structuredClone(payload) };
}
export function adaptLegacyPageOnePayload(input, canonical = createDefaultDocument()) {
    if (!isRecord(input) || hasPrototypeSensitiveKeys(input))
        return null;
    if (input.version !== 2 || !isRecord(input.portrait) || !isRecord(input.contact))
        return null;
    const adapted = normaliseDocument(input, canonical);
    if (!adapted.masthead.first || !adapted.masthead.last)
        return null;
    return adapted;
}
export class DraftStore {
    storage;
    constructor(storage = getBrowserStorage()) {
        this.storage = storage;
    }
    load(documentId) {
        const envelope = parseEnvelope(readStorage(this.storage, draftKeyFor(documentId)), documentId);
        return envelope ? { payload: structuredClone(envelope.payload), savedAt: envelope.savedAt, migrated: false } : null;
    }
    save(documentId, payload) {
        try {
            const envelope = createDraftEnvelope(documentId, payload);
            const serialized = JSON.stringify(envelope);
            if (serialized.length > MAX_DRAFT_BYTES)
                return false;
            return writeStorage(this.storage, draftKeyFor(documentId), serialized);
        }
        catch {
            return false;
        }
    }
    reset(documentId) {
        return removeStorage(this.storage, draftKeyFor(documentId));
    }
    migrateLegacyPageOne(canonical) {
        const marker = readStorage(this.storage, LEGACY_MIGRATION_MARKER);
        if (marker === 'complete')
            return 'already-complete';
        const legacyRaw = readStorage(this.storage, LEGACY_PAGE_ONE_KEY);
        if (!legacyRaw) {
            writeStorage(this.storage, LEGACY_MIGRATION_MARKER, 'complete');
            return 'none';
        }
        if (legacyRaw.length > MAX_DRAFT_BYTES)
            return 'failed';
        try {
            const adapted = adaptLegacyPageOnePayload(JSON.parse(legacyRaw), canonical);
            if (!adapted || !this.save('page-one', adapted))
                return 'failed';
            if (!removeStorage(this.storage, LEGACY_PAGE_ONE_KEY))
                return 'failed';
            if (!writeStorage(this.storage, LEGACY_MIGRATION_MARKER, 'complete'))
                return 'failed';
            return 'migrated';
        }
        catch {
            return 'failed';
        }
    }
}
export function validateImportedPageOne(input, canonical) {
    if (!isRecord(input) || hasPrototypeSensitiveKeys(input))
        throw new Error('Import has unsafe object keys');
    const isEnvelope = 'schemaVersion' in input || 'documentId' in input || 'contentVersion' in input || 'payload' in input;
    if (isEnvelope) {
        if (input.schemaVersion !== 1 || input.documentId !== 'page-one' || input.contentVersion !== 1 || !isRecord(input.payload))
            throw new Error('Import envelope is unsupported');
        if (hasPrototypeSensitiveKeys(input.payload))
            throw new Error('Import payload has unsafe object keys');
        assertSafeImportedPayload(input.payload);
        return normaliseDocument(input.payload, canonical);
    }
    assertSafeImportedPayload(input);
    const legacy = adaptLegacyPageOnePayload(input, canonical);
    if (!legacy)
        throw new Error('Legacy Page One import is invalid');
    return legacy;
}
