export const ATS_EXPERIENCE_IDS = [
    'btc',
    'legend-investigations',
    'gaap-pos',
    'fs-control-equipment',
    'independent-engineering',
    'monster-signs',
    'signland-margate'
];
export const ATS_PROJECT_IDS = [
    'manufacturing-production-intelligence',
    'qr-traceability-workflow',
    'legend-systems-cv-application'
];
export const ATS_DRAFT_SCHEMA_VERSION = 1;
export const ATS_DRAFT_CONTENT_VERSION = 1;
export const ATS_MAX_SUMMARY_LENGTH = 1_200;
export const ATS_MAX_EXPERIENCE_SUMMARY_LENGTH = 900;
export const ATS_MAX_BULLET_LENGTH = 240;
export const ATS_MAX_PROJECT_DESCRIPTION_LENGTH = 480;
export const cloneAtsDocument = (document) => structuredClone(document);
export const canonicalAtsDraft = (document) => ({
    summary: document.summary,
    experience: document.experience.map(item => ({ id: item.id, summary: item.summary, bullets: [...item.bullets] })),
    projects: document.projects.map(item => ({ id: item.id, description: item.description }))
});
export const applyAtsDraft = (document, payload) => {
    const next = cloneAtsDocument(document);
    next.summary = payload.summary;
    const experience = new Map(payload.experience.map(item => [item.id, item]));
    next.experience = next.experience.map(item => {
        const draft = experience.get(item.id);
        return draft ? { ...item, summary: draft.summary, bullets: [...draft.bullets] } : item;
    });
    const projects = new Map(payload.projects.map(item => [item.id, item]));
    next.projects = next.projects.map(item => {
        const draft = projects.get(item.id);
        return draft ? { ...item, description: draft.description } : item;
    });
    return next;
};
