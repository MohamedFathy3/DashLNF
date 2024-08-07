export function useCheckPermission(permissions: string[]) {
    if (permissions && permissions.length > 0) {
        const userStore = useUserStore();
        if (userStore.user) {
            const user = userStore.user;
            // If user is a super admin, return true
            if (user.superAdmin) {
                return true;
            }
            // Check if any of the given permissions are in user.role.permissions
            if (user.role && user.role.permissions) {
                return permissions.some((permission) => user.role.permissions.includes(permission));
            }
            // Default to false if none of the conditions are met
            return false;
        }
        return false;
    }
    return true;
}
