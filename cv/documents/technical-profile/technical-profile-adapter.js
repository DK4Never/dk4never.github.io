import { TECHNICAL_PROFILE_EXPERIENCE_IDS, TECHNICAL_PROFILE_FOCUS_IDS, TECHNICAL_PROFILE_PROJECT_IDS } from './technical-profile-model.js';
const required = (value, label) => {
    if (typeof value !== 'string' || !value.trim())
        throw new Error(`Technical Profile projection field is missing: ${label}`);
    return value.trim();
};
const byId = (items, id, label) => {
    const item = items.find(candidate => candidate.id === id);
    if (!item)
        throw new Error(`Technical Profile projection record is missing: ${label}/${id}`);
    return item;
};
const exactIds = (items, expected, label) => {
    if (items.length !== expected.length || new Set(items.map(item => item.id)).size !== items.length || expected.some(id => !items.some(item => item.id === id)))
        throw new Error(`Technical Profile ${label} records are incomplete or duplicated`);
};
const link = (display, href, label) => ({
    display: required(display, `${label}.display`),
    href: required(href, `${label}.href`)
});
const relationshipFor = (id) => id === 'legend-investigations' ? 'company-work' : id === 'independent-engineering' ? 'independent-work' : 'standard';
const experience = (item) => ({
    id: item.id,
    organisation: required(item.organisation, `${item.id}.organisation`),
    role: required(item.role, `${item.id}.role`),
    specialisation: required(item.specialisation, `${item.id}.specialisation`),
    period: required(item.period.display, `${item.id}.period`),
    location: item.location?.trim() || null,
    summary: required(item.summary, `${item.id}.summary`),
    bullets: item.bullets.map(value => required(value, `${item.id}.bullet`)),
    concurrent: item.concurrent,
    relationship: relationshipFor(item.id)
});
const project = (item) => ({
    id: item.id,
    name: required(item.name, `${item.id}.name`),
    description: required(item.description, `${item.id}.description`),
    technologies: item.technologies.map(value => required(value, `${item.id}.technology`)),
    url: item.url?.trim() || null,
    context: item.id === 'legend-investigations-platform' ? 'legend-investigations-platform' : 'standard-public-project'
});
const skill = (item) => ({
    name: required(item.name, 'skill name'),
    classification: item.classification
});
const skillCategory = (item) => ({
    label: required(item.label, 'skill category'),
    items: item.items.map(skill)
});
const focus = (item) => ({
    id: item.id,
    label: required(item.label, `${item.id}.label`),
    statement: required(item.statement, `${item.id}.statement`)
});
export function adaptTechnicalProfileProjection(source, theme = 'blue') {
    if (source.id !== 'technical-profile')
        throw new Error('Technical Profile adapter requires the technical-profile public projection');
    if (!['blue', 'gold', 'red'].includes(theme) || !source.themeSupport.includes(theme))
        throw new Error('Technical Profile theme is unsupported by the projection');
    exactIds(source.experience, TECHNICAL_PROFILE_EXPERIENCE_IDS, 'experience');
    exactIds(source.projects, TECHNICAL_PROFILE_PROJECT_IDS, 'project');
    exactIds(source.achievements, TECHNICAL_PROFILE_FOCUS_IDS, 'focus');
    if (source.certifications.earned.length !== 0)
        throw new Error('Technical Profile cannot render earned certifications');
    const email = required(source.contact.email, 'contact.email');
    return {
        id: 'technical-profile',
        theme,
        contact: {
            name: required(source.contact.name, 'contact.name'),
            location: required(source.contact.location, 'contact.location'),
            phone: link(source.contact.phoneDisplay, source.contact.phoneHref, 'contact.phone'),
            email: link(email, `mailto:${email}`, 'contact.email'),
            portfolio: link(source.contact.portfolio, source.contact.portfolio, 'contact.portfolio'),
            github: link(source.contact.github, source.contact.github, 'contact.github'),
            linkedin: link(source.contact.linkedin, source.contact.linkedin, 'contact.linkedin')
        },
        positioning: {
            primary: required(source.positioning.primary, 'positioning.primary'),
            secondary: required(source.positioning.secondary, 'positioning.secondary')
        },
        summary: required(source.summary, 'summary'),
        currentFocus: TECHNICAL_PROFILE_FOCUS_IDS.map(id => focus(byId(source.achievements, id, 'focus'))),
        capabilityGroups: source.skills.categories.map(skillCategory),
        experience: TECHNICAL_PROFILE_EXPERIENCE_IDS.map(id => experience(byId(source.experience, id, 'experience'))),
        projects: TECHNICAL_PROFILE_PROJECT_IDS.map(id => project(byId(source.projects, id, 'project'))),
        additionalTechnicalExposure: source.skills.additionalTechnicalExposure.map(value => required(value, 'additional technical exposure')),
        professionalDevelopment: source.professionalDevelopment.map(value => required(value, 'professional development')),
        education: {
            institution: required(source.education.institution, 'education.institution'),
            qualification: required(source.education.qualification, 'education.qualification'),
            completed: required(source.education.completed, 'education.completed')
        },
        languages: source.languages.map(value => required(value, 'language'))
    };
}
