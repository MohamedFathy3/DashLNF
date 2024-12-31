import type { UseFetchOptions } from 'nuxt/app';
export function useApiFetch<T>(path: string, options: UseFetchOptions<T> = {}) {
    let headers: any = {
        accept: 'application/json',
        referer: process.env.APP_URL ?? 'http://dashboard.lnfederation.test:4549',
    };
    const token = useCookie('XSRF-TOKEN');
    if (token.value) {
        headers['X-XSRF-TOKEN'] = token.value as string;
    }
    const userStore = useUserStore();
    const bearerToken = userStore.token; // Assuming you're using localStorage to store the token
    if (bearerToken) {
        headers['Authorization'] = `Bearer ${bearerToken}`;
    }
    if (import.meta.server) {
        headers = {
            ...headers,
            ...useRequestHeaders(['cookie']),
        };
    }
    return useFetch('/backend' + path, {
        credentials: 'include',
        ...options,
        watch: false,
        headers: {
            ...headers,
            ...options?.headers,
        },
        onResponseError({ response }) {
            if (response.status === 401) {
                userStore.setToken();
                userStore.setUser();
                navigateTo('/login');
            }
        },
    });
}
