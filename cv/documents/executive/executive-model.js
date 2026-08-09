export const EXECUTIVE_EXPERIENCE_IDS = [
    'btc',
    'gaap-pos',
    'legend-investigations',
    'fs-control-equipment',
    'independent-engineering',
    'monster-signs',
    'signland-margate'
];
export const EXECUTIVE_SYSTEM_IDS = [
    'manufacturing-production-intelligence',
    'qr-traceability-workflow',
    'android-operations-application'
];
export const EXECUTIVE_DRAFT_FIELDS = ['theme', 'summary', 'experience', 'systems'];
export const EXECUTIVE_DRAFT_SCHEMA_VERSION = 1;
export const EXECUTIVE_DRAFT_CONTENT_VERSION = 1;
export const cloneExecutiveDocument = (document) => structuredClone(document);
export const isTheme = (value) => value === 'blue' || value === 'gold' || value === 'red';
export const isExecutiveExperienceId = (value) => typeof value === 'string' && EXECUTIVE_EXPERIENCE_IDS.includes(value);
export const isExecutiveSystemId = (value) => typeof value === 'string' && EXECUTIVE_SYSTEM_IDS.includes(value);
export const canonicalExecutiveDraft = (document) => ({
    theme: document.theme,
    summary: document.summary,
    experience: document.experience.map(item => ({ id: item.id, summary: item.summary, bullets: [...item.bullets] })),
    systems: document.systems.map(item => ({ id: item.id, description: item.description }))
});
export const applyExecutiveDraft = (document, payload) => {
    const next = cloneExecutiveDocument(document);
    next.theme = payload.theme;
    next.summary = payload.summary;
    const experience = new Map(payload.experience.map(item => [item.id, item]));
    next.experience = next.experience.map(item => {
        const draft = experience.get(item.id);
        return draft ? { ...item, summary: draft.summary, bullets: [...draft.bullets] } : item;
    });
    const systems = new Map(payload.systems.map(item => [item.id, item]));
    next.systems = next.systems.map(item => {
        const draft = systems.get(item.id);
        return draft ? { ...item, description: draft.description } : item;
    });
    return next;
};
