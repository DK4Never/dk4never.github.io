import { DraftStore } from '../../app/draft-store.js';
import { hasPrototypeSensitiveKeys } from '../../content/page-one-model.js';
import { EXECUTIVE_EXPERIENCE_IDS, EXECUTIVE_SYSTEM_IDS, EXECUTIVE_DRAFT_CONTENT_VERSION, EXECUTIVE_DRAFT_SCHEMA_VERSION, canonicalExecutiveDraft, isExecutiveExperienceId, isExecutiveSystemId, isTheme } from './executive-model.js';
export const EXECUTIVE_DRAFT_KEY = 'legend-systems-cv:draft:executive:v1';
export const EXECUTIVE_MAX_SUMMARY_LENGTH = 1_200;
export const EXECUTIVE_MAX_EXPERIENCE_SUMMARY_LENGTH = 900;
export const EXECUTIVE_MAX_BULLET_LENGTH = 220;
export const EXECUTIVE_MAX_SYSTEM_DESCRIPTION_LENGTH = 420;
const isRecord = (value) => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const exactKeys = (value, keys) => Object.keys(value).sort().join('|') === [...keys].sort().join('|');
const plainText = (value, label, limit) => {
    if (typeof value !== 'string' || value.length > limit || /<[^>]*>/.test(value))
        throw new Error(`${label} must be bounded plain text`);
    return value.replaceAll('\r\n', '\n').replaceAll('\r', '\n').trim();
};
const exactIds = (values, expected, guard, label) => {
    if (values.length !== expected.length || values.some(value => !guard(value)) || new Set(values).size !== values.length)
        throw new Error(`${label} records are incomplete or duplicated`);
    const ids = values;
    if (expected.some(id => !ids.includes(id)))
        throw new Error(`${label} records contain an unknown identifier`);
    return ids;
};
export function validateExecutiveDraftPayload(input) {
    if (!isRecord(input) || hasPrototypeSensitiveKeys(input) || !exactKeys(input, ['theme', 'summary', 'experience', 'systems']))
        throw new Error('Executive draft payload is unsupported');
    if (!isTheme(input.theme))
        throw new Error('Executive draft theme is unsupported');
    const experience = input.experience;
    const systems = input.systems;
    if (!Array.isArray(experience) || !Array.isArray(systems))
        throw new Error('Executive draft arrays are required');
    exactIds(experience.map(item => isRecord(item) ? item.id : undefined), EXECUTIVE_EXPERIENCE_IDS, isExecutiveExperienceId, 'Experience');
    exactIds(systems.map(item => isRecord(item) ? item.id : undefined), EXECUTIVE_SYSTEM_IDS, isExecutiveSystemId, 'System');
    return {
        theme: input.theme,
        summary: plainText(input.summary, 'Executive summary', EXECUTIVE_MAX_SUMMARY_LENGTH),
        experience: experience.map(item => {
            if (!isRecord(item) || !exactKeys(item, ['id', 'summary', 'bullets']) || !isExecutiveExperienceId(item.id) || !Array.isArray(item.bullets))
                throw new Error('Executive experience draft is unsupported');
            if (item.bullets.length > 4 || item.bullets.some(bullet => typeof bullet !== 'string'))
                throw new Error('Executive experience bullets are unsupported');
            return { id: item.id, summary: plainText(item.summary, 'Executive experience summary', EXECUTIVE_MAX_EXPERIENCE_SUMMARY_LENGTH), bullets: item.bullets.map(bullet => plainText(bullet, 'Executive experience bullet', EXECUTIVE_MAX_BULLET_LENGTH)) };
        }),
        systems: systems.map(item => {
            if (!isRecord(item) || !exactKeys(item, ['id', 'description']) || !isExecutiveSystemId(item.id))
                throw new Error('Executive system draft is unsupported');
            return { id: item.id, description: plainText(item.description, 'Executive system description', EXECUTIVE_MAX_SYSTEM_DESCRIPTION_LENGTH) };
        })
    };
}
export function validateExecutiveDraftEnvelope(input) {
    if (!isRecord(input) || hasPrototypeSensitiveKeys(input) || !exactKeys(input, ['schemaVersion', 'documentId', 'contentVersion', 'payload']))
        throw new Error('Executive draft envelope is unsupported');
    if (input.schemaVersion !== EXECUTIVE_DRAFT_SCHEMA_VERSION || input.documentId !== 'executive' || input.contentVersion !== EXECUTIVE_DRAFT_CONTENT_VERSION)
        throw new Error('Executive draft envelope version is unsupported');
    return { schemaVersion: 1, documentId: 'executive', contentVersion: 1, payload: validateExecutiveDraftPayload(input.payload) };
}
export class ExecutiveDraftStore {
    store;
    constructor(storage) { this.store = new DraftStore(storage); }
    load(canonical) {
        const record = this.store.load('executive');
        if (!record)
            return { payload: canonicalExecutiveDraft(canonical), state: 'canonical' };
        try {
            return { payload: validateExecutiveDraftPayload(record.payload), state: 'local' };
        }
        catch {
            return { payload: canonicalExecutiveDraft(canonical), state: 'canonical' };
        }
    }
    save(payload) { return this.store.save('executive', validateExecutiveDraftPayload(payload)); }
    reset() { return this.store.reset('executive'); }
    export(payload) {
        const envelope = { schemaVersion: 1, documentId: 'executive', contentVersion: 1, payload: validateExecutiveDraftPayload(payload) };
        const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'legend-systems-executive.json';
        link.click();
        URL.revokeObjectURL(link.href);
    }
    import(json) { return validateExecutiveDraftEnvelope(JSON.parse(json)).payload; }
}
