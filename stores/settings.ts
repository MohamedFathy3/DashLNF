export const useSettingsStore = defineStore('settings', () => {
    const settings = ref<PublicSetting[]>();

    const setSettings = (data?: PublicSetting[]) => {
        settings.value = data;
    };

    const fetchSetting = async () => {
        const { data: res, error } = await useApiFetch('/api/setting-public', {
            lazy: true,
            transform: (res) => (res as ApiResponse).data as Conference,
        });
        if (res.value) {
            setSettings(res.value as PublicSetting[]);
        }
        if (error && error.value) {
            setSettings();
            console.error(error);
        }
    };

    return { settings, setSettings, fetchSetting };
});
