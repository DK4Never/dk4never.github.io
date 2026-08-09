import { DraftStore } from '../../app/draft-store.js';
import { hasPrototypeSensitiveKeys } from '../../content/page-one-model.js';
import { TECHNICAL_MAX_BULLET_LENGTH, TECHNICAL_MAX_DEVELOPMENT_LENGTH, TECHNICAL_MAX_EXPERIENCE_SUMMARY_LENGTH, TECHNICAL_MAX_FOCUS_LENGTH, TECHNICAL_MAX_PROJECT_DESCRIPTION_LENGTH, TECHNICAL_MAX_SUMMARY_LENGTH, TECHNICAL_PROFILE_DRAFT_CONTENT_VERSION, TECHNICAL_PROFILE_DRAFT_SCHEMA_VERSION, TECHNICAL_PROFILE_EXPERIENCE_IDS, TECHNICAL_PROFILE_FOCUS_IDS, TECHNICAL_PROFILE_PROJECT_IDS, canonicalTechnicalProfileDraft } from './technical-profile-model.js';
export const TECHNICAL_PROFILE_DRAFT_KEY = 'legend-systems-cv:draft:technical-profile:v1';
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
export function validateTechnicalProfileDraftPayload(input) {
    if (!isRecord(input) || hasPrototypeSensitiveKeys(input) || !exactKeys(input, ['summary', 'currentFocus', 'experience', 'projects', 'professionalDevelopment']))
        throw new Error('Technical Profile draft payload is unsupported');
    if (!Array.isArray(input.currentFocus) || !Array.isArray(input.experience) || !Array.isArray(input.projects) || !Array.isArray(input.professionalDevelopment))
        throw new Error('Technical Profile draft arrays are required');
    validateIds(input.currentFocus.map(item => isRecord(item) ? item.id : undefined), TECHNICAL_PROFILE_FOCUS_IDS, 'Focus');
    validateIds(input.experience.map(item => isRecord(item) ? item.id : undefined), TECHNICAL_PROFILE_EXPERIENCE_IDS, 'Experience');
    validateIds(input.projects.map(item => isRecord(item) ? item.id : undefined), TECHNICAL_PROFILE_PROJECT_IDS, 'Project');
    if (input.professionalDevelopment.length > 4)
        throw new Error('Technical Profile development entries are unsupported');
    return {
        summary: plainText(input.summary, 'Technical Profile summary', TECHNICAL_MAX_SUMMARY_LENGTH),
        currentFocus: input.currentFocus.map(item => {
            if (!isRecord(item) || !exactKeys(item, ['id', 'statement']) || typeof item.id !== 'string')
                throw new Error('Technical Profile focus draft is unsupported');
            return { id: item.id, statement: plainText(item.statement, 'Technical Profile focus statement', TECHNICAL_MAX_FOCUS_LENGTH) };
        }),
        experience: input.experience.map(item => {
            if (!isRecord(item) || !exactKeys(item, ['id', 'summary', 'bullets']) || typeof item.id !== 'string' || !Array.isArray(item.bullets))
                throw new Error('Technical Profile experience draft is unsupported');
            if (item.bullets.length > 8 || item.bullets.some(bullet => typeof bullet !== 'string'))
                throw new Error('Technical Profile bullets are unsupported');
            return { id: item.id, summary: plainText(item.summary, 'Technical Profile experience summary', TECHNICAL_MAX_EXPERIENCE_SUMMARY_LENGTH), bullets: item.bullets.map(bullet => plainText(bullet, 'Technical Profile bullet', TECHNICAL_MAX_BULLET_LENGTH)) };
        }),
        projects: input.projects.map(item => {
            if (!isRecord(item) || !exactKeys(item, ['id', 'description']) || typeof item.id !== 'string')
                throw new Error('Technical Profile project draft is unsupported');
            return { id: item.id, description: plainText(item.description, 'Technical Profile project description', TECHNICAL_MAX_PROJECT_DESCRIPTION_LENGTH) };
        }),
        professionalDevelopment: input.professionalDevelopment.map(value => plainText(value, 'Technical Profile development statement', TECHNICAL_MAX_DEVELOPMENT_LENGTH))
    };
}
export function createTechnicalProfileDraftEnvelope(payload, savedAt = new Date().toISOString()) {
    return { schemaVersion: 1, documentId: 'technical-profile', contentVersion: 1, savedAt, payload: validateTechnicalProfileDraftPayload(payload) };
}
export function validateTechnicalProfileDraftEnvelope(input) {
    if (!isRecord(input) || hasPrototypeSensitiveKeys(input) || !exactKeys(input, ['schemaVersion', 'documentId', 'contentVersion', 'savedAt', 'payload']))
        throw new Error('Technical Profile draft envelope is unsupported');
    if (input.schemaVersion !== TECHNICAL_PROFILE_DRAFT_SCHEMA_VERSION || input.documentId !== 'technical-profile' || input.contentVersion !== TECHNICAL_PROFILE_DRAFT_CONTENT_VERSION || typeof input.savedAt !== 'string')
        throw new Error('Technical Profile draft envelope version is unsupported');
    return createTechnicalProfileDraftEnvelope(input.payload, input.savedAt);
}
export class TechnicalProfileDraftStore {
    store;
    constructor(storage) { this.store = new DraftStore(storage); }
    load(canonical) {
        const record = this.store.load('technical-profile');
        if (!record)
            return { payload: canonicalTechnicalProfileDraft(canonical), state: 'canonical' };
        try {
            return { payload: validateTechnicalProfileDraftPayload(record.payload), state: 'local' };
        }
        catch {
            return { payload: canonicalTechnicalProfileDraft(canonical), state: 'canonical' };
        }
    }
    save(payload) { return this.store.save('technical-profile', validateTechnicalProfileDraftPayload(payload)); }
    reset() { return this.store.reset('technical-profile'); }
    export(payload) {
        const envelope = createTechnicalProfileDraftEnvelope(payload);
        const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'legend-systems-technical-profile.json';
        link.click();
        URL.revokeObjectURL(link.href);
    }
    import(json) { return validateTechnicalProfileDraftEnvelope(JSON.parse(json)).payload; }
}
