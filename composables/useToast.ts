export const useToast = (item: ToastItem) => {
    const toastStore = useToastStore();
    toastStore.addToast(item);
};
