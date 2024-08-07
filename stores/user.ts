import type { LocationQueryValue } from 'vue-router';

export const useUserStore = defineStore('user', () => {
    const user = ref<Admin>();
    const token = useCookie('LNF_ADMIN_AUTH_TOKEN', { maxAge: 60 * 60 * 2 });

    const setToken = (data?: string) => (token.value = data);
    const setUser = (data?: Admin) => (user.value = data);

    const login = async (data: Credentials, path?: LocationQueryValue) => {
        await useApiFetch('/sanctum/csrf-cookie');
        const { data: userData, error } = await useApiFetch(`/api/admin/login`, {
            method: 'POST',
            body: data,
            lazy: true,
        });
        if (userData.value) {
            setUser((userData.value as ApiResponse).data as Admin);
            setToken((userData.value as ApiResponse).token as string);
            console.log(path);
            if (path) {
                navigateTo(path);
            } else {
                navigateTo('/');
            }
            useToast({ title: 'Welcome', message: 'Logged in Successfully', type: 'success', duration: 5000 });
        }
        if (error.value) {
            const message = error.value.data.message;
            useToast({ title: 'Error', message: message, type: 'error', duration: 5000 });
        }
    };

    const fetchAuthUser = async () => {
        const { data: res, error } = await useApiFetch(`/api/get-admin`, {
            lazy: true,
            transform: (res) => (res as ApiResponse).data as Admin,
        });
        if (res.value) {
            setUser(res.value as Admin);
        }
        if (error && error.value) {
            setUser();
            await logout();
            console.error(error);
        }
    };

    const logout = async () => {
        await useApiFetch('/api/admin-logout', { method: 'POST' });
        setToken();
        setUser();
        navigateTo('/login');
    };

    return {
        user,
        token,
        logout,
        login,
        fetchAuthUser,
        setUser,
        setToken,
    };
});
