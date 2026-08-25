export function useCheckPermission(permissions?: string | string[]) {
    const requested = Array.isArray(permissions) ? permissions : permissions ? [permissions] : [];
    if (!requested.length) return true;

    const userStore = useUserStore();
    const user = userStore.user;
    if (!user) return false;
    if (user.superAdmin) return true;

    const rolePermissions = user.role?.permissions ?? [];
    const extraPermissions = user.extra_permissions ?? user.extraPermissions ?? [];
    const assignedPermissions = [...rolePermissions, ...extraPermissions].map((permission: any) => (typeof permission === 'string' ? permission : permission?.slug));

    return requested.some((permission) => assignedPermissions.includes(permission));
}

export default useCheckPermission;
