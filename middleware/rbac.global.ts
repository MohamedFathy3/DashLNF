import { permissionCandidates, routeResourceFromPath } from '~/utils/rbac';
import { pagePermissionCandidates, sitePageForPath } from '~/utils/page-permissions';

const nonResourcePaths = new Set(['/', '/login', '/profile', '/settings', '/admins-area', '/master-data', '/members-data', '/website-data', '/events-expos', '/reports']);

export default defineNuxtRouteMiddleware(async (to) => {
    if (nonResourcePaths.has(to.path)) return;
    const routeMiddleware = to.meta.middleware as unknown;
    if (Array.isArray(routeMiddleware) && routeMiddleware.includes('permission')) return;

    const explicitPermissions = (to.meta.permissions as string[] | undefined) ?? [];
    const resource = (to.meta.resource as string | undefined) ?? routeResourceFromPath(to.path);
    const page = sitePageForPath(to.path);
    const requiredPermissions = page ? pagePermissionCandidates(page, 'show') : explicitPermissions.length ? explicitPermissions : resource ? permissionCandidates(resource, 'list') : [];
    if (!requiredPermissions.length) return;

    const userStore = useUserStore();
    if (!userStore.user && userStore.token) await userStore.fetchAuthUser();
    if (!userStore.user) return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
    if (userStore.user.superAdmin) return;

    if (!useCheckPermission(requiredPermissions)) return navigateTo('/');
});
