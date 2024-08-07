export async function useClipboard(text: string) {
    function copyFallback(text: string) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        useToast({
            title: 'Success',
            message: 'Copied successfully to clipboard',
            type: 'success',
            duration: 5000,
        });
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
            .writeText(text)
            .then(() => {
                useToast({
                    title: 'Success',
                    message: 'Copied successfully to clipboard',
                    type: 'success',
                    duration: 5000,
                });
            })
            .catch((err) => {
                useToast({
                    title: 'Error',
                    message: err.message,
                    type: 'error',
                    duration: 5000,
                });
            });
    } else {
        copyFallback(text);
    }
}
