export default defineNuxtRouteMiddleware(async (to, from) => {
    const userStore = useUserStore();
    await userStore.fetchAuthUser();
    if (userStore.user || userStore.token) {
        return navigateTo('/');
    }
});
