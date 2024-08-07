export const useToastStore = defineStore('toast', () => {
    const items = ref<ToastItem[]>([]);

    const addToast = (item: ToastItem) => {
        const newToast = { key: Symbol(), ...item };
        items.value.unshift(newToast);
    };
    const removeToast = (index: number) => {
        items.value.splice(index, 1);
    };

    return { items, addToast, removeToast };
});
