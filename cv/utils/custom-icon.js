export const MAX_CUSTOM_SVG_BYTES = 256 * 1024;
export const MAX_CUSTOM_RASTER_BYTES = 1 * 1024 * 1024;
const DATA_URL_PATTERN = /^data:(image\/svg\+xml|image\/png|image\/webp);base64,([A-Za-z0-9+/=\s]+)$/i;
const UNSAFE_SVG = /<\/?(?:script|foreignObject|iframe|object|embed|font)\b|\bon[a-z][\w:-]*\s*=|javascript\s*:|(?:xlink:)?href\s*=\s*["'](?!#)|<\!DOCTYPE|<\!ENTITY|@(?:import|font-face)|url\(\s*["']?(?:https?:|data:|\/\/)/i;
const decodeBase64 = (value) => {
    const binary = typeof atob === 'function' ? atob(value) : '';
    if (!binary)
        throw new Error('Icon data is not valid base64');
    return Uint8Array.from(binary, character => character.charCodeAt(0));
};
const encodeBase64 = (value) => {
    let binary = '';
    for (const byte of value)
        binary += String.fromCharCode(byte);
    return btoa(binary);
};
const utf8 = (value) => new TextDecoder().decode(value);
const validRasterSignature = (mime, bytes) => {
    if (mime === 'image/png')
        return bytes.length >= 8 && bytes.slice(0, 8).every((byte, index) => byte === [137, 80, 78, 71, 13, 10, 26, 10][index]);
    return mime === 'image/webp' && bytes.length >= 12 && utf8(bytes.slice(0, 4)) === 'RIFF' && utf8(bytes.slice(8, 12)) === 'WEBP';
};
export function validateCustomIconData(value) {
    if (typeof value !== 'string' || value.length > 1_500_000)
        throw new Error('Custom icon data is missing or too large');
    const match = DATA_URL_PATTERN.exec(value);
    if (!match)
        throw new Error('Custom icon must be a base64 SVG, PNG or WebP data URL');
    const mime = match[1].toLowerCase();
    const bytes = decodeBase64(match[2].replaceAll(/\s/g, ''));
    if (mime === 'image/svg+xml') {
        if (bytes.byteLength > MAX_CUSTOM_SVG_BYTES)
            throw new Error('SVG icon exceeds the 256 KB limit');
        const source = utf8(bytes);
        if (!/<svg\b/i.test(source) || UNSAFE_SVG.test(source))
            throw new Error('SVG icon contains unsafe markup');
        return { dataUrl: `data:${mime};base64,${encodeBase64(new TextEncoder().encode(source))}`, mime, kind: 'svg', bytes: bytes.byteLength };
    }
    if (bytes.byteLength > MAX_CUSTOM_RASTER_BYTES || !validRasterSignature(mime, bytes))
        throw new Error('Raster icon signature or size is invalid');
    return { dataUrl: `data:${mime};base64,${encodeBase64(bytes)}`, mime, kind: mime === 'image/png' ? 'png' : 'webp', bytes: bytes.byteLength };
}
export const isSafeCustomIconData = (value) => {
    try {
        validateCustomIconData(value);
        return true;
    }
    catch {
        return false;
    }
};
