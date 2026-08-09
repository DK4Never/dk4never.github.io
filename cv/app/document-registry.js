import { DOCUMENT_IDS } from './document-types.js';
const PAGE_ONE_CAPABILITIES = {
    theme: true, zoom: true, print: true, edit: true, save: true, reset: true,
    importExport: true, builder: true, portrait: true, undoRedo: true
};
const EXECUTIVE_CAPABILITIES = {
    theme: true, zoom: true, print: true, edit: true, save: true, reset: true,
    importExport: true, builder: true, portrait: false, undoRedo: false
};
const ATS_CAPABILITIES = {
    theme: true, zoom: true, print: true, edit: true, save: true, reset: true,
    importExport: true, builder: true, portrait: false, undoRedo: false
};
const TECHNICAL_PROFILE_CAPABILITIES = {
    theme: true, zoom: true, print: true, edit: true, save: true, reset: true,
    importExport: true, builder: true, portrait: false, undoRedo: false
};
export const DOCUMENT_REGISTRY = [
    {
        id: 'page-one',
        label: 'Page One',
        description: 'Editable A4 Page One composition',
        renderer: 'page-one',
        projectionId: 'page-one',
        themeSupport: ['blue', 'gold', 'red'],
        printProfile: 'a4-single-page',
        draftKey: 'legend-systems-cv:draft:page-one:v1',
        availability: 'available',
        capabilities: PAGE_ONE_CAPABILITIES
    },
    {
        id: 'executive',
        label: 'Executive CV',
        description: 'Approved executive CV content',
        renderer: 'executive',
        projectionId: 'executive',
        themeSupport: ['blue', 'gold', 'red'],
        printProfile: 'a4-two-page',
        draftKey: 'legend-systems-cv:draft:executive:v1',
        availability: 'available',
        capabilities: EXECUTIVE_CAPABILITIES
    },
    {
        id: 'ats',
        label: 'ATS CV',
        description: 'Approved ATS CV content',
        renderer: 'ats',
        projectionId: 'ats',
        themeSupport: ['blue', 'gold', 'red'],
        printProfile: 'a4-continuous',
        draftKey: 'legend-systems-cv:draft:ats:v1',
        availability: 'available',
        capabilities: ATS_CAPABILITIES
    },
    {
        id: 'technical-profile',
        label: 'Technical Career Profile',
        description: 'Approved technical career profile content',
        renderer: 'technical-profile',
        projectionId: 'technical-profile',
        themeSupport: ['blue', 'gold', 'red'],
        printProfile: 'a4-multi-page',
        draftKey: 'legend-systems-cv:draft:technical-profile:v1',
        availability: 'available',
        capabilities: TECHNICAL_PROFILE_CAPABILITIES
    }
];
export const DEFAULT_DOCUMENT_ID = 'page-one';
export const registryEntry = (id) => {
    const entry = DOCUMENT_REGISTRY.find(candidate => candidate.id === id);
    if (!entry)
        throw new Error(`Unknown document: ${id}`);
    return entry;
};
export function validateRegistryAgainstProjection(projection) {
    const registryIds = DOCUMENT_REGISTRY.map(entry => entry.id);
    const projectionIds = Object.keys(projection.documents).sort();
    if (registryIds.length !== DOCUMENT_IDS.length || new Set(registryIds).size !== DOCUMENT_IDS.length) {
        throw new Error('Document registry must contain exactly four unique documents');
    }
    if (JSON.stringify([...registryIds].sort()) !== JSON.stringify(projectionIds)) {
        throw new Error('Document registry and projection document IDs do not match');
    }
    for (const entry of DOCUMENT_REGISTRY) {
        const manifest = projection.documents[entry.projectionId];
        if (!manifest || manifest.id !== entry.projectionId)
            throw new Error(`Projection manifest mismatch for ${entry.id}`);
    }
    if (projection.site.defaultDocument !== DEFAULT_DOCUMENT_ID)
        throw new Error('Page One must remain the default document');
}
