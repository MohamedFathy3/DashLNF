<script lang="ts" setup>
import { SITE_MENU_GROUPS, pagePermissionCandidates, type SiteMenuGroup, type SitePageDefinition } from '~/utils/page-permissions';

const props = defineProps({ open: { type: Boolean, default: false } });
const emit = defineEmits(['toggleSidebar']);
const route = useRoute();
const activeMenuItem = ref(route.fullPath);
const openGroups = ref<string[]>(SITE_MENU_GROUPS.map((group) => group.name));

const visibleGroups = computed(() => SITE_MENU_GROUPS.map((group) => ({ ...group, items: group.items.filter((item) => useCheckPermission(pagePermissionCandidates(item, 'show'))) })).filter((group) => group.items.length));
const isActive = (item: SitePageDefinition) => route.fullPath === item.slug || route.fullPath.startsWith(`${item.slug}/`);
const isGroupOpen = (group: SiteMenuGroup) => openGroups.value.includes(group.name);
const toggleGroup = (group: SiteMenuGroup) => {
    openGroups.value = isGroupOpen(group) ? openGroups.value.filter((name) => name !== group.name) : [...openGroups.value, group.name];
    activeMenuItem.value = group.items[0]?.slug ?? activeMenuItem.value;
};
const toggleSubMenuOpen = (path: string) => {
    activeMenuItem.value = path;
};
</script>

<template>
    <div class="flex flex-col gap-8 p-5 text-white/75">
        <div :class="[props.open ? 'flex items-center justify-between gap-5' : 'px-4']">
            <div class="place-content-center flex items-center gap-3">
                <Icon v-if="props.open" class="size-7" name="solar:share-circle-bold-duotone" />
                <div v-if="props.open" class="text-base">
                    <span class="text-white">LNF <span class="font-extralight opacity-75">Dashboard</span></span
                    ><span class="ml-1 align-super text-[0.65rem] font-light opacity-75">v1.0</span>
                </div>
            </div>
            <Icon v-if="!props.open" class="mx-auto size-5 cursor-pointer" name="solar:round-alt-arrow-right-linear" @click="emit('toggleSidebar')" /><Icon
                v-else
                class="size-5 cursor-pointer hover:text-white"
                name="solar:round-alt-arrow-left-linear"
                @click="emit('toggleSidebar')"
            />
        </div>
        <div class="scrollbar-w-2 scrollbar-track-rounded-full scrollbar-thumb-rounded-full scrollbar scrollbar-thumb-white/25 relative overflow-y-hidden pr-2 hover:overflow-y-auto">
            <ul class="mb-12 flex flex-col gap-2 text-sm font-light">
                <li class="text-xs opacity-75" :class="props.open ? 'mt-0' : 'text-center'">{{ props.open ? 'Overview' : '...' }}</li>
                <li class="relative">
                    <NuxtLink
                        :class="[props.open ? 'rounded-full px-6' : 'rounded-xl px-4', route.fullPath === '/' ? 'bg-white text-slate-700' : 'hover:bg-white/10 hover:text-white', 'group relative flex w-full cursor-pointer items-center gap-3 py-2']"
                        to="/"
                        @click="toggleSubMenuOpen('/')"
                        ><Icon name="solar:monitor-linear" class="size-5 opacity-75" />
                        <div v-if="props.open">Overview</div>
                        <div v-if="!props.open" class="amj__tooltip-content"><span class="amj__tooltip-text">Overview</span></div></NuxtLink
                    >
                </li>
                <template v-for="group in visibleGroups" :key="group.name">
                    <li v-if="props.open" class="mt-5 text-xs opacity-75">{{ group.name }}</li>
                    <li v-else class="mt-5 text-center opacity-75">...</li>
                    <li class="relative">
                        <button
                            type="button"
                            :class="[props.open ? 'rounded-full px-6' : 'rounded-xl px-4', 'group relative flex w-full items-center justify-between gap-3 py-2 text-left hover:bg-white/10 hover:text-white']"
                            @click="toggleGroup(group)"
                        >
                            <span class="flex items-center gap-2"
                                ><Icon :name="group.icon" class="size-5 opacity-75" /><span v-if="props.open">{{ group.name }}</span></span
                            ><Icon v-if="props.open" :class="[isGroupOpen(group) ? 'rotate-90' : '', 'size-4 opacity-75 transition duration-300']" name="solar:alt-arrow-down-line-duotone" />
                            <div v-if="!props.open" class="amj__tooltip-content">
                                <span class="amj__tooltip-text">{{ group.name }}</span>
                            </div>
                        </button>
                        <TransitionExpand
                            ><ul v-if="isGroupOpen(group)" class="mt-2 flex flex-col gap-2 rounded-xl bg-white/10 p-2">
                                <li v-for="item in group.items" :key="item.slug" class="relative">
                                    <NuxtLink
                                        :class="[props.open ? 'rounded-full px-4' : 'rounded-xl px-2', isActive(item) ? 'bg-white text-slate-700' : 'hover:bg-white/10 hover:text-white', 'group relative flex w-full items-center gap-2 py-2']"
                                        :to="item.slug"
                                        @click="toggleSubMenuOpen(item.slug)"
                                        ><Icon :name="item.icon" class="size-5 opacity-75" /><span v-if="props.open">{{ item.name }}</span>
                                        <div v-if="!props.open" class="amj__tooltip-content">
                                            <span class="amj__tooltip-text">{{ item.name }}</span>
                                        </div></NuxtLink
                                    >
                                </li>
                            </ul></TransitionExpand
                        >
                    </li>
                </template>
            </ul>
        </div>
    </div>
</template>
