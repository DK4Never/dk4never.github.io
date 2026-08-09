import { ATS_EXPERIENCE_IDS, ATS_PROJECT_IDS } from './ats-model.js';
const required = (value, label) => {
    if (typeof value !== 'string' || !value.trim())
        throw new Error(`ATS projection field is missing: ${label}`);
    return value.trim();
};
const byId = (items, id, label) => {
    const item = items.find(candidate => candidate.id === id);
    if (!item)
        throw new Error(`ATS projection record is missing: ${label}/${id}`);
    return item;
};
const link = (display, href, label) => ({
    display: required(display, `${label}.display`),
    href: required(href, `${label}.href`)
});
const experience = (item) => ({
    id: item.id,
    organisation: required(item.organisation, `${item.id}.organisation`),
    role: required(item.role, `${item.id}.role`),
    specialisation: required(item.specialisation, `${item.id}.specialisation`),
    period: required(item.period.display, `${item.id}.period`),
    location: item.location?.trim() || null,
    summary: required(item.summary, `${item.id}.summary`),
    bullets: item.bullets.map(value => required(value, `${item.id}.bullet`)),
    concurrent: item.concurrent
});
const project = (item) => ({
    id: item.id,
    name: required(item.name, `${item.id}.name`),
    description: required(item.description, `${item.id}.description`),
    technologies: item.technologies.map(value => required(value, `${item.id}.technology`)),
    url: item.url?.trim() || null
});
const skillGroups = (source) => source.skills.categories.map(category => ({
    label: required(category.label, 'skill category'),
    items: category.items
        .filter((item) => item.classification === 'Core capability' || item.classification === 'Practical working capability')
        .map(item => required(item.name, 'skill name'))
})).filter(group => group.items.length > 0);
export function adaptAtsProjection(source, theme = 'red') {
    if (source.id !== 'ats')
        throw new Error('ATS adapter requires the ATS public projection');
    if (!source.themeSupport.includes(theme))
        throw new Error('ATS theme is unsupported by the projection');
    const contactEmail = required(source.contact.email, 'contact.email');
    return {
        id: 'ats',
        theme,
        contact: {
            name: required(source.contact.name, 'contact.name'),
            location: required(source.contact.location, 'contact.location'),
            phone: link(source.contact.phoneDisplay, source.contact.phoneHref, 'contact.phone'),
            email: link(contactEmail, `mailto:${contactEmail}`, 'contact.email'),
            portfolio: link(source.contact.portfolio, source.contact.portfolio, 'contact.portfolio'),
            github: link(source.contact.github, source.contact.github, 'contact.github'),
            linkedin: link(source.contact.linkedin, source.contact.linkedin, 'contact.linkedin')
        },
        positioning: {
            primary: required(source.positioning.primary, 'positioning.primary'),
            secondary: required(source.positioning.secondary, 'positioning.secondary')
        },
        summary: required(source.summary, 'summary'),
        skillGroups: skillGroups(source),
        experience: ATS_EXPERIENCE_IDS.map(id => experience(byId(source.experience, id, 'experience'))),
        projects: ATS_PROJECT_IDS.map(id => project(byId(source.projects, id, 'project'))),
        additionalTechnicalExposure: source.skills.additionalTechnicalExposure.map(value => required(value, 'additional technical exposure')),
        education: {
            institution: required(source.education.institution, 'education.institution'),
            qualification: required(source.education.qualification, 'education.qualification'),
            completed: required(source.education.completed, 'education.completed')
        },
        languages: source.languages.map(value => required(value, 'language'))
    };
}
