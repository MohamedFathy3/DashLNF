export default defineNuxtRouteMiddleware(async (to, from) => {
    const userStore = useUserStore();
    if (!userStore.user && userStore.token) {
        await userStore.fetchAuthUser();
    }
    if (!userStore.user || !userStore.token) {
        return navigateTo({ path: '/login', query: { redirect: to.fullPath } });
    }
});
