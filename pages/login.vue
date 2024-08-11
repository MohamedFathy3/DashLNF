<script setup>
definePageMeta({
    layout: false,
    middleware: 'guest',
});
const credentials = ref({
    email: null,
    password: null,
});
const userStore = useUserStore();

const route = useRoute();
const redirectPath = route.query?.redirect;
async function login() {
    await userStore.login(credentials.value, redirectPath);
}
</script>
<template>
    <div class="container relative">
        <ToastList />
        <div class="w-full min-h-screen p-5 md:p-20 flex items-center justify-center">
            <div class="w-96 intro-y">
                <div class="text-white text-4xl font-extrabold text-center">LNF <span class="font-medium opacity-75">Dashboard</span></div>
                <form @submit.prevent="login">
                    <div
                        class="!rounded-3xl box px-5 py-8 mt-4 max-w-[450px] relative before:content-[''] before:z-[-1] before:w-[95%] before:h-full before:bg-slate-200/65 before:border before:border-slate-200/25 before:-mt-5 before:absolute before:rounded-2xl before:mx-auto before:inset-x-0 before:dark:bg-darkmode-600/70 before:dark:border-darkmode-500/60"
                    >
                        <div class="flex flex-col gap-5">
                            <FormInputField v-model="credentials.email" icon="solar:user-circle-linear" name="email" placeholder="Email" rounded type="email" />
                            <FormInputField v-model="credentials.password" icon="solar:password-minimalistic-input-linear" name="password" placeholder="Password" rounded type="password" />
                        </div>
                        <div class="mt-5 xl:mt-8 text-center xl:text-left">
                            <button class="flex items-center btn btn-primary btn-rounded w-full" type="submit">
                                <Icon class="size-5 mr-4" name="solar:login-3-line-duotone" />
                                Login
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>
