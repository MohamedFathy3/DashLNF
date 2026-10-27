import type { LocationQueryValue } from 'vue-router';

export const useUserStore = defineStore('user', () => {
    const user = ref<Admin>();
    const getUserId = computed(() => user.value?.user_id ?? null);
    const isSuperAdmin = computed(() => user.value?.superAdmin === true);

    // 👇 تعريف الكوكيز - بس دول
    const token = useCookie('LNF_ADMIN_AUTH_TOKEN', {
        maxAge: 60 * 60 * 24 * 7, // 7 أيام (أسبوع)
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        domain: process.env.NODE_ENV === 'production' ? '.lnfederation.com' : '',
        // 👇 الأوبشنز دي بتضمن إن الكوكيز تشتغل مع كل الطلبات
        httpOnly: false, // عشان نقدر نقراها من JavaScript
    });

    // 👇 CSRF Token برضه في كوكيز
    const xsrfToken = useCookie('XSRF-TOKEN', {
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        domain: process.env.NODE_ENV === 'production' ? '.lnfederation.com' : '',
    });

    // دوال بسيطة للتعامل مع الكوكيز
    const setToken = (data?: string) => {
        if (data) {
            token.value = data;
        } else {
            token.value = null;
        }
    };

    const setUser = (data?: Admin) => {
        user.value = data;
    };

    const login = async (data: Credentials, path?: LocationQueryValue) => {
        try {
            await useApiFetch('/sanctum/csrf-cookie');

            const { data: userData, error } = await useApiFetch(`/api/admin/login`, {
                method: 'POST',
                body: data,
            });

            if (error.value) {
                throw new Error(error.value.data?.message || 'Login failed');
            }
            if (!userData.value) {
                throw new Error('Login failed: no response from the server');
            }

            const responseData = userData.value as ApiResponse;
            if (!responseData.token) {
                throw new Error('Login failed: the server did not return an authentication token');
            }

            setToken(responseData.token);
            setUser();

            if (!(await fetchAuthUser())) {
                setToken();
                setUser();
                throw new Error('Unable to load your account permissions');
            }

            await navigateTo(path || '/');

            useToast({
                title: 'Welcome',
                message: 'Logged in Successfully',
                type: 'success',
                duration: 5000,
            });
        } catch (error: any) {
            console.error('Login error:', error);
            useToast({
                title: 'Error',
                message: error.message || 'Login failed',
                type: 'error',
                duration: 5000,
            });
        }
    };

    const fetchAuthUser = async () => {
        if (!token.value) {
            return false;
        }

        try {
            // CSRF للـ Sanctum
            await useApiFetch('/sanctum/csrf-cookie');

            const { data: res, error } = await useApiFetch(`/api/get-admin`, {
                method: 'GET',
                headers: {
                    // 👈 إرسال التوكن من الكوكيز في الهيدر
                    Authorization: `Bearer ${token.value}`,
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'application/json',
                },
                transform: (res) => (res as ApiResponse).data as Admin,
            });

            if (res.value) {
                setUser(res.value as Admin);

                if (process.client) {
                    const newToken = useCookie('LNF_ADMIN_AUTH_TOKEN').value;
                    if (newToken && newToken !== token.value) {
                        token.value = newToken;
                    }
                }

                return true;
            }

            if (error.value) {
                console.error('❌ Error fetching user:', error.value);

                if (error.value.status === 401) {
                    setToken();
                    await logout();
                }
                return false;
            }
        } catch (error) {
            console.error('❌ Error in fetchAuthUser:', error);
            return false;
        }
    };

    const logout = async () => {
        try {
            console.log('🚪 Logging out...');

            // حاول تعمل logout لو التوكن موجود
            if (token.value) {
                await useApiFetch('/api/admin-logout', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token.value}`,
                        'X-Requested-With': 'XMLHttpRequest',
                        Accept: 'application/json',
                    },
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // 👈 مهم جداً: امسح التوكن من الكوكيز
            setToken(); // مسح التوكن
            setUser(); // مسح اليوزر

            // امسح كل الكوكيز المتعلقة بالموقع
            if (process.client) {
                // مسح كل الكوكيز
                document.cookie.split(';').forEach((c) => {
                    document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + window.location.hostname);
                });

                console.log('🍪 All cookies cleared');
            }

            navigateTo('/login');
        }
    };

    // 👈 دالة للتحقق من التوكن
    const checkToken = () => {
        if (!token.value) {
            return { valid: false, reason: 'no_token' };
        }

        // اختياري: تحقق من تاريخ انتهاء التوكن لو كان JWT
        try {
            const parts = token.value.split('.');
            if (parts.length === 3) {
                // JWT
                const payload = JSON.parse(atob(parts[1]));
                if (payload.exp && payload.exp * 1000 < Date.now()) {
                    return { valid: false, reason: 'expired' };
                }
            }
        } catch (e) {
            // مش JWT، عادي
        }

        return { valid: true, token: token.value };
    };

    return {
        user,
        token, // التوكين من الكوكيز
        logout,
        login,
        fetchAuthUser,
        setUser,
        getUserId,
        isSuperAdmin,
        setToken,
        checkToken,
    };
});
