export function getApiUrl(path) {
    // Falls back to empty string if env variable is surprisingly missing
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';

    // Ensure `path` starts with a slash
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    return `${baseUrl}${normalizedPath}`;
}
