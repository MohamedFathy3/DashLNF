export const PAGE_PERMISSION_ACTIONS = [
    { key: 'show', label: 'Show' },
    { key: 'create', label: 'Create' },
    { key: 'update', label: 'Update' },
    { key: 'delete', label: 'Delete' },
    { key: 'forceDelete', label: 'Force Delete' },
] as const;

export type PagePermissionAction = (typeof PAGE_PERMISSION_ACTIONS)[number]['key'];

export type SitePageDefinition = {
    name: string;
    slug: string;
    icon: string;
};

export type SiteMenuGroup = {
    name: string;
    icon: string;
    items: SitePageDefinition[];
};

const page = (name: string, slug: string, icon: string): SitePageDefinition => ({ name, slug, icon });

export const SITE_MENU_GROUPS: SiteMenuGroup[] = [
    {
        name: 'Reports',
        icon: 'solar:chart-linear',
        items: [page('Logs', '/reports/logs', 'solar:checklist-line-duotone'), page('Visits', '/reports/visits', 'solar:square-transfer-vertical-linear')],
    },
    {
        name: 'Master Data',
        icon: 'solar:server-outline',
        items: [page('Countries', '/master-data/countries', 'solar:asteroid-linear'), page('Cities', '/master-data/cities', 'solar:map-linear')],
    },
    {
        name: "Member's Data",
        icon: 'solar:clipboard-check-linear',
        items: [
            page('Members', '/members-data/members', 'solar:case-minimalistic-linear'),
            page('Network', '/members-data/network', 'solar:map-point-linear'),
            page('Applications', '/members-data/applications', 'solar:users-group-two-rounded-outline'),
            page('Claim Forms', '/members-data/claim-forms', 'solar:square-transfer-horizontal-broken'),
            page('Contact Persons', '/members-data/contact-persons', 'solar:users-group-two-rounded-line-duotone'),
            page('Groups', '/members-data/groups', 'solar:link-square-line-duotone'),
            page('Member Requests', '/members-data/member-requests', 'solar:inbox-line-linear'),
            page('Pending Applications', '/members-data/pending-applications', 'solar:hourglass-line-linear'),
            page('Representatives', '/members-data/representatives', 'solar:users-group-rounded-line-duotone'),
            page('Trade References', '/members-data/trade-references', 'solar:bill-list-outline'),
        ],
    },
    {
        name: 'Website Data',
        icon: 'solar:file-text-line-duotone',
        items: [
            page('Sliders', '/website-data/sliders', 'solar:slider-vertical-linear'),
            page('Pages', '/website-data/pages', 'solar:pen-new-square-linear'),
            page('Sections', '/website-data/sections', 'solar:server-outline'),
            page('Menus', '/website-data/menus', 'solar:hamburger-menu-outline'),
            page('News', '/website-data/articles', 'solar:document-text-linear'),
            page('Events', '/website-data/events', 'solar:calendar-mark-line-duotone'),
            page('Partners', '/website-data/partners', 'solar:users-group-two-rounded-outline'),
            page('Guidelines', '/website-data/guidelines', 'solar:question-square-linear'),
            page('FAQ', '/website-data/faq', 'solar:question-square-linear'),
            page('Terms & Conditions', '/website-data/terms-and-conditions', 'solar:question-square-linear'),
            page('Services', '/website-data/services', 'solar:star-circle-linear'),
            page('Policies', '/website-data/policies', 'solar:menu-dots-square-outline'),
            page('Networks Logos', '/website-data/networks', 'solar:wallpaper-bold-duotone'),
            page('Board Members', '/website-data/team', 'solar:users-group-two-rounded-linear'),
            page('Contact Messages', '/website-data/messages', 'solar:chat-line-line-duotone'),
            page('Newsletter Emails', '/website-data/newsletter-emails', 'solar:letter-linear'),
        ],
    },
    {
        name: 'Exhibitions Data',
        icon: 'solar:calendar-linear',
        items: [page('Exhibitions', '/events-expos/expos', 'solar:calendar-linear'), page('Packages', '/events-expos/packages', 'solar:medal-ribbon-star-outline'), page('Companies', '/events-expos/companies', 'solar:buildings-3-outline')],
    },
    {
        name: 'Admins Area',
        icon: 'solar:server-2-line-duotone',
        items: [
            page('Admins', '/admins-area/admins', 'solar:shield-user-linear'),
            page('Roles', '/admins-area/roles', 'solar:eye-scan-bold'),
            page('Permissions', '/admins-area/permissions', 'solar:key-square-bold-duotone'),
            page('Affiliates', '/admins-area/affiliates', 'solar:chat-round-call-line-duotone'),
        ],
    },
    {
        name: 'Network Settings',
        icon: 'solar:settings-outline',
        items: [
            page('Update Settings', '/settings/update', 'solar:pen-new-square-outline'),
            page('Setting Fields', '/settings/fields', 'solar:server-2-outline'),
            page('Email Templates', '/settings/email-templates', 'solar:streets-navigation-linear'),
        ],
    },
];

export const SITE_PAGES: SitePageDefinition[] = SITE_MENU_GROUPS.flatMap((group) => group.items);

const actionLabels: Record<PagePermissionAction, string> = {
    show: 'Show',
    create: 'Create',
    update: 'Update',
    delete: 'Delete',
    forceDelete: 'Force Delete',
};

const pathKey = (slug: string) =>
    slug
        .replace(/^\/+|\/+$/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase();

export const pagePermissionSlug = (page: SitePageDefinition, action: PagePermissionAction) => `${action}-${pathKey(page.slug)}`;
export const pagePermissionName = (page: SitePageDefinition, action: PagePermissionAction) => `${actionLabels[action]} ${page.name}`;
export const pagePermissionKey = (page: SitePageDefinition, action: PagePermissionAction) => `${page.slug}::${action}`;
export const pagePermissionDefinition = (page: SitePageDefinition, action: PagePermissionAction) => ({ page, action, name: pagePermissionName(page, action), slug: pagePermissionSlug(page, action) });
export const pagePermissionCandidates = (page: SitePageDefinition, action: PagePermissionAction): string[] => [pagePermissionSlug(page, action)];
export const sitePageForPath = (path: string) => SITE_PAGES.find((item) => path === item.slug || path.startsWith(`${item.slug}/`));
export const actionLabel = (action: PagePermissionAction) => actionLabels[action];
