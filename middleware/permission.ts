export default defineNuxtRouteMiddleware(async (to) => {
    const requiredPermissions = (to.meta.permissions as string[] | undefined) ?? [];
    if (!requiredPermissions.length) return;

    const userStore = useUserStore();
    if (!userStore.user && userStore.token) await userStore.fetchAuthUser();
    if (!userStore.user) return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
    if (userStore.user.superAdmin) return;

    if (!useCheckPermission(requiredPermissions)) {
        return navigateTo('/');
    }
});
