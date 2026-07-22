<script lang="ts" setup>
const settingStore = useSettingsStore();
defineProps({
    open: {
        type: Boolean,
        default: false,
    },
});
const emit = defineEmits(['toggleSidebar']);
const menuItems = ref([
    'Overview',
    { name: 'Overview', path: '/', icon: 'solar:monitor-linear', subMenus: [], permission: [] },
    {
        name: 'Reports',
        path: '/reports',
        icon: 'solar:chart-linear',
        permission: ['list-vote', 'list-logs'],
        subMenus: [
            { name: 'Logs', path: '/reports/logs', icon: 'solar:checklist-line-duotone', subMenus: [], permission: ['list-log'] },
            {
                name: 'Visits',
                path: '/reports/visits',
                icon: 'solar:square-transfer-vertical-linear',
                subMenus: [],
                permission: ['list-visit'],
            },
        ],
    },
    {
        name: 'Master Data',
        path: '/master-data',
        icon: 'solar:server-outline',
        permission: ['list-country', 'list-city'],
        subMenus: [
            { name: 'Countries', path: '/master-data/countries', icon: 'solar:asteroid-linear', subMenus: [], permission: ['list-country'] },
            { name: 'Cities', path: '/master-data/cities', icon: 'solar:map-linear', subMenus: [], permission: ['list-city'] },
        ],
    },

    'Members Area',
    {
        name: "Member's Data",
        path: '/members-data',
        icon: 'solar:clipboard-check-linear',
        permission: ['network_member_list', 'network_contact_person_list', 'network_trade_reference_list', 'network_group_list'],
        subMenus: [
            { name: 'Members', path: '/members-data/members', icon: 'solar:case-minimalistic-linear', subMenus: [], permission: ['network_member_list'] },
            { name: 'Network', path: '/members-data/network', icon: 'solar:map-point-linear', subMenus: [], permission: ['network_member_list'] },

            // {
            //     name: 'Contact Persons',
            //     path: '/members-data/contact-persons',
            //     icon: 'solar:users-group-two-rounded-line-duotone',
            //     subMenus: [],
            //     permission: ['network_contact_person_list'],
            // },
            // {
            //     name: 'Trade References',
            //     path: '/members-data/trade-references',
            //     icon: 'solar:bill-list-outline',
            //     subMenus: [],
            //     permission: ['network_trade_reference_list'],
            // },
            // { name: 'Groups', path: '/members-data/groups', icon: 'solar:link-square-line-duotone', subMenus: [], permission: ['network_group_list'] },
            // { name: 'Claim Forms', path: '/members-data/claim-forms', icon: 'solar:square-transfer-horizontal-broken', subMenus: [], permission: ['network_claim_form_list'] },
        ],
    },
    'Website Options',
    {
        name: 'Website Data',
        path: '/website-data',
        icon: 'solar:file-text-line-duotone',
        permission: ['list-guideline', 'list-page', 'list-section', 'list-menu', 'list-article', 'list-event', 'list-partner', 'list-faq', 'list-term', 'list-service', 'list-policy', 'list-team', 'list-message'],
        subMenus: [
            {
                name: 'Sliders',
                path: '/website-data/sliders',
                icon: 'solar:slider-vertical-linear',
                subMenus: [],
                permission: ['list-slide'],
            },
            {
                name: 'Pages',
                path: '/website-data/pages',
                icon: 'solar:pen-new-square-linear',
                subMenus: [],
                permission: ['list-page'],
            },
            {
                name: 'Sections',
                path: '/website-data/sections',
                icon: 'solar:server-outline',
                subMenus: [],
                permission: ['list-section'],
            },
            {
                name: 'Menus',
                path: '/website-data/menus',
                icon: 'solar:hamburger-menu-outline',
                subMenus: [],
                permission: ['list-menu'],
            },
            {
                name: 'News',
                path: '/website-data/articles',
                icon: 'solar:document-text-linear',
                subMenus: [],
                permission: ['list-article'],
            },
            {
                name: 'Events',
                path: '/website-data/events',
                icon: 'solar:calendar-mark-line-duotone',
                subMenus: [],
                permission: ['list-event'],
            },
            {
                name: 'Partners',
                path: '/website-data/partners',
                icon: 'solar:users-group-two-rounded-outline',
                subMenus: [],
                permission: ['list-partner'],
            },
            {
                name: 'Guidelines',
                path: '/website-data/guidelines',
                icon: 'solar:question-square-linear',
                subMenus: [],
                permission: ['list-guideline'],
            },
            {
                name: 'FAQ',
                path: '/website-data/faq',
                icon: 'solar:question-square-linear',
                subMenus: [],
                permission: ['list-faq'],
            },
            {
                name: 'Terms & Conditions',
                path: '/website-data/terms-and-conditions',
                icon: 'solar:question-square-linear',
                subMenus: [],
                permission: ['list-term'],
            },
            {
                name: 'Services',
                path: '/website-data/services',
                icon: 'solar:star-circle-linear',
                subMenus: [],
                permission: ['list-service'],
            },
            {
                name: 'Policies',
                path: '/website-data/policies',
                icon: 'solar:menu-dots-square-outline',
                subMenus: [],
                permission: ['list-policy'],
            },
            {
                name: 'Networks Logos',
                path: '/website-data/networks',
                icon: 'solar:wallpaper-bold-duotone',
                subMenus: [],
                permission: ['list-team'],
            },
            {
                name: 'Board Members',
                path: '/website-data/team',
                icon: 'solar:users-group-two-rounded-linear',
                subMenus: [],
                permission: ['list-team'],
            },
            {
                name: 'Contact Messages',
                path: '/website-data/messages',
                icon: 'solar:chat-line-line-duotone',
                subMenus: [],
                permission: ['list-newsletter'],
            },
            {
                name: 'Newsletter Emails',
                path: '/website-data/newsletter-emails',
                icon: 'solar:letter-linear',
                subMenus: [],
                permission: ['list-message'],
            },
        ],
    },

    'Members Data',
    {
        name: 'Applications',
        path: '/members-data/applications',
        icon: 'solar:users-group-two-rounded-outline',
        permission: ['list-member'],
        subMenus: [],
    },
    {
        name: 'Representatives',
        path: '/members-data/representatives',
        icon: 'solar:users-group-rounded-line-duotone',
        permission: ['list-contact-people'],
        subMenus: [],
    },
    {
        name: 'Exhibitions Data',
        path: '/events-expos',
        icon: 'solar:calendar-linear',
        permission: ['list-expo', 'list-expo-company', 'list-package'],
        subMenus: [
            { name: 'Exhibitions', path: '/events-expos/expos', icon: 'solar:calendar-linear', subMenus: [], permission: ['list-expo'] },
            { name: 'Packages', path: '/events-expos/packages', icon: 'solar:medal-ribbon-star-outline', subMenus: [], permission: ['list-package'] },
            { name: 'Companies', path: '/events-expos/companies', icon: 'solar:buildings-3-outline', subMenus: [], permission: ['list-expo-company'] },
        ],
    },
    'Settings',
    {
        name: 'Admins Area',
        path: '/admins-area',
        icon: 'solar:server-2-line-duotone',
        permission: ['list-admin', 'list-role', 'list-affiliate'],
        subMenus: [
            {
                name: 'Admins',
                path: '/admins-area/admins',
                icon: 'solar:shield-user-linear',
                subMenus: [],
                permission: ['list-admin'],
            },
            {
                name: 'Roles',
                path: '/admins-area/roles',
                icon: 'solar:eye-scan-bold',
                subMenus: [],
                permission: ['list-role'],
            },
            {
                name: 'Affiliates',
                path: '/admins-area/affiliates',
                icon: 'solar:chat-round-call-line-duotone',
                subMenus: [],
                permission: ['list-affiliate'],
            },
        ],
    },
    {
        name: 'Network Settings',
        path: '/settings',
        icon: 'solar:settings-outline',
        permission: ['page-setting', 'list-setting', 'list-email-template'],
        subMenus: [
            {
                name: 'Update Settings',
                path: '/settings/update',
                icon: 'solar:pen-new-square-outline',
                subMenus: [],
                permission: ['page-setting'],
            },
            {
                name: 'Setting Fields',
                path: '/settings/fields',
                icon: 'solar:server-2-outline',
                subMenus: [],
                permission: ['list-setting'],
            },
            {
                name: 'Email Templates',
                path: '/settings/email-templates',
                icon: 'solar:streets-navigation-linear',
                subMenus: [],
                permission: ['list-email-template'],
            },
        ],
    },
]);

