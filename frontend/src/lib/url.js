import { API_CONFIG } from './constants';

export const getBackendOrigin = () => {
    // Removes trailing /api or /api/
    return API_CONFIG.BASE_URL.replace(/\/api\/?$/, '');
};

export const resolveFileUrl = (rawUrl) => {
    if (!rawUrl || rawUrl === '#') return null;
    // Already absolute URL
    if (/^https?:\/\//i.test(rawUrl)) return rawUrl;
    // Blob URLs from demo file uploads (session-only)
    if (rawUrl.startsWith('blob:')) return rawUrl;

    // If explicitly a relative path from root
    if (rawUrl.startsWith('/')) {
        // Paths served directly by Vite's public folder - passthrough
        if (rawUrl.startsWith('/formularios/') || rawUrl.startsWith('/recursos_comunidad/') || rawUrl.startsWith('/data/')) {
            return rawUrl;
        }
        // Django media/static paths - prepend backend origin
        return `${getBackendOrigin()}${rawUrl}`;
    }

    // If it's just a filename or relative path without slash
    return `${getBackendOrigin()}/${rawUrl}`;
};
