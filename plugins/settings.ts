export default defineNuxtPlugin(async (nuxtApp) => {
    const settings = useSettingsStore();
    await settings.fetchSetting();

    const resources = useResourceStore();
    await resources.fetchResources();
});
