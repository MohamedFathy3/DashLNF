export function useCheckUrl(url: string) {
    // Check if the URL starts with http:// or https://
    if (url.startsWith('http://') || url.startsWith('https://')) {
        // If yes, return the URL as it is
        return url;
    } else {
        // If not, prepend https:// and return the modified URL
        return `http://${url}`;
    }
}
