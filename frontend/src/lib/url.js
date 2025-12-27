import { API_CONFIG } from './constants';

export const getBackendOrigin = () => {
    // Removes trailing /api or /api/
    return API_CONFIG.BASE_URL.replace(/\/api\/?$/, '');
};

export const resolveFileUrl = (rawUrl) => {
    if (!rawUrl || rawUrl === '#') return null;
    if (/^https?:\/\//i.test(rawUrl)) return rawUrl;

    // If explicitly a relative path from root
    if (rawUrl.startsWith('/')) {
        if (rawUrl.startsWith('/formularios/') || rawUrl.startsWith('/recursos_comunidad/')) return rawUrl;
        return `${getBackendOrigin()}${rawUrl}`;
    }

    // If it's just a filename or relative path without slash, assume it needs backend origin?
    // Usually Django returns /media/... so it starts with /.
    // But if it's 'media/...' without slash:
    return `${getBackendOrigin()}/${rawUrl}`;
};
