<script lang="ts" setup>
const route = useRoute();
const userStore = useUserStore();
const settingStore = useSettingsStore();
const formatRoutePath = (path: string) => {
    if (path === '/') {
        return [];
    } else {
        path = path.replace(/^\//, '').replace(/\/$/, '');
        const segments = path.split('/');
        return segments.map((segment, index) => {
            let name = segment
                .split('-')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            // Check if the last segment is a number
            if (index === segments.length - 1 && /^\d+$/.test(segment)) {
                name = 'View';
            }
            const url = '/' + segments.slice(0, index + 1).join('/');
            return { name, url };
        });
    }
};
const formattedPath = ref(formatRoutePath(route.fullPath));

watch(
    () => route.fullPath,
    (newPath) => {
        formattedPath.value = formatRoutePath(newPath);
    },
);

async function logout() {
    await userStore.logout();
}
</script>

<template>
    <div class="flex items-center gap-5 justify-end lg:justify-between py-3 text-white/75 pl-5">
        <ul class="lg:flex hidden items-center font-light gap-2 text-sm">
            <li class="flex items-center gap-2 intro-x">
                <Icon class="size-4 opacity-50" name="solar:double-alt-arrow-right-line-duotone" />
                <NuxtLink :to="route.fullPath === '/' ? '' : '/'" class="flex items-center gap-2">
                    <span :class="[route.fullPath === '/' ? 'opacity-100' : 'hover:opacity-100 opacity-50 ease-in-out duration-300']">Dashboard</span>
                </NuxtLink>
                <Icon v-if="route.fullPath !== '/'" class="size-4 opacity-50" name="solar:double-alt-arrow-right-line-duotone" />
            </li>
            <template v-for="(path, i) in formattedPath" :key="i">
                <li v-if="route.fullPath !== '/'" class="intro-x flex items-center gap-2">
                    <NuxtLink :to="i === formattedPath.length - 1 ? '' : path.url" class="flex items-center gap-2">
                        <span :class="[route.fullPath === '/' ? 'opacity-100' : '', i === formattedPath.length - 1 ? 'text-white' : 'ease-in-out duration-300 hover:opacity-100 opacity-50']">{{ path.name }}</span>
                    </NuxtLink>
                    <Icon v-if="i !== formattedPath.length - 1" class="size-4 opacity-50" name="solar:double-alt-arrow-right-line-duotone" />
                </li>
            </template>
        </ul>

        <HeadlessMenu as="div" class="relative inline-block self-end">
            <HeadlessMenuButton>
                <div class="flex items-center gap-5 py-1 px-3 rounded-xl hover:bg-white/10">
                    <div class="text-right">
                        <div class="text-sm font-medium">{{ userStore.user?.name }}</div>
                        <span class="text-xs opacity-75 font-extralight">
                            {{ userStore.user?.superAdmin ? 'Super Admin' : userStore.user?.role?.name }}
                        </span>
                    </div>
                    <Icon class="size-4" name="solar:alt-arrow-down-outline" />
                </div>
            </HeadlessMenuButton>
            <TransitionExpand>
                <HeadlessMenuItems as="div" class="absolute text-sm right-0 mt-2 w-56 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black/5 focus:outline-none text-slate-600 z-50">
                    <ul class="px-2 py-1">
                        <HeadlessMenuItem as="li" class="py-0.5">
                            <NuxtLink class="w-full p-2 flex items-center gap-3 grow px-3 rounded-full hover:bg-primary hover:text-white ease-in-out duration-100" to="/profile">
                                <Icon class="size-5 opacity-75" name="solar:user-circle-line-duotone" />
                                <div>Profile</div>
                            </NuxtLink>
                        </HeadlessMenuItem>
                        <HeadlessMenuItem as="li" class="py-0.5">
                            <NuxtLink class="w-full p-2 flex items-center gap-3 grow px-3 rounded-full hover:bg-primary hover:text-white ease-in-out duration-100" to="/profile/edit">
                                <Icon class="size-5 opacity-75" name="solar:settings-outline" />
                                <div>Edit profile</div>
                            </NuxtLink>
                        </HeadlessMenuItem>
                        <HeadlessMenuItem as="li" class="py-0.5">
                            <NuxtLink class="w-full p-2 flex items-center gap-3 grow px-3 rounded-full hover:bg-primary hover:text-white ease-in-out duration-100" to="/profile/tasks">
                                <Icon class="size-5 opacity-75" name="solar:server-2-outline" />
                                <div>Tasks</div>
                            </NuxtLink>
                        </HeadlessMenuItem>
                        <HeadlessMenuItem as="li" class="py-0.5 text-danger">
                            <div class="w-full p-2 flex items-center gap-3 grow cursor-pointer px-3 rounded-full hover:bg-danger hover:text-white ease-in-out duration-100" @click="logout">
                                <Icon class="size-5 opacity-75" name="solar:logout-3-line-duotone" />
                                <div>Logout</div>
                            </div>
                        </HeadlessMenuItem>
                    </ul>
                </HeadlessMenuItems>
            </TransitionExpand>
        </HeadlessMenu>
    </div>
</template>
