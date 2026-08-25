import { permissionKeys } from '~/utils/rbac';

export function useCheckPermission(permissions?: string | string[]) {
    const requested = Array.isArray(permissions) ? permissions : permissions ? [permissions] : [];
    if (!requested.length) return true;

    const userStore = useUserStore();
    const user = userStore.user;
    if (!user) return false;
    if (user.superAdmin) return true;

    const rolePermissions = user.role?.permissions ?? [];
    const extraPermissions = user.extra_permissions ?? user.extraPermissions ?? [];
    const assignedPermissionKeys = new Set([...rolePermissions, ...extraPermissions].flatMap((permission: any) => permissionKeys(typeof permission === 'string' ? permission : (permission?.slug ?? ''))));

    return requested.some((permission) => permissionKeys(permission).some((key) => assignedPermissionKeys.has(key)));
}

export default useCheckPermission;
