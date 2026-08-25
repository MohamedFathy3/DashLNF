<script setup lang="ts">
type Permission = {
    id: number;
    name: string;
    slug: string;
    children?: Permission[];
};

type PermissionSelection = number | { id?: number; permission_id?: number; permissionId?: number };

const props = withDefaults(
    defineProps<{
        permissions: Permission[];
        modelValue: PermissionSelection[];
        disabled?: boolean;
        title?: string;
        description?: string;
    }>(),
    {
        disabled: false,
        title: 'Permissions matrix',
        description: 'Choose the exact actions this role can perform in each resource.',
    },
);

const emit = defineEmits<{
    'update:modelValue': [value: { permission_id: number }[]];
}>();

const search = ref('');
const actionPrefixes = ['list-', 'create-', 'edit-', 'delete-', 'restore-', 'force-delete-', 'settings-'];
const specialActionSlugs = ['settings-page', 'settings-fields'];
const resourceHeaderSlugs = new Set(['admins', 'roles', 'countries', 'faqs', 'messages', 'navs', 'subnavs', 'pages', 'page-sections', 'settings']);

const flattenPermissions = computed(() => {
    const flattened: Permission[] = [];
    for (const permission of props.permissions ?? []) {
        if (permission.children?.length) {
            flattened.push(...permission.children);
        } else {
            flattened.push(permission);
        }
    }
    return flattened;
});

const isActionPermission = (permission: Permission) =>
    specialActionSlugs.includes(permission.slug) || actionPrefixes.some((prefix) => permission.slug.startsWith(prefix)) || /_(list|create|update|edit|delete|restore|force_delete)$/.test(permission.slug);
const isResourceHeader = (permission: Permission) => resourceHeaderSlugs.has(permission.slug);
const headerAliases: Record<string, string> = {
    admins: 'admin',
    roles: 'role',
    countries: 'country',
    faqs: 'faq',
    messages: 'message',
    navs: 'nav',
    subnavs: 'subnav',
    pages: 'page',
    'page-sections': 'section',
    settings: 'setting',
};

const resourceKey = (permission: Permission) => {
    if (isResourceHeader(permission)) return headerAliases[permission.slug] ?? permission.slug;
    if (specialActionSlugs.includes(permission.slug)) return 'setting';
    const standard = permission.slug.match(/^(list|create|edit|delete|restore|force-delete)-(.+)$/);
    if (standard) return standard[2];
    const network = permission.slug.match(/^(.*)_(list|create|update|edit|delete|restore|force_delete)$/);
    if (network) return network[1];
    return 'custom';
};

const groupLabel = (key: string, permission: Permission) => {
    if (key === 'custom') return 'Custom permissions';
    if (isResourceHeader(permission)) return permission.name;
    return key.replaceAll('-', ' ');
};

const groups = computed(() => {
    const result: { id: string; name: string; permissions: Permission[] }[] = [];
    const byResource = new Map<string, { id: string; name: string; permissions: Permission[] }>();

    for (const permission of flattenPermissions.value) {
        const key = resourceKey(permission);
        let group = byResource.get(key);
        if (!group) {
            group = { id: key, name: groupLabel(key, permission), permissions: [] };
            byResource.set(key, group);
            result.push(group);
        } else if (isResourceHeader(permission)) {
            group.name = permission.name;
        }
        if (!isResourceHeader(permission)) group.permissions.push(permission);
    }

    return result.filter((group) => group.permissions.length > 0);
});

const filteredGroups = computed(() => {
    const term = search.value.trim().toLowerCase();
    if (!term) return groups.value;

    return groups.value
        .map((group) => ({
            ...group,
            permissions: group.permissions.filter((permission) => `${permission.name} ${permission.slug}`.toLowerCase().includes(term)),
        }))
        .filter((group) => group.name.toLowerCase().includes(term) || group.permissions.length > 0);
});

const selectedIds = computed(() => {
    const ids = new Set<number>();
    for (const value of props.modelValue ?? []) {
        const id = typeof value === 'number' ? value : (value.permission_id ?? value.permissionId ?? value.id);
        if (typeof id === 'number') ids.add(id);
    }
    return ids;
});

const visiblePermissionIds = computed(() => filteredGroups.value.flatMap((group) => group.permissions.map((permission) => permission.id)));
const selectedCount = computed(() => selectedIds.value.size);

const isSelected = (id: number) => selectedIds.value.has(id);
const allSelected = (ids: number[]) => ids.length > 0 && ids.every((id) => selectedIds.value.has(id));

