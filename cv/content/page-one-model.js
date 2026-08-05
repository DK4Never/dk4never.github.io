const defaultDocument = {
    version: 2,
    theme: 'blue',
    portrait: { src: 'assets/dean-profile-master.webp', x: 50, y: 18, scale: 1 },
    sections: {
        contact: true,
        profile: true,
        skills: true,
        technology: true,
        summary: true,
        experience: true,
        systems: true
    },
    masthead: {
        kicker: 'SYSTEMS / SOFTWARE / INFRASTRUCTURE',
        first: 'DEAN',
        last: 'KRUGER',
        role: 'Senior Software Engineer',
        subrole: 'Systems Architect · DevOps Engineer'
    },
    hero: {
        quote: 'Knowledge comes, but wisdom lingers.',
        quoteAuthor: 'Dean Kruger',
        status: 'PAGE ONE / STRUCTURED BUILDER',
        statusMeta: 'EDITABLE / A4 / STATIC'
    },
    brand: {
        name: 'LEGEND',
        type: 'SYSTEMS'
    },
    contact: {
        title: 'Contact',
        location: 'South Africa',
        phone: '079 643 6540',
        email: 'dean.kruger3@gmail.com',
        site: 'dk4never.github.io',
        github: 'github.com/DK4Never'
    },
    profile: {
        title: 'Professional Profile',
        paragraphs: [
            'Self-taught software engineer and systems architect with approximately 20 years of practical experience across software development, industrial systems, networking, automation and applied technology.',
            'Builds production monitoring, machine-event and reporting systems, QR traceability flows, mobile operations tooling and recovery-aware workflows.',
            'Completed Grade 12 / Matric at Hoërskool Suid-Natal in 2008 and works across English and Afrikaans.'
        ]
    },
    skills: {
        title: 'Core Skills',
        items: [
            { name: 'System Architecture', level: 9 },
            { name: 'Python Development', level: 9 },
            { name: 'Web Development', level: 9 },
            { name: 'Industrial Automation', level: 8 },
            { name: 'Database Design', level: 8 },
            { name: 'DevOps & CI/CD', level: 8 },
            { name: 'Cybersecurity', level: 8 },
            { name: 'Networking', level: 8 },
            { name: 'Android Development', level: 7 },
            { name: 'AI & LLM Integration', level: 7 }
        ]
    },
    technology: {
        title: 'Technology Stack',
        items: [
            { icon: 'python', name: 'Python' },
            { icon: 'flask', name: 'Flask' },
            { icon: 'javascript', name: 'JavaScript' },
            { icon: 'typescript', name: 'TypeScript' },
            { icon: 'csharp', name: 'C#' },
            { icon: 'sql', name: 'SQL' },
            { icon: 'postgresql', name: 'PostgreSQL' },
            { icon: 'sqlite', name: 'SQLite' },
            { icon: 'docker', name: 'Docker' },
            { icon: 'git', name: 'Git' },
            { icon: 'linux', name: 'Linux' },
            { icon: 'windows', name: 'Windows' },
            { icon: 'beckhoff', name: 'Beckhoff' },
            { icon: 'siemens', name: 'Siemens' },
            { icon: 'network', name: 'REST / JSON' }
        ]
    },
    capabilities: [
        { icon: 'factory', label: 'Industrial\nSystems' },
        { icon: 'timer', label: 'Real-Time\nWorkflows' },
        { icon: 'ai', label: 'AI &\nAnalytics' },
        { icon: 'shield', label: 'Defensive\nSecurity' },
        { icon: 'server', label: 'DevOps &\nInfrastructure' }
    ],
    summary: {
        title: 'Professional Summary',
        paragraphs: [
            'Versatile, solutions-driven engineer experienced in developing and deploying connected software for manufacturing and operational environments.',
            'Specializes in production monitoring, machine integration, data collection, QR traceability, mobile applications, reporting and system recovery.',
            'Combines software, infrastructure and operational problem solving to connect factory data with practical decisions.'
        ],
        graphic: 'DATA / SYSTEMS / FLOW'
    },
    experience: {
        title: 'Professional Experience',
        items: [
            {
                job: 'Software Engineer / Systems Developer',
                company: 'Best Tobacco Company (BTC)',
                location: 'Germiston, South Africa',
                period: 'JAN 2026 - PRESENT',
                description: 'Developing a manufacturing intelligence and operations platform for production monitoring, machine events, reporting and traceability.',
                bullets: ['Machine integration and production workflows', 'QR traceability and Android operations flows']
            },
            {
                job: 'Production Assembler & Programmer',
                company: 'F&S Control Equipment',
                location: 'South Africa',
                period: '2018 - 2020',
                description: 'Assembled and programmed control equipment while supporting practical production quality and technical problem solving.',
                bullets: ['Control-equipment assembly', 'Programming and production support']
            },
            {
                job: 'Signage Production & Installation',
                company: 'Monster Signs',
                location: 'South Africa',
                period: '2013 - 2015',
                description: 'Combined graphic production, signage fabrication and installation work in a hands-on production environment.',
                bullets: ['Graphic and signage production', 'Installation and practical delivery']
            },
            {
                job: 'Signage Production & Installation',
                company: 'Signland Margate',
                location: 'South Africa',
                period: '2009 - 2012',
                description: 'Built a practical technical foundation through signage production, vinyl application, installation and project coordination.',
                bullets: ['Production and vinyl application', 'Installation and project support']
            }
        ]
    },
    systems: {
        title: 'Selected Systems & Outcomes',
        items: [
            { icon: 'factory', title: 'Production monitoring', copy: 'Manufacturing data, machine events and operational views.' },
            { icon: 'timer', title: 'Operational workflows', copy: 'Reporting and diagnostics built around production context.' },
            { icon: 'technology', title: 'QR traceability', copy: 'Packet records, shifts, machines and operators connected through QR flows.' },
            { icon: 'android', title: 'Mobile operations', copy: 'Android scanning and operator-facing workflow integration.' },
            { icon: 'server', title: 'Recovery-aware systems', copy: 'Resilient reporting and recovery approaches for disrupted sources.' }
        ]
    },
    footer: {
        motto: 'DISCIPLINE · DEDICATION · INNOVATION · IMPACT',
        subtitle: 'Building intelligent systems that solve real-world problems.'
    }
};
export const createDefaultDocument = () => structuredClone(defaultDocument);
const asText = (value, fallback) => typeof value === 'string' ? value : fallback;
const asBool = (value, fallback) => typeof value === 'boolean' ? value : fallback;
const asLevel = (value, fallback) => Math.max(1, Math.min(10, Number.isFinite(Number(value)) ? Number(value) : fallback));
const asNumber = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
export function normaliseDocument(input) {
    const base = createDefaultDocument();
    if (!input || typeof input !== 'object')
        return base;
    const source = input;
    const value = structuredClone(base);
    if (source.theme === 'blue' || source.theme === 'gold' || source.theme === 'red')
        value.theme = source.theme;
    if (source.portrait && typeof source.portrait === 'object') {
        value.portrait.src = asText(source.portrait.src, value.portrait.src);
        value.portrait.x = Math.max(0, Math.min(100, asNumber(source.portrait.x, value.portrait.x)));
        value.portrait.y = Math.max(0, Math.min(100, asNumber(source.portrait.y, value.portrait.y)));
        value.portrait.scale = Math.max(.7, Math.min(1.8, asNumber(source.portrait.scale, value.portrait.scale)));
    }
    if (source.sections && typeof source.sections === 'object') {
        for (const key of Object.keys(value.sections)) {
            value.sections[key] = asBool(source.sections[key], value.sections[key]);
        }
    }
    if (source.masthead)
        Object.assign(value.masthead, source.masthead);
    if (source.hero) {
        value.hero.quote = asText(source.hero.quote, value.hero.quote);
        value.hero.quoteAuthor = asText(source.hero.quoteAuthor, value.hero.quoteAuthor);
        value.hero.status = asText(source.hero.status, value.hero.status);
        value.hero.statusMeta = asText(source.hero.statusMeta, value.hero.statusMeta);
    }
    if (source.brand) {
        value.brand.name = asText(source.brand.name, value.brand.name);
        value.brand.type = asText(source.brand.type, value.brand.type);
    }
    if (source.contact)
        Object.assign(value.contact, source.contact);
    if (source.profile) {
        value.profile.title = asText(source.profile.title, value.profile.title);
        if (Array.isArray(source.profile.paragraphs))
            value.profile.paragraphs = source.profile.paragraphs.map((item, index) => asText(item, value.profile.paragraphs[index] || '')).filter(Boolean).slice(0, 3);
    }
    if (source.skills && Array.isArray(source.skills.items))
        value.skills.items = source.skills.items.map(item => ({ name: asText(item?.name, 'Skill'), level: asLevel(item?.level, 6) })).slice(0, 12);
    if (source.technology && Array.isArray(source.technology.items))
        value.technology.items = source.technology.items.map(item => ({ name: asText(item?.name, 'Technology'), icon: asText(item?.icon, 'technology') })).slice(0, 18);
    if (Array.isArray(source.capabilities))
        value.capabilities = source.capabilities.map(item => ({ icon: asText(item?.icon, 'gear'), label: asText(item?.label, 'Capability') })).slice(0, 6);
    if (source.summary) {
        value.summary.title = asText(source.summary.title, value.summary.title);
        value.summary.graphic = asText(source.summary.graphic, value.summary.graphic);
        if (Array.isArray(source.summary.paragraphs))
            value.summary.paragraphs = source.summary.paragraphs.map((item, index) => asText(item, value.summary.paragraphs[index] || '')).filter(Boolean).slice(0, 3);
    }
    if (source.experience && Array.isArray(source.experience.items)) {
        value.experience.items = source.experience.items.map(item => ({
            job: asText(item?.job, 'Role'), company: asText(item?.company, 'Organisation'), location: asText(item?.location, 'South Africa'), period: asText(item?.period, 'Selected work'), description: asText(item?.description, 'Technical work and project delivery.'), bullets: Array.isArray(item?.bullets) ? item.bullets.map(bullet => asText(bullet, 'Technical delivery')).filter(Boolean).slice(0, 3) : []
        })).slice(0, 5);
    }
    if (source.systems && Array.isArray(source.systems.items))
        value.systems.items = source.systems.items.map(item => ({ icon: asText(item?.icon, 'gear'), title: asText(item?.title, 'System'), copy: asText(item?.copy, 'Selected engineering work.') })).slice(0, 6);
    if (source.footer)
        Object.assign(value.footer, source.footer);
    return value;
}
