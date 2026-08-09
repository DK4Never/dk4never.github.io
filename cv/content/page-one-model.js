import { isPackagedIconName } from '../utils/asset-url.js';
import { isSafeCustomIconData } from '../utils/custom-icon.js';
const OFFICIAL_TECHNOLOGY_MARKS = ['python'];
export const technologyMarkNames = (name) => {
    const value = name.toLowerCase();
    return OFFICIAL_TECHNOLOGY_MARKS.filter(mark => new RegExp(`\\b${mark}\\b`, 'i').test(value));
};
export const officialTechnologyMarkAssetPath = (mark) => `assets/technology/official/${mark}.svg`;
const emptyDocument = {
    version: 2,
    theme: 'red',
    mapSlogan: 'KNOWLEDGE COMES,\nBUT WISDOM LINGERS.',
    portrait: { src: 'assets/dean-profile-master.webp', x: 50, y: 18, scale: 1 },
    sections: { contact: true, profile: true, skills: true, technology: true, summary: true, experience: true, systems: true },
    masthead: {
        kicker: 'SYSTEMS / SOFTWARE / INFRASTRUCTURE',
        first: 'DEAN',
        last: 'KRUGER',
        role: 'SYSTEMS ENGINEER',
        subrole: 'SOFTWARE / INFRASTRUCTURE / INTEGRATION'
    },
    hero: {
        quote: 'SYSTEMS / SOFTWARE / INFRASTRUCTURE',
        quoteAuthor: 'LEGEND SYSTEMS',
        status: 'PAGE ONE / PROJECTED CONTENT',
        statusMeta: 'EDITABLE / A4 / STATIC'
    },
    brand: { name: 'LEGEND', type: 'SYSTEMS' },
    contact: {
        title: 'Contact', location: '', phone: '', phoneHref: '', email: '', emailHref: '', site: '', siteHref: '',
        github: '', githubHref: '', linkedin: '', linkedinHref: ''
    },
    profile: { title: 'Education & Languages', paragraphs: [] },
    skills: { title: 'Core Skills', items: [] },
    technology: { title: 'Technology Stack', items: [] },
    capabilities: [],
    summary: { title: 'Professional Summary', paragraphs: [], graphic: 'DATA / SYSTEMS / FLOW' },
    experience: { title: 'Professional Experience', items: [] },
    systems: { title: 'Selected Systems & Outcomes', items: [] },
    footer: { motto: 'DISCIPLINE · DEDICATION · INNOVATION · IMPACT', subtitle: 'Building intelligent systems that solve real-world problems.' }
};
export const createDefaultDocument = () => structuredClone(emptyDocument);
const PROTOTYPE_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
const MAX_TEXT = 2_000;
const asText = (value, fallback, limit = MAX_TEXT) => typeof value === 'string' && value.length <= limit ? value : fallback;
const asBool = (value, fallback) => typeof value === 'boolean' ? value : fallback;
const asNumber = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const asLevel = (value, fallback) => Math.max(1, Math.min(10, asNumber(value, fallback)));
const asTextArray = (value, limit = 3) => Array.isArray(value)
    ? value.filter(item => typeof item === 'string' && item.length <= MAX_TEXT).slice(0, limit)
    : [];
