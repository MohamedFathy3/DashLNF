import type { UseFetchOptions } from 'nuxt/app';
export function useApiFetch<T>(path: string, options: UseFetchOptions<T> = {}) {
    let headers: any = {
        accept: 'application/json',
        referer: process.env.APP_URL ?? 'http://dashboard.wsa.test:4549',
    };
    const token = useCookie('XSRF-TOKEN');
    const conferenceId = useCookie('LNF_CURRENT_CONFERENCE_ID');
    if (token.value) {
        headers['X-XSRF-TOKEN'] = token.value as string;
    }
    const userStore = useUserStore();
    const settings = useSettingsStore();
    const bearerToken = userStore.token; // Assuming you're using localStorage to store the token
    const networkId = settings.networkId;
    if (bearerToken) {
        headers['Authorization'] = `Bearer ${bearerToken}`;
    }
    if (networkId) {
        headers['X-Network-Id'] = networkId;
    }
    if (conferenceId) {
        headers['X-Conference-Id'] = conferenceId;
    }
    if (process.server) {
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
