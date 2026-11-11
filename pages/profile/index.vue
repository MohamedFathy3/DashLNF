<script lang="ts" setup>
definePageMeta({
    middleware: 'auth',
});

const userStore = useUserStore();
const profile = reactive({
    name: userStore.user?.name ?? '',
    email: userStore.user?.email ?? '',
});
const password = reactive({
    value: '',
    confirmation: '',
});
const saving = ref(false);
const passwordSaving = ref(false);
const permissions = computed(() => {
    const allPermissions = [...(userStore.user?.role?.permissions ?? []), ...(userStore.user?.extra_permissions ?? userStore.user?.extraPermissions ?? [])];
    return [...new Map(allPermissions.map((permission) => [permission.id, permission])).values()];
});

watch(
    () => userStore.user,
    (user) => {
        if (user) {
            profile.name = user.name;
            profile.email = user.email;
        }
    },
);

async function updateProfile() {
    const user = userStore.user;
    if (!user || !profile.name.trim() || !profile.email.trim()) {
        useToast({ title: 'Error', message: 'Name and email are required.', type: 'error', duration: 5000 });
        return;
    }

    saving.value = true;
    try {
        const { data, error } = await useApiFetch(`/api/admin/${user.id}`, {
            method: 'PATCH',
            body: {
                name: profile.name.trim(),
                email: profile.email.trim(),
            },
        });

        if (error.value) {
            useToast({ title: 'Error', message: error.value.data?.message ?? error.value.message, type: 'error', duration: 5000 });
            return;
        }
        if (!data.value) {
            useToast({ title: 'Error', message: 'The server did not confirm the profile update.', type: 'error', duration: 5000 });
            return;
        }

        userStore.setUser({
            ...user,
            name: profile.name.trim(),
            email: profile.email.trim(),
        });
        useToast({ title: 'Success', message: data.value?.message ?? 'Profile updated successfully.', type: 'success', duration: 5000 });
    } catch (error) {
        useToast({
            title: 'Error',
            message: error instanceof Error ? error.message : 'Unable to update your profile.',
            type: 'error',
            duration: 5000,
        });
    } finally {
        saving.value = false;
    }
}

async function updatePassword() {
    const user = userStore.user;
    if (!user || !password.value) {
        useToast({ title: 'Error', message: 'Enter a new password.', type: 'error', duration: 5000 });
        return;
    }
    if (password.value !== password.confirmation) {
        useToast({ title: 'Error', message: 'The passwords do not match.', type: 'error', duration: 5000 });
        return;
    }

    passwordSaving.value = true;
    try {
        const { data, error } = await useApiFetch(`/api/admin/${user.id}`, {
            method: 'PATCH',
            body: {
                name: user.name,
                email: user.email,
                password: password.value,
            },
        });

        if (error.value) {
            useToast({ title: 'Error', message: error.value.data?.message ?? error.value.message, type: 'error', duration: 5000 });
            return;
        }
        if (!data.value) {
            useToast({ title: 'Error', message: 'The server did not confirm the password update.', type: 'error', duration: 5000 });
            return;
        }

        password.value = '';
        password.confirmation = '';
        useToast({ title: 'Success', message: data.value?.message ?? 'Password updated successfully.', type: 'success', duration: 5000 });
    } catch (error) {
        useToast({
            title: 'Error',
            message: error instanceof Error ? error.message : 'Unable to update your password.',
            type: 'error',
            duration: 5000,
        });
    } finally {
        passwordSaving.value = false;
    }
}
</script>

<template>
    <div class="intro-y">
        <div class="mb-6">
            <h1 class="text-2xl font-semibold">My Profile</h1>
            <p class="mt-1 text-slate-500">View your account details and update your personal information.</p>
        </div>

        <form class="box mb-6 w-full p-5" @submit.prevent="updateProfile">
            <section>
                <h2 class="mb-5 text-lg font-medium">Personal information</h2>
                <div class="space-y-5">
                    <FormInputField v-model="profile.name" label="Name" name="name" autocomplete="name" required />
                    <FormInputField v-model="profile.email" label="Email" name="email" type="email" autocomplete="email" required />
                    <div class="flex justify-end">
                        <button class="btn btn-primary" type="submit" :disabled="saving">
                            {{ saving ? 'Saving...' : 'Save changes' }}
                        </button>
                    </div>
                </div>
            </section>
        </form>

        <form class="box mb-6 w-full p-5" @submit.prevent="updatePassword">
            <section>
                <h2 class="mb-5 text-lg font-medium">Change password</h2>
                <div class="space-y-5">
                    <FormInputField v-model="password.value" label="New password" name="new-password" type="password" autocomplete="new-password" required />
                    <FormInputField v-model="password.confirmation" label="Confirm new password" name="confirm-new-password" type="password" autocomplete="new-password" required />
                    <div class="flex justify-end">
                        <button class="btn btn-primary" type="submit" :disabled="passwordSaving">
                            {{ passwordSaving ? 'Updating...' : 'Update password' }}
                        </button>
                    </div>
                </div>
            </section>
        </form>

      
    </div>
</template>
