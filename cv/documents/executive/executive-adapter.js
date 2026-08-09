import { EXECUTIVE_EXPERIENCE_IDS, EXECUTIVE_SYSTEM_IDS, isTheme } from './executive-model.js';
const portrait = 'assets/dean-profile-master.webp';
const required = (value, label) => {
    if (typeof value !== 'string' || !value.trim())
        throw new Error(`Executive projection field is missing: ${label}`);
    return value.trim();
};
const byId = (items, id, label) => {
    const item = items.find(candidate => candidate.id === id);
    if (!item)
        throw new Error(`Executive projection record is missing: ${label}/${id}`);
    return item;
};
const link = (display, href) => ({ display: required(display, 'contact link display'), href: required(href, 'contact link href') });
const experience = (item) => ({
    id: item.id,
    organisation: required(item.organisation, `${item.id}.organisation`),
    role: required(item.role, `${item.id}.role`),
    specialisation: required(item.specialisation, `${item.id}.specialisation`),
    period: required(item.period.display, `${item.id}.period`),
    location: item.location?.trim() || null,
    summary: required(item.summary, `${item.id}.summary`),
    bullets: item.bullets.filter(Boolean).map(value => required(value, `${item.id}.bullet`)),
    concurrent: item.concurrent
});
const project = (item) => ({
    id: item.id,
    name: required(item.name, `${item.id}.name`),
    description: required(item.description, `${item.id}.description`),
    technologies: item.technologies.map(value => required(value, `${item.id}.technology`))
});
const skill = (category, item) => ({
    name: required(item.name, `${category}/${item.name}`),
    classification: required(item.classification, `${category}/${item.name}.classification`),
    category
});
export function adaptExecutiveProjection(source, theme = 'blue') {
    if (source.id !== 'executive')
        throw new Error('Executive adapter requires the executive public projection');
    if (!isTheme(theme) || !source.themeSupport.includes(theme))
        throw new Error('Executive theme is not supported by the projection');
    const selectedExperience = EXECUTIVE_EXPERIENCE_IDS.map(id => experience(byId(source.experience, id, 'experience')));
    const selectedSystems = EXECUTIVE_SYSTEM_IDS.map(id => project(byId(source.projects, id, 'project')));
    const skills = source.skills.categories.flatMap(category => category.items
        .filter(item => item.classification === 'Core capability' || item.classification === 'Practical working capability')
        .map(item => skill(required(category.label, 'skill category'), item)));
    const contactEmail = required(source.contact.email, 'contact.email');
    return {
        id: 'executive',
        theme,
        portrait,
        contact: {
            name: required(source.contact.name, 'contact.name'),
            location: required(source.contact.location, 'contact.location'),
            phone: link(source.contact.phoneDisplay, source.contact.phoneHref),
            email: link(contactEmail, `mailto:${contactEmail}`),
            portfolio: link(source.contact.portfolio, source.contact.portfolio),
            github: link(source.contact.github, source.contact.github),
            linkedin: link(source.contact.linkedin, source.contact.linkedin)
        },
        positioning: {
            primary: required(source.positioning.primary, 'positioning.primary'),
            secondary: required(source.positioning.secondary, 'positioning.secondary')
        },
        summary: required(source.summary, 'summary'),
        capabilities: [...new Set(source.skills.categories.map(category => required(category.label, 'skill category')))],
        experience: selectedExperience,
        systems: selectedSystems,
        skills,
        education: {
            institution: required(source.education.institution, 'education.institution'),
            qualification: required(source.education.qualification, 'education.qualification'),
            completed: required(source.education.completed, 'education.completed')
        },
        languages: source.languages.map(value => required(value, 'language'))
    };
}
