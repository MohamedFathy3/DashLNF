export const useToggleSwitch = async (id: number, column: string, model: string) => {
    const { data, error } = await useApiFetch(`/api/${model}/${id}/${column}`, {
        method: 'PUT',
        lazy: true,
    });
    if (data.value) {
        useToast({ title: 'Success', message: 'Status Changed Successfully', type: 'success', duration: 5000 });
    }
    if (error && error.value) {
        console.error(error);
        useToast({ title: 'Error', message: error.value.message, type: 'error', duration: 5000 });
    }
};
