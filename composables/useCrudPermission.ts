import { permissionCandidates, permissionKeys, permissionSlug, type RbacAction } from '~/utils/rbac';

export const useCrudPermission = (resource: string, action: RbacAction | string) => {
    const candidates = permissionCandidates(resource, action);
    if (!candidates.length) return false;
    return useCheckPermission(candidates);
};

export const useResourcePermissions = (resource: string) => ({
    list: useCrudPermission(resource, 'list'),
    create: useCrudPermission(resource, 'create'),
    edit: useCrudPermission(resource, 'edit'),
    delete: useCrudPermission(resource, 'delete'),
    restore: useCrudPermission(resource, 'restore'),
    forceDelete: useCrudPermission(resource, 'force-delete'),
    slug: (action: RbacAction | string) => permissionSlug(resource, action),
});

export const hasPermissionSlug = (assignedPermissions: unknown[], requested: string | string[]) => {
    const assigned = new Set(assignedPermissions.flatMap((permission: any) => permissionKeys(typeof permission === 'string' ? permission : (permission?.slug ?? ''))));
    const requestedList = Array.isArray(requested) ? requested : [requested];
    return requestedList.some((permission) => permissionKeys(permission).some((key) => assigned.has(key)));
};
