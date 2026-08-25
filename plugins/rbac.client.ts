import { permissionCandidates, routeResourceFromPath } from '~/utils/rbac';
import { pagePermissionCandidates, sitePageForPath } from '~/utils/page-permissions';

export default defineNuxtPlugin((nuxtApp) => {
    const userStore = useUserStore();
    const elements = new Set<HTMLElement>();

    const resolveBinding = (el: HTMLElement, binding: any) => {
        const value = binding.value;
        const route = nuxtApp.$router.currentRoute.value;
        const resource = typeof value === 'object' && value !== null ? value.resource : (route.meta.resource ?? routeResourceFromPath(route.path));
        const action = typeof value === 'object' && value !== null ? value.action : value;
        const page = sitePageForPath(route.path);
        const candidates = page && action ? pagePermissionCandidates(page, action) : resource && action ? permissionCandidates(resource, action) : [];
        const allowed = candidates.length > 0 && useCheckPermission(candidates);

        el.dataset.rbacBound = 'true';
        el.dataset.rbacResource = resource ?? '';
        el.dataset.rbacAction = action ?? '';
        el.hidden = !allowed;
    };

    const updateAll = () => {
        elements.forEach((el) => {
            const resource = el.dataset.rbacResource;
            const action = el.dataset.rbacAction;
            const route = nuxtApp.$router.currentRoute.value;
            const page = sitePageForPath(route.path);
            const allowed = resource && action ? useCheckPermission(page ? pagePermissionCandidates(page, action) : permissionCandidates(resource, action)) : false;
            el.hidden = !allowed;
        });
    };

    nuxtApp.vueApp.directive('rbac', {
        mounted(el, binding) {
            elements.add(el);
            resolveBinding(el, binding);
        },
        updated(el, binding) {
            elements.add(el);
            resolveBinding(el, binding);
        },
        unmounted(el) {
            elements.delete(el);
        },
    });

    watch(() => userStore.user, updateAll, { deep: true });
});
