import { createDefaultDocument } from './page-one-model.js';
import { isPackagedIconName } from '../utils/asset-url.js';
const levelForClassification = (classification) => {
    if (classification === 'Core capability')
        return 8;
    if (classification === 'Practical working capability')
        return 6;
    if (classification === 'Technical exposure')
        return 4;
    return 3;
};
const iconForText = (value) => {
    const text = value.toLowerCase();
    const candidates = [
        ['python', 'python'], ['javascript', 'javascript'], ['typescript', 'typescript'], ['sql', 'sql'],
        ['linux', 'linux'], ['windows', 'windows'], ['android', 'android'], ['qr', 'network'],
        ['matrix', 'network'], ['machine', 'factory'], ['beckhoff', 'factory'], ['twincat', 'factory'],
        ['server', 'server'], ['node', 'server'], ['flask', 'server'], ['report', 'summary'],
        ['git', 'git'], ['bash', 'git'], ['powershell', 'git'], ['data', 'technology'],
        ['network', 'network'], ['java', 'javascript'], ['kotlin', 'javascript'], ['security', 'shield']
    ];
    const match = candidates.find(([needle]) => text.includes(needle))?.[1] ?? 'technology';
    return isPackagedIconName(match) ? match : 'technology';
};
const flattenSkills = (document) => document.skills.categories.flatMap(category => category.items);
export const PAGE_ONE_SKILL_ALLOWLIST = [
    'Python',
    'JavaScript',
    'SQL',
    'Data ingestion',
    'Reporting systems',
    'Linux and Windows',
    'Server deployment, backups and recovery',
    'Machine-data integration'
];
export const PAGE_ONE_TECHNOLOGY_ALLOWLIST = [
    'Python',
    'JavaScript',
    'TypeScript',
    'HTML',
    'CSS',
    'Node.js',
    'Flask',
    'REST',
    'SQL',
    'SQLite',
    'Git',
    'Linux',
    'Bash',
    'PowerShell',
    'Android',
    'Kotlin',
    'Java',
    'Beckhoff / TwinCAT',
    'QR',
    'Data Matrix'
];
export const PAGE_ONE_SYSTEM_ALLOWLIST = [
    'manufacturing-production-intelligence',
    'qr-traceability-workflow',
    'recovery-aware-ingestion'
];
const nameParts = (fullName) => {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    return [parts.shift() ?? 'DEAN', parts.join(' ') || 'KRUGER'];
};
const publicLocation = (value) => value ?? '';
const employerFacingExperienceDescription = (id, summary) => {
    if (id === 'btc')
        return summary.replace(/^Approved public-safe BTC responsibilities include\s*/i, '');
    if (id === 'fs-control-equipment')
        return summary.replace(/^Evidence-supported F&S responsibility areas include\s*/i, '');
    if (id === 'independent-engineering') {
        return 'Independent engineering, consulting, research and project work across software, websites, networking, infrastructure, recovery, mobile tooling and business systems.';
    }
    return summary;
};
const employerFacingExperiencePeriod = (id, display) => id === 'monster-signs' ? display.replace(/,\s*documented period\s*$/i, '') : display;
const systemIconName = (id) => {
    if (id === 'manufacturing-production-intelligence')
        return 'code-2';
    if (id === 'qr-traceability-workflow')
        return 'qr-code';
    if (id === 'recovery-aware-ingestion')
        return 'refresh-cw';
    return 'network';
};
export function adaptPageOneProjection(source, theme = 'red') {
    if (source.id !== 'page-one')
        throw new Error('Page One adapter received the wrong projection manifest');
    const document = createDefaultDocument();
    const [first, last] = nameParts(source.contact.name);
    const allSkills = flattenSkills(source);
    const skillByName = new Map(allSkills.map(skill => [skill.name, skill]));
    const displaySkills = PAGE_ONE_SKILL_ALLOWLIST.map(name => skillByName.get(name)).filter((skill) => Boolean(skill));
    // CV-08B1: this is the reviewed Page One subset from the local repository
    // audit. The public Page One manifest intentionally omits several items
    // that remain approved for the Technical Profile; this bounded projection
    // does not alter the canonical JSON content.
    const technologyNames = [...PAGE_ONE_TECHNOLOGY_ALLOWLIST];
    document.theme = theme;
    document.masthead = {
        kicker: 'SYSTEMS / SOFTWARE / INFRASTRUCTURE',
        first,
        last,
        role: source.positioning.primary,
        subrole: source.positioning.secondary
    };
    document.hero = {
        quote: 'SYSTEMS / SOFTWARE / INFRASTRUCTURE',
        quoteAuthor: source.contact.name,
        status: 'PAGE ONE / PROJECTED CONTENT',
        statusMeta: 'EDITABLE / A4 / STATIC'
    };
    document.contact = {
        title: 'Contact',
        location: source.contact.location,
        phone: source.contact.phoneDisplay,
        phoneHref: source.contact.phoneHref,
        email: source.contact.email,
        emailHref: `mailto:${source.contact.email}`,
        site: source.contact.portfolio,
        siteHref: source.contact.portfolio,
        github: source.contact.github,
        githubHref: source.contact.github,
        linkedin: source.contact.linkedin,
        linkedinHref: source.contact.linkedin
    };
    document.profile = {
        title: 'Education & Languages',
        paragraphs: [
            source.summary,
            `${source.education.qualification}, ${source.education.institution} (${source.education.completed}).`,
            `Languages: ${source.languages.join(' · ')}.`
        ]
    };
    document.skills = {
        title: 'Core Skills',
        items: displaySkills.map(skill => ({ name: skill.name, level: levelForClassification(skill.classification), classification: skill.classification }))
    };
    document.technology = {
        title: 'Technology Stack',
        items: technologyNames.map((name, index) => ({ id: `technology-${index + 1}`, name, icon: iconForText(name), iconMode: 'built-in', colorMode: 'original' }))
    };
    document.capabilities = source.skills.categories.slice(0, 5).map(category => ({
        icon: iconForText(category.label),
        label: category.label.replaceAll(' and ', ' &\n')
    }));
    document.summary = {
        title: 'Professional Summary',
        paragraphs: [source.summary],
        graphic: 'DATA / SYSTEMS / FLOW'
    };
    document.experience = {
        title: 'Professional Experience',
        // The legacy A4 composition has five timeline slots. The remaining approved
        // records remain in the projection for the future document renderers.
        items: source.experience.slice(0, 5).map(entry => ({
            job: entry.role,
            company: entry.organisation,
            location: publicLocation(entry.location),
            period: employerFacingExperiencePeriod(entry.id, entry.period.display),
            description: employerFacingExperienceDescription(entry.id, entry.summary),
            bullets: entry.bullets.slice(0, 2)
        }))
    };
    const systems = [
        ...source.projects.filter(project => PAGE_ONE_SYSTEM_ALLOWLIST.includes(project.id)).map(project => ({ icon: systemIconName(project.id), title: project.name, copy: project.description })),
        ...source.achievements.filter(achievement => PAGE_ONE_SYSTEM_ALLOWLIST.includes(achievement.id)).map(achievement => ({ icon: systemIconName(achievement.id), title: achievement.label, copy: achievement.statement }))
    ];
    document.systems = { title: 'Selected Systems & Outcomes', items: systems };
    return document;
}
