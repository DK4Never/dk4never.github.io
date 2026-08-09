export const PACKAGED_ICON_NAMES = [
    'achievements', 'ai', 'android', 'beckhoff', 'calendar', 'csharp', 'docker', 'education', 'email',
    'experience', 'factory', 'flask', 'git', 'github', 'globe', 'javascript', 'linkedin', 'linux',
    'location', 'network', 'phone', 'postgresql', 'profile', 'python', 'server', 'shield', 'siemens',
    'skills', 'sql', 'sqlite', 'summary', 'technology', 'timer', 'typescript', 'user', 'windows'
];
const PACKAGED_ICON_SET = new Set(PACKAGED_ICON_NAMES);
export const isPackagedIconName = (value) => typeof value === 'string' && PACKAGED_ICON_SET.has(value);
const isRemoteUrl = (value) => /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value);
export function resolveAssetUrl(path, baseURI) {
    const normalized = path.replaceAll('\\', '/');
    if (!normalized || normalized.startsWith('/') || isRemoteUrl(normalized) || normalized.startsWith('data:')) {
        throw new Error('Asset paths must be packaged relative assets');
    }
    const segments = normalized.split('/');
    if (segments.includes('..') || segments.some(segment => segment === ''))
        throw new Error('Asset path is not normalized');
    if (!normalized.startsWith('assets/'))
        throw new Error('Asset path is outside the packaged asset directory');
    if (!baseURI && typeof document === 'undefined')
        return normalized;
    return new URL(normalized, baseURI ?? document.baseURI).href;
}
export function resolveIconUrl(path, baseURI) {
    const normalized = path.replaceAll('\\', '/');
    if (!normalized || normalized.startsWith('/') || isRemoteUrl(normalized) || normalized.startsWith('data:')) {
        throw new Error('Icon paths must be packaged relative assets');
    }
    const segments = normalized.split('/');
    if (segments.includes('..') || segments.some(segment => segment === ''))
        throw new Error('Icon path is not normalized');
    if (!normalized.startsWith('icons/'))
        throw new Error('Icon path is outside the packaged icon directory');
    if (!baseURI && typeof document === 'undefined')
        return normalized;
    return new URL(normalized, baseURI ?? document.baseURI).href;
}
export function resolvePortraitSource(path, baseURI) {
    if (/^data:image\/(?:png|jpeg|webp|gif);base64,/i.test(path) && path.length <= 3_500_000)
        return path;
    return resolveAssetUrl(path, baseURI);
}
export const iconAssetPath = (name) => {
    if (!isPackagedIconName(name))
        return 'assets/icons/technology.svg';
    return `assets/icons/${name}.svg`;
};
