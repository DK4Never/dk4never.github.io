import { DraftStore } from '../../app/draft-store.js';
import { hasPrototypeSensitiveKeys } from '../../content/page-one-model.js';
import { ATS_DRAFT_CONTENT_VERSION, ATS_DRAFT_SCHEMA_VERSION, ATS_EXPERIENCE_IDS, ATS_MAX_BULLET_LENGTH, ATS_MAX_EXPERIENCE_SUMMARY_LENGTH, ATS_MAX_PROJECT_DESCRIPTION_LENGTH, ATS_MAX_SUMMARY_LENGTH, ATS_PROJECT_IDS, canonicalAtsDraft } from './ats-model.js';
export const ATS_DRAFT_KEY = 'legend-systems-cv:draft:ats:v1';
const isRecord = (value) => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const exactKeys = (value, keys) => Object.keys(value).sort().join('|') === [...keys].sort().join('|');
const unsafeText = /<[^>]*>|(?:https?:|data:|file:|\/\/)/i;
const plainText = (value, label, limit) => {
    if (typeof value !== 'string' || value.length > limit || unsafeText.test(value))
        throw new Error(`${label} must be bounded plain text`);
    return value.replaceAll('\r\n', '\n').replaceAll('\r', '\n').trim();
};
const validateIds = (values, expected, label) => {
    if (values.length !== expected.length || new Set(values).size !== values.length || values.some(value => typeof value !== 'string') || expected.some(id => !values.includes(id)))
        throw new Error(`${label} records are incomplete or duplicated`);
};
export function validateAtsDraftPayload(input) {
    if (!isRecord(input) || hasPrototypeSensitiveKeys(input) || !exactKeys(input, ['summary', 'experience', 'projects']))
        throw new Error('ATS draft payload is unsupported');
    if (!Array.isArray(input.experience) || !Array.isArray(input.projects))
        throw new Error('ATS draft arrays are required');
    validateIds(input.experience.map(item => isRecord(item) ? item.id : undefined), ATS_EXPERIENCE_IDS, 'Experience');
    validateIds(input.projects.map(item => isRecord(item) ? item.id : undefined), ATS_PROJECT_IDS, 'Project');
    return {
        summary: plainText(input.summary, 'ATS summary', ATS_MAX_SUMMARY_LENGTH),
        experience: input.experience.map(item => {
            if (!isRecord(item) || !exactKeys(item, ['id', 'summary', 'bullets']) || typeof item.id !== 'string' || !Array.isArray(item.bullets))
                throw new Error('ATS experience draft is unsupported');
            if (item.bullets.length > 8 || item.bullets.some(bullet => typeof bullet !== 'string'))
                throw new Error('ATS bullets are unsupported');
            return { id: item.id, summary: plainText(item.summary, 'ATS experience summary', ATS_MAX_EXPERIENCE_SUMMARY_LENGTH), bullets: item.bullets.map(bullet => plainText(bullet, 'ATS bullet', ATS_MAX_BULLET_LENGTH)) };
        }),
        projects: input.projects.map(item => {
            if (!isRecord(item) || !exactKeys(item, ['id', 'description']) || typeof item.id !== 'string')
                throw new Error('ATS project draft is unsupported');
            return { id: item.id, description: plainText(item.description, 'ATS project description', ATS_MAX_PROJECT_DESCRIPTION_LENGTH) };
        })
    };
}
export function createAtsDraftEnvelope(payload, savedAt = new Date().toISOString()) {
    return { schemaVersion: 1, documentId: 'ats', contentVersion: 1, savedAt, payload: validateAtsDraftPayload(payload) };
}
export function validateAtsDraftEnvelope(input) {
    if (!isRecord(input) || hasPrototypeSensitiveKeys(input) || !exactKeys(input, ['schemaVersion', 'documentId', 'contentVersion', 'savedAt', 'payload']))
        throw new Error('ATS draft envelope is unsupported');
    if (input.schemaVersion !== ATS_DRAFT_SCHEMA_VERSION || input.documentId !== 'ats' || input.contentVersion !== ATS_DRAFT_CONTENT_VERSION || typeof input.savedAt !== 'string')
        throw new Error('ATS draft envelope version is unsupported');
    return createAtsDraftEnvelope(input.payload, input.savedAt);
}
export class AtsDraftStore {
    store;
    constructor(storage) { this.store = new DraftStore(storage); }
    load(canonical) {
        const record = this.store.load('ats');
        if (!record)
            return { payload: canonicalAtsDraft(canonical), state: 'canonical' };
        try {
            return { payload: validateAtsDraftPayload(record.payload), state: 'local' };
        }
        catch {
            return { payload: canonicalAtsDraft(canonical), state: 'canonical' };
        }
    }
    save(payload) { return this.store.save('ats', validateAtsDraftPayload(payload)); }
    reset() { return this.store.reset('ats'); }
    export(payload) {
        const envelope = createAtsDraftEnvelope(payload);
        const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'legend-systems-ats.json';
        link.click();
        URL.revokeObjectURL(link.href);
    }
    import(json) { return validateAtsDraftEnvelope(JSON.parse(json)).payload; }
}
