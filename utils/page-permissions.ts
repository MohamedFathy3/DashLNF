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
};

export type PagePermissionDefinition = {
    page: SitePageDefinition;
    action: PagePermissionAction;
    name: string;
    slug: string;
};

export const SITE_PAGES: SitePageDefinition[] = [
    { name: 'Admins', slug: '/admins-area/admins' },
    { name: 'Roles', slug: '/admins-area/roles' },
    { name: 'Permissions', slug: '/admins-area/permissions' },
    { name: 'Affiliates', slug: '/admins-area/affiliates' },
    { name: 'Exhibitions', slug: '/events-expos/expos' },
    { name: 'Packages', slug: '/events-expos/packages' },
    { name: 'Companies', slug: '/events-expos/companies' },
    { name: 'Cities', slug: '/master-data/cities' },
    { name: 'Countries', slug: '/master-data/countries' },
    { name: 'Applications', slug: '/members-data/applications' },
    { name: 'Claim Forms', slug: '/members-data/claim-forms' },
    { name: 'Contact Persons', slug: '/members-data/contact-persons' },
    { name: 'Groups', slug: '/members-data/groups' },
    { name: 'Member Requests', slug: '/members-data/member-requests' },
    { name: 'Members', slug: '/members-data/members' },
    { name: 'Member Network', slug: '/members-data/network' },
    { name: 'Pending Applications', slug: '/members-data/pending-applications' },
    { name: 'Representatives', slug: '/members-data/representatives' },
    { name: 'Trade References', slug: '/members-data/trade-references' },
    { name: 'Logs', slug: '/reports/logs' },
    { name: 'Visits', slug: '/reports/visits' },
    { name: 'Email Templates', slug: '/settings/email-templates' },
    { name: 'Settings Fields', slug: '/settings/fields' },
    { name: 'Update Settings', slug: '/settings/update' },
    { name: 'Articles', slug: '/website-data/articles' },
    { name: 'Events', slug: '/website-data/events' },
    { name: 'FAQs', slug: '/website-data/faq' },
    { name: 'Guidelines', slug: '/website-data/guidelines' },
    { name: 'Menus', slug: '/website-data/menus' },
    { name: 'Contact Messages', slug: '/website-data/messages' },
    { name: 'Newsletter Emails', slug: '/website-data/newsletter-emails' },
    { name: 'Pages', slug: '/website-data/pages' },
    { name: 'Partners', slug: '/website-data/partners' },
    { name: 'Policies', slug: '/website-data/policies' },
    { name: 'Sections', slug: '/website-data/sections' },
    { name: 'Services', slug: '/website-data/services' },
    { name: 'Sliders', slug: '/website-data/sliders' },
    { name: 'Team', slug: '/website-data/team' },
    { name: 'Terms and Conditions', slug: '/website-data/terms-and-conditions' },
];

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

export const pagePermissionDefinition = (page: SitePageDefinition, action: PagePermissionAction): PagePermissionDefinition => ({
    page,
    action,
    name: pagePermissionName(page, action),
    slug: pagePermissionSlug(page, action),
});

export const pagePermissionCandidates = (page: SitePageDefinition, action: PagePermissionAction): string[] => [pagePermissionSlug(page, action)];

export const sitePageForPath = (path: string): SitePageDefinition | undefined => SITE_PAGES.find((page) => path === page.slug || path.startsWith(`${page.slug}/`));

export const actionLabel = (action: PagePermissionAction) => actionLabels[action];
