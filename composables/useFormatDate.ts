export function useFormatDate(dateString: string) {
    if (!dateString) return '';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        console.error('Error formatting date: Invalid date');
        return dateString; // Fallback to the original string
    }

    const options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    };

    return date.toLocaleDateString('en-GB', options);
}
