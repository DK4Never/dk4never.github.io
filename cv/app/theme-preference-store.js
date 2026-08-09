export const THEME_PREFERENCE_SCHEMA_VERSION = 1;
const KEY_PREFIX = 'legend-systems-cv:theme-preference:';
const HEX = /^#[0-9a-f]{6}$/i;
const browserStorage = () => {
    try {
        return typeof window === 'undefined' ? null : window.localStorage;
    }
    catch {
        return null;
    }
};
const keyFor = (documentId) => `${KEY_PREFIX}${documentId}:v${THEME_PREFERENCE_SCHEMA_VERSION}`;
export class ThemePreferenceStore {
    storage;
    constructor(storage = browserStorage()) { this.storage = storage; }
    load(documentId) {
        try {
            const raw = this.storage?.getItem(keyFor(documentId));
            if (!raw)
                return null;
            const value = JSON.parse(raw);
            return value.schemaVersion === 1 && value.documentId === documentId && typeof value.accent === 'string' && HEX.test(value.accent)
                ? value.accent.toUpperCase()
                : null;
        }
        catch {
            return null;
        }
    }
    save(documentId, accent) {
        if (!HEX.test(accent))
            return false;
        const value = { schemaVersion: 1, documentId, accent: accent.toUpperCase(), savedAt: new Date().toISOString() };
        try {
            this.storage?.setItem(keyFor(documentId), JSON.stringify(value));
            return Boolean(this.storage);
        }
        catch {
            return false;
        }
    }
    reset(documentId) {
        try {
            this.storage?.removeItem(keyFor(documentId));
            return Boolean(this.storage);
        }
        catch {
            return false;
        }
    }
}
