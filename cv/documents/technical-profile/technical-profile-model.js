export const TECHNICAL_PROFILE_EXPERIENCE_IDS = [
    'btc',
    'gaap-pos',
    'legend-investigations',
    'fs-control-equipment',
    'independent-engineering',
    'monster-signs',
    'signland-margate',
    'early-technical-foundation'
];
export const TECHNICAL_PROFILE_PROJECT_IDS = [
    'manufacturing-production-intelligence',
    'industrial-integration-architecture',
    'qr-traceability-workflow',
    'android-operations-application',
    'legend-systems-cv-application',
    'legend-investigations-platform'
];
export const TECHNICAL_PROFILE_FOCUS_IDS = [
    'recovery-aware-ingestion',
    'production-context',
    'android-scanning',
    'operational-reporting',
    'integrated-engineering',
    'public-tools'
];
export const TECHNICAL_PROFILE_DRAFT_SCHEMA_VERSION = 1;
export const TECHNICAL_PROFILE_DRAFT_CONTENT_VERSION = 1;
export const TECHNICAL_MAX_SUMMARY_LENGTH = 1_800;
export const TECHNICAL_MAX_FOCUS_LENGTH = 800;
export const TECHNICAL_MAX_EXPERIENCE_SUMMARY_LENGTH = 1_100;
export const TECHNICAL_MAX_BULLET_LENGTH = 320;
export const TECHNICAL_MAX_PROJECT_DESCRIPTION_LENGTH = 700;
export const TECHNICAL_MAX_DEVELOPMENT_LENGTH = 300;
export const cloneTechnicalProfileDocument = (document) => structuredClone(document);
export const canonicalTechnicalProfileDraft = (document) => ({
    summary: document.summary,
    currentFocus: document.currentFocus.map(item => ({ id: item.id, statement: item.statement })),
    experience: document.experience.map(item => ({ id: item.id, summary: item.summary, bullets: [...item.bullets] })),
    projects: document.projects.map(item => ({ id: item.id, description: item.description })),
    professionalDevelopment: [...document.professionalDevelopment]
});
export const applyTechnicalProfileDraft = (document, payload) => {
    const next = cloneTechnicalProfileDocument(document);
    next.summary = payload.summary;
    for (const draft of payload.currentFocus) {
        const item = next.currentFocus.find(candidate => candidate.id === draft.id);
        if (item)
            item.statement = draft.statement;
    }
    for (const draft of payload.experience) {
        const item = next.experience.find(candidate => candidate.id === draft.id);
        if (item) {
            item.summary = draft.summary;
            item.bullets = [...draft.bullets];
        }
    }
    for (const draft of payload.projects) {
        const item = next.projects.find(candidate => candidate.id === draft.id);
        if (item)
            item.description = draft.description;
    }
    next.professionalDevelopment = [...payload.professionalDevelopment];
    return next;
};