const route = useRoute();

const activeMenuItem = ref(route.fullPath);

function toggleSubMenuOpen(path: string) {
    activeMenuItem.value = path;
}
</script>

<template>
    <div class="text-white/75 p-5 flex flex-col gap-8">
        <div :class="[open ? 'flex items-center justify-between gap-5' : 'px-4']">
            <div :class="['flex items-center gap-3 place-content-center']">
                <Icon v-if="open" class="size-7" name="solar:share-circle-bold-duotone" />
                <div v-if="open" class="text-base">
                    <span class="text-white">LNF <span class="font-extralight opacity-75">Dashboard</span></span>
                    <span class="text-[0.65rem] font-light align-super ml-1 opacity-75">v1.0</span>
                </div>
            </div>
            <Icon v-if="!open" class="size-5 mx-auto cursor-pointer" name="solar:round-alt-arrow-right-linear" @click="emit('toggleSidebar')" />
            <Icon v-if="open" class="size-5 cursor-pointer hover:text-white" name="solar:round-alt-arrow-left-linear" @click="emit('toggleSidebar')" />
        </div>
        <div class="relative pr-2 scrollbar-w-2 scrollbar-track-rounded-full scrollbar-thumb-rounded-full scrollbar scrollbar-thumb-white/25 overflow-y-hidden hover:overflow-y-auto">
            <ul class="flex flex-col gap-2 font-light text-sm mb-12">
                <template v-for="(item, i) in menuItems" :key="i">
                    <template v-if="typeof item === 'string'">
                        <li v-if="open" class="text-xs first:mt-0 mt-5 opacity-75">{{ item }}</li>
                        <li v-else class="first:mt-0 mt-5 opacity-75 text-center">...</li>
                    </template>
                    <template v-else>
                        <li v-if="useCheckPermission(item.permission as string[])" class="relative">
                            <NuxtLink
                                :class="[
                                    open ? 'px-6 rounded-full' : 'px-4 rounded-xl',
                                    route.fullPath === item.path ? 'bg-white text-slate-700' : 'hover:bg-white/10 hover:text-white',
                                    'relative group py-2 flex items-center justify-between gap-3 w-full cursor-pointer',
                                ]"
                                :to="item.subMenus.length > 0 ? '' : item.path"
                                @click="toggleSubMenuOpen(item.path)"
                            >
                                <div class="items-center flex gap-2">
                                    <Icon :name="item.icon" class="size-5 opacity-75" />
                                    <div v-if="open">{{ item.name }}</div>
                                </div>
                                <Icon
                                    v-if="item.subMenus.length > 0 && open"
                                    :class="[activeMenuItem === item.path || item.subMenus.some((m) => m.path === activeMenuItem) ? 'rotate-90' : '', 'size-4 ease-in-out duration-300 opacity-75']"
                                    name="solar:alt-arrow-down-line-duotone"
                                />
                                <div v-if="!open" class="amj__tooltip-content">
                                    <span class="amj__tooltip-text">{{ item.name }}</span>
                                </div>
                            </NuxtLink>
                            <TransitionExpand>
                                <template v-if="activeMenuItem === item.path || item.subMenus.some((m) => m.path === activeMenuItem)">
                                    <ul v-if="item.subMenus.length > 0" class="bg-white/10 rounded-xl p-2 flex flex-col gap-2 mt-2">
                                        <template v-for="(subItem, s) in item.subMenus" :key="s">
                                            <li v-if="useCheckPermission(subItem.permission as string[])" class="relative">
                                                <NuxtLink
                                                    :class="[
                                                        open ? 'px-4 rounded-full' : 'px-2 rounded-xl',
                                                        route.fullPath === subItem.path ? 'bg-white text-slate-700' : 'hover:bg-white/10 hover:text-white',
                                                        'relative group py-2 flex items-center justify-between gap-3 w-full',
                                                    ]"
                                                    :to="subItem.path"
                                                >
                                                    <div class="items-center flex gap-2">
                                                        <Icon :name="subItem.icon" class="size-5 opacity-75" />
                                                        <div v-if="open">{{ subItem.name }}</div>
                                                    </div>
                                                    <Icon v-if="subItem.subMenus.length > 0 && open" class="size-4 opacity-75" name="solar:alt-arrow-down-line-duotone" />
                                                    <div v-if="!open" class="amj__tooltip-content">
                                                        <span class="amj__tooltip-text">{{ subItem.name }}</span>
                                                    </div>
                                                </NuxtLink>
                                            </li>
                                        </template>
                                    </ul>
                                </template>
                            </TransitionExpand>
                        </li>
                    </template>
                </template>
            </ul>
        </div>
    </div>
</template>
