export const RBAC_ACTIONS = ['list', 'create', 'edit', 'delete', 'restore', 'force-delete'] as const;

export type RbacAction = (typeof RBAC_ACTIONS)[number];

const actionAliases: Record<string, RbacAction> = {
    show: 'list',
    view: 'list',
    list: 'list',
    create: 'create',
    add: 'create',
    update: 'edit',
    edit: 'edit',
    delete: 'delete',
    remove: 'delete',
    restore: 'restore',
    'force-delete': 'force-delete',
    force_delete: 'force-delete',
};

const pluralToSingular: Record<string, string> = {
    admins: 'admin',
    affiliates: 'affiliate',
    articles: 'article',
    cities: 'city',
    countries: 'country',
    events: 'event',
    faqs: 'faq',
    groups: 'group',
    members: 'member',
    messages: 'message',
    menus: 'menu',
    networks: 'network',
    packages: 'package',
    pages: 'page',
    partners: 'partner',
    policies: 'policy',
    roles: 'role',
    sections: 'section',
    services: 'service',
    sliders: 'slider',
    teams: 'team',
    visits: 'visit',
};

export const normalizeResource = (resource: string) => {
    const value = resource
        .trim()
        .toLowerCase()
        .replace(/[/\\s_]+/g, '-')
        .replace(/-+/g, '-');
    return pluralToSingular[value] ?? value.replace(/s$/, '');
};

export const normalizeAction = (action: string): RbacAction | null => actionAliases[action.trim().toLowerCase()] ?? null;

export const permissionSlug = (resource: string, action: string): string => {
    const normalizedAction = normalizeAction(action);
    if (!normalizedAction) throw new Error(`Unsupported RBAC action: ${action}`);
    return `${normalizedAction}-${normalizeResource(resource)}`;
};

export const permissionCandidates = (resource: string, action: string): string[] => {
    const normalizedResource = normalizeResource(resource);
    const normalizedAction = normalizeAction(action);
    if (!normalizedAction) return [];

    const legacyAction = normalizedAction === 'edit' ? 'update' : normalizedAction === 'force-delete' ? 'force_delete' : normalizedAction;
    return [
        ...new Set([
            `${normalizedAction}-${normalizedResource}`,
            `${normalizedResource}_${legacyAction}`,
            `${normalizedResource}_${normalizedAction}`,
            `network_${normalizedResource}_${legacyAction}`,
            `network_${normalizedResource}_${normalizedAction}`,
        ]),
    ];
};

export const routeResourceFromPath = (path: string): string | null => {
    const segments = path
        .split('/')
        .filter(Boolean)
        .filter((segment) => !/^\[.*\]$/.test(segment) && !/^\d+$/.test(segment));
    const candidate = segments.at(-1);
    return candidate ? normalizeResource(candidate) : null;
};

export const permissionKeys = (permission: string): string[] => {
    const raw = permission.trim().toLowerCase();
    if (!raw) return [];

    const keys = new Set<string>([raw, raw.replace(/_/g, '-')]);
    const standard = raw.replace(/_/g, '-').match(/^(show|view|list|create|add|update|edit|delete|remove|restore|force-delete|force_delete)-(.+)$/);
    if (standard) {
        const action = normalizeAction(standard[1]);
        if (action) keys.add(`${action}-${normalizeResource(standard[2])}`);
    }

    const legacy = raw.match(/^(?:network[_-])?(.+)[_-](list|show|view|create|add|update|edit|delete|remove|restore|force[_-]delete)$/);
    if (legacy) {
        const action = normalizeAction(legacy[2]);
        if (action) {
            const resource = normalizeResource(legacy[1].replace(/^network[_-]/, ''));
            keys.add(`${action}-${resource}`);
            keys.add(`${resource}_${legacy[2]}`);
            keys.add(`network_${resource}_${legacy[2]}`);
        }
    }

    return [...keys];
};