const setSelectedIds = (ids: Set<number>) => {
    emit(
        'update:modelValue',
        [...ids].sort((a, b) => a - b).map((permission_id) => ({ permission_id })),
    );
};

const togglePermission = (id: number) => {
    if (props.disabled) return;
    const ids = new Set(selectedIds.value);
    if (ids.has(id)) ids.delete(id);
    else ids.add(id);
    setSelectedIds(ids);
};

const toggleGroup = (ids: number[]) => {
    if (props.disabled) return;
    const next = new Set(selectedIds.value);
    if (allSelected(ids)) ids.forEach((id) => next.delete(id));
    else ids.forEach((id) => next.add(id));
    setSelectedIds(next);
};

const selectVisible = () => {
    if (props.disabled) return;
    const next = new Set(selectedIds.value);
    visiblePermissionIds.value.forEach((id) => next.add(id));
    setSelectedIds(next);
};

const clearVisible = () => {
    if (props.disabled) return;
    const next = new Set(selectedIds.value);
    visiblePermissionIds.value.forEach((id) => next.delete(id));
    setSelectedIds(next);
};
</script>

<template>
    <div class="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
        <div class="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
                <div class="flex items-center gap-2 text-base font-semibold text-slate-800">
                    <Icon name="solar:shield-keyhole-bold-duotone" class="size-5 text-primary" />
                    {{ title }}
                </div>
                <p class="mt-1 text-xs text-slate-500">{{ description }}</p>
            </div>
            <div class="flex items-center gap-2 text-xs font-medium text-slate-600">
                <span class="rounded-full bg-primary/10 px-3 py-1.5 text-primary">{{ selectedCount }} selected</span>
                <span class="rounded-full bg-white px-3 py-1.5">{{ visiblePermissionIds.length }} visible</span>
            </div>
        </div>

        <div class="mb-5 grid gap-3 md:grid-cols-12">
            <div class="relative md:col-span-7">
                <Icon name="solar:magnifer-linear" class="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                <input v-model="search" type="search" class="form-control w-full rounded-xl border-slate-200 bg-white pl-10" placeholder="Search permissions or resources" />
            </div>
            <button type="button" class="btn btn-secondary btn-sm rounded-xl md:col-span-2" :disabled="disabled || visiblePermissionIds.length === 0" @click="selectVisible">Select visible</button>
            <button type="button" class="btn btn-secondary btn-sm rounded-xl md:col-span-2" :disabled="disabled || visiblePermissionIds.length === 0" @click="clearVisible">Clear visible</button>
        </div>

        <div v-if="filteredGroups.length" class="grid gap-4 xl:grid-cols-2">
            <section v-for="group in filteredGroups" :key="group.id" class="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div class="flex items-center justify-between gap-4 border-b border-slate-100 bg-slate-50 px-4 py-3">
                    <div class="flex min-w-0 items-center gap-3">
                        <input
                            :id="`group-${group.id}`"
                            type="checkbox"
                            class="form-check-input size-5 rounded text-primary"
                            :checked="allSelected(group.permissions.map((permission) => permission.id))"
                            :disabled="disabled"
                            @change="toggleGroup(group.permissions.map((permission) => permission.id))"
                        />
                        <label :for="`group-${group.id}`" class="truncate text-sm font-semibold capitalize text-slate-800">{{ group.name }}</label>
                    </div>
                    <span class="shrink-0 text-xs text-slate-400">{{ group.permissions.length }} actions</span>
                </div>
                <div class="grid gap-x-4 gap-y-3 p-4 sm:grid-cols-2">
                    <label v-for="permission in group.permissions" :key="permission.id" :for="`permission-${permission.id}`" class="flex cursor-pointer items-start gap-3 rounded-xl p-2 transition hover:bg-slate-50">
                        <input :id="`permission-${permission.id}`" type="checkbox" class="form-check-input mt-0.5 size-5 rounded text-primary" :checked="isSelected(permission.id)" :disabled="disabled" @change="togglePermission(permission.id)" />
                        <span class="min-w-0">
                            <span class="block text-sm font-medium text-slate-700">{{ permission.name }}</span>
                            <span class="mt-0.5 block truncate text-[11px] text-slate-400">{{ permission.slug }}</span>
                        </span>
                    </label>
                </div>
            </section>
        </div>
        <div v-else class="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">No permissions match your search.</div>
    </div>
</template>