const containsPrototypeKey = (value) => {
    if (!value || typeof value !== 'object')
        return false;
    if (Array.isArray(value))
        return value.some(containsPrototypeKey);
    if (Object.getPrototypeOf(value) !== Object.prototype)
        return true;
    return Object.entries(value).some(([key, item]) => PROTOTYPE_KEYS.has(key) || containsPrototypeKey(item));
};
const safeLink = (value, fallback) => {
    if (typeof value !== 'string' || value.length > 500)
        return fallback;
    if (/^(?:https?:\/\/|tel:|mailto:)/i.test(value) && !/[\s<>"']/.test(value))
        return value;
    return fallback;
};
const safePortrait = (value, fallback) => {
    if (typeof value !== 'string' || value.length > 3_500_000)
        return fallback;
    if (/^data:image\/(?:png|jpeg|webp|gif);base64,/i.test(value))
        return value;
    return /^assets\/[a-z0-9._/-]+$/i.test(value) && !value.includes('..') ? value : fallback;
};
const safeIcon = (value, fallback) => isPackagedIconName(value) ? value : fallback;
const safeHex = (value) => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value.toUpperCase() : null;
const safeIconRef = (value) => typeof value === 'string' && /^[a-z0-9][a-z0-9._-]*\.(?:svg|png|webp)$/i.test(value) ? value : undefined;
const safeTechnology = (item) => {
    const technology = {
        id: typeof item.id === 'string' && /^[a-z0-9][a-z0-9-]{0,63}$/i.test(item.id) ? item.id : undefined,
        name: asText(item.name, 'Technology', 160),
        icon: safeIcon(item.icon, 'technology'),
        iconMode: item.iconMode === 'custom' ? 'custom' : 'built-in',
        iconRef: safeIconRef(item.iconRef),
        colorMode: item.colorMode === 'original' ? 'original' : 'accent'
    };
    if (isSafeCustomIconData(item.customIconData))
        technology.customIconData = item.customIconData;
    else if (item.customIconData !== undefined)
        technology.iconMode = 'built-in';
    if (technology.iconMode === 'custom' && !technology.customIconData)
        technology.iconMode = 'built-in';
    return technology;
};
const safeStringRecord = (source, target, keys) => {
    if (!source || typeof source !== 'object' || Array.isArray(source))
        return;
    const input = source;
    for (const key of keys)
        target[key] = asText(input[String(key)], target[key]);
};
export function normaliseDocument(input, fallbackDocument = createDefaultDocument()) {
    const base = structuredClone(fallbackDocument);
    if (!input || typeof input !== 'object' || containsPrototypeKey(input))
        return base;
    const source = input;
    if (source.theme === 'blue' || source.theme === 'gold' || source.theme === 'red')
        base.theme = source.theme;
    if (typeof source.mapSlogan === 'string' && source.mapSlogan.length <= 240 && !/[<>]/.test(source.mapSlogan))
        base.mapSlogan = source.mapSlogan;
    if (source.accent && typeof source.accent === 'object') {
        const hex = safeHex(source.accent.hex);
        if (source.accent.mode === 'custom' && hex)
            base.accent = { mode: 'custom', hex };
        else if (source.accent.mode === 'theme')
            base.accent = { mode: 'theme', hex: '' };
    }
    if (source.portrait && typeof source.portrait === 'object') {
        base.portrait.src = safePortrait(source.portrait.src, base.portrait.src);
        base.portrait.x = Math.max(0, Math.min(100, asNumber(source.portrait.x, base.portrait.x)));
        base.portrait.y = Math.max(0, Math.min(100, asNumber(source.portrait.y, base.portrait.y)));
        base.portrait.scale = Math.max(.7, Math.min(1.8, asNumber(source.portrait.scale, base.portrait.scale)));
    }
    if (source.sections && typeof source.sections === 'object') {
        for (const key of Object.keys(base.sections)) {
            base.sections[key] = asBool(source.sections[key], base.sections[key]);
        }
    }
    if (source.masthead)
        safeStringRecord(source.masthead, base.masthead, ['kicker', 'first', 'last', 'role', 'subrole']);
    if (source.hero)
        safeStringRecord(source.hero, base.hero, ['quote', 'quoteAuthor', 'status', 'statusMeta']);
    if (source.brand)
        safeStringRecord(source.brand, base.brand, ['name', 'type']);
    if (source.contact && typeof source.contact === 'object') {
        safeStringRecord(source.contact, base.contact, ['title', 'location', 'phone', 'email', 'site', 'github', 'linkedin']);
        base.contact.phoneHref = safeLink(source.contact.phoneHref, base.contact.phoneHref);
        base.contact.emailHref = safeLink(source.contact.emailHref, base.contact.emailHref);
        base.contact.siteHref = safeLink(source.contact.siteHref, base.contact.siteHref);
        base.contact.githubHref = safeLink(source.contact.githubHref, base.contact.githubHref);
        base.contact.linkedinHref = safeLink(source.contact.linkedinHref, base.contact.linkedinHref);
    }
    if (source.profile && typeof source.profile === 'object') {
        base.profile.title = asText(source.profile.title, base.profile.title);
        const paragraphs = asTextArray(source.profile.paragraphs);
        if (paragraphs.length)
            base.profile.paragraphs = paragraphs;
    }
    if (source.skills && Array.isArray(source.skills.items)) {
        base.skills.items = source.skills.items.slice(0, 12).filter(item => item && typeof item === 'object').map(item => ({
            name: asText(item.name, 'Skill', 160), level: asLevel(item.level, 5), classification: asText(item.classification, '')
        }));
    }
    if (source.technology && Array.isArray(source.technology.items)) {
        base.technology.items = source.technology.items.slice(0, 24).filter(item => item && typeof item === 'object').map(item => safeTechnology(item));
    }
    if (Array.isArray(source.capabilities)) {
        base.capabilities = source.capabilities.slice(0, 6).filter(item => item && typeof item === 'object').map(item => ({
            icon: safeIcon(item.icon, 'technology'), label: asText(item.label, 'Capability', 120)
        }));
    }
    if (source.summary && typeof source.summary === 'object') {
        base.summary.title = asText(source.summary.title, base.summary.title);
        base.summary.graphic = asText(source.summary.graphic, base.summary.graphic, 160);
        const paragraphs = asTextArray(source.summary.paragraphs);
        if (paragraphs.length)
            base.summary.paragraphs = paragraphs;
    }
    if (source.experience && Array.isArray(source.experience.items)) {
        base.experience.items = source.experience.items.slice(0, 8).filter(item => item && typeof item === 'object').map(item => ({
            job: asText(item.job, 'Role'), company: asText(item.company, 'Organisation'), location: asText(item.location, ''),
            period: asText(item.period, 'Selected work', 160), description: asText(item.description, 'Technical work and project delivery.'),
            bullets: asTextArray(item.bullets, 3)
        }));
    }
    if (source.systems && Array.isArray(source.systems.items)) {
        base.systems.items = source.systems.items.slice(0, 6).filter(item => item && typeof item === 'object').map(item => ({
            icon: safeIcon(item.icon, 'server'), title: asText(item.title, 'System', 160), copy: asText(item.copy, 'Selected engineering work.')
        }));
    }
    if (source.footer)
        safeStringRecord(source.footer, base.footer, ['motto', 'subtitle']);
    return base;
}
export const hasPrototypeSensitiveKeys = containsPrototypeKey;
