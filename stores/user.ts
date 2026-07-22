import type { LocationQueryValue } from 'vue-router';

export const useUserStore = defineStore('user', () => {
    const user = ref<Admin>();

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
            console.log('✅ Token stored in cookie:', data.substring(0, 20) + '...');
        } else {
            token.value = null;
            console.log('🗑️ Token removed from cookie');
        }
    };

    const setUser = (data?: Admin) => {
        user.value = data;
    };

    const login = async (data: Credentials, path?: LocationQueryValue) => {
        try {
            console.log('📝 Attempting login...');

            // 1. جلب CSRF cookie
            await useApiFetch('/sanctum/csrf-cookie');

            // 2. تسجيل الدخول
            const { data: userData, error } = await useApiFetch(`/api/admin/login`, {
                method: 'POST',
                body: data,
            });

            if (userData.value) {
                const responseData = userData.value as ApiResponse;
                setUser(responseData.data as Admin);

                // 👈 الأهم هنا: خزن التوكن من الـ response في الكوكيز
                if (responseData.token) {
                    setToken(responseData.token);

                    // تحقق أن التوكن اتحط في الكوكيز
                    if (process.client) {
                        console.log('🍪 All cookies after login:', document.cookie);
                    }
                }

                // التوجيه بعد النجاح
                if (path) {
                    navigateTo(path);
                } else {
                    navigateTo('/');
                }

                useToast({
                    title: 'Welcome',
                    message: 'Logged in Successfully',
                    type: 'success',
                    duration: 5000,
                });
            }

            if (error.value) {
                throw new Error(error.value.data?.message || 'Login failed');
            }
        } catch (error: any) {
            console.error('❌ Login error:', error);
            useToast({
                title: 'Error',
                message: error.message || 'Login failed',
                type: 'error',
                duration: 5000,
            });
        }
    };

    const fetchAuthUser = async () => {
        // 👈 تحقق من وجود التوكن في الكوكيز
        if (!token.value) {
            console.log('❌ No token in cookies');
            return false;
        }

        console.log('🔍 Fetching user with token:', token.value.substring(0, 20) + '...');

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
                console.log('✅ User fetched successfully');

                // جدد التوكن في الكوكيز (لو السيرفر بعت توكن جديد)
                if (process.client) {
                    const newToken = useCookie('LNF_ADMIN_AUTH_TOKEN').value;
                    if (newToken && newToken !== token.value) {
                        token.value = newToken;
                        console.log('🔄 Token refreshed in cookie');
                    }
                }

                return true;
            }

            if (error.value) {
                console.error('❌ Error fetching user:', error.value);

                // لو الـ error 401، امسح التوكن من الكوكيز
                if (error.value.status === 401) {
                    console.log('🔴 Token invalid or expired');
                    setToken(); // مسح التوكن من الكوكيز
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
        setToken,
        checkToken,
    };
});
