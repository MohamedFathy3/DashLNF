import { permissionCandidates, routeResourceFromPath } from '~/utils/rbac';
import { pagePermissionCandidates, sitePageForPath } from '~/utils/page-permissions';

export default defineNuxtRouteMiddleware(async (to) => {
    const explicitPermissions = (to.meta.permissions as string[] | undefined) ?? [];
    const resource = (to.meta.resource as string | undefined) ?? routeResourceFromPath(to.path);
    const page = sitePageForPath(to.path);
    const requiredPermissions = page ? pagePermissionCandidates(page, 'show') : explicitPermissions.length ? explicitPermissions : resource ? permissionCandidates(resource, 'list') : [];
    if (!requiredPermissions.length) return;

    const userStore = useUserStore();
    if (!userStore.user && userStore.token) await userStore.fetchAuthUser();
    if (!userStore.user) return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
    if (userStore.user.superAdmin) return;

    if (!useCheckPermission(requiredPermissions)) {
        return navigateTo('/');
    }
});
