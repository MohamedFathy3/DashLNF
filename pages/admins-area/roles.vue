<script setup lang="ts">
import { required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';
import { PAGE_PERMISSION_ACTIONS, SITE_PAGES, pagePermissionCandidates, pagePermissionKey, type PagePermissionAction } from '~/utils/page-permissions';

definePageMeta({
    middleware: ['auth', 'permission'],
    permissions: ['list-role'],
});

type ApiPermission = { id: number; name: string; slug: string };
type RoleForm = { id?: number; name: string | null; slug: string | null; permissions: { permission_id: number }[] };

const selectedRows = ref<number[]>([]);
const filter = ref({ name: null as string | null });
const serverParams = ref({ filters: {}, orderBy: 'id', orderByDirection: 'asc', perPage: 25, page: 1, paginate: true, deleted: false });
const formLoading = ref(false);
const isOpen = ref(false);
const editMode = ref(false);
const item = ref<RoleForm>({ name: null, slug: null, permissions: [] });
const rules = { name: { required }, slug: { required } };
const v$ = useVuelidate(rules, item);
const pageSearch = ref('');

const canCreate = useCheckPermission(['create-admins-area-roles']);
const canUpdate = useCheckPermission(['update-admins-area-roles']);
const canDelete = useCheckPermission(['delete-admins-area-roles']);
const canRestore = useCheckPermission(['restore-admins-area-roles']);
const canForceDelete = useCheckPermission(['force-delete-admins-area-roles']);

const sortByList = [
    { name: 'Sort by ID', value: 'id' },
    { name: 'Sort by name', value: 'name' },
];
const { data: rows, pending, refresh } = await useApiFetch('/api/role/index', { method: 'POST', body: serverParams });
const {
    data: permissionResponse,
    pending: permissionsPending,
    refresh: refreshPermissions,
} = await useApiFetch('/api/permission', {
    method: 'GET',
    query: { page: 1, perPage: 500 },
});

const normalizeCollection = <T,>(response: any): T[] => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.data)) return response.data.data;
    return [];
};
const permissions = computed<ApiPermission[]>(() => normalizeCollection<ApiPermission>(permissionResponse.value));
const visiblePages = computed(() => {
    const term = pageSearch.value.trim().toLowerCase();
    if (!term) return SITE_PAGES;
    return SITE_PAGES.filter((page) => `${page.name} ${page.slug}`.toLowerCase().includes(term));
});
const selectedPermissionIds = computed(() => new Set(item.value.permissions.map(({ permission_id }) => permission_id)));
const permissionRecord = (page: (typeof SITE_PAGES)[number], action: PagePermissionAction) => permissions.value.find((permission) => pagePermissionCandidates(page, action).includes(permission.slug));
const permissionId = (page: (typeof SITE_PAGES)[number], action: PagePermissionAction) => permissionRecord(page, action)?.id;
const isActionSelected = (page: (typeof SITE_PAGES)[number], action: PagePermissionAction) => {
    const id = permissionId(page, action);
    return id ? selectedPermissionIds.value.has(id) : false;
};
const togglePageAction = (page: (typeof SITE_PAGES)[number], action: PagePermissionAction) => {
    const id = permissionId(page, action);
    if (!id || formLoading.value) return;
    const current = new Set(selectedPermissionIds.value);
    if (current.has(id)) current.delete(id);
    else current.add(id);
    item.value.permissions = [...current].sort((a, b) => a - b).map((permission_id) => ({ permission_id }));
};
const pageActionStatus = (page: (typeof SITE_PAGES)[number], action: PagePermissionAction) => Boolean(permissionId(page, action));

watch(
    filter,
    (value) => {
        serverParams.value.filters = value.name ? { name: value.name } : {};
    },
    { deep: true },
);
const resetServerParams = async () => {
    filter.value = { name: null };
    serverParams.value = { filters: {}, orderBy: 'id', orderByDirection: 'asc', perPage: 25, page: 1, paginate: true, deleted: false };
    selectedRows.value = [];
    await refresh();
};
const toggleDeleted = async () => {
    serverParams.value.deleted = !serverParams.value.deleted;
    selectedRows.value = [];
    await refresh();
};
const isSelected = (id: number) => selectedRows.value.includes(id);
const allSelected = computed(() => {
    const data = (rows.value as any)?.data ?? [];
    return data.length > 0 && data.every((row: any) => selectedRows.value.includes(row.id));
});
const selectAllRows = () => {
    const data = (rows.value as any)?.data ?? [];
    selectedRows.value = allSelected.value ? [] : data.map((row: any) => row.id);
};
const toggleRowSelection = (id: number) => {
    selectedRows.value = isSelected(id) ? selectedRows.value.filter((rowId) => rowId !== id) : [...selectedRows.value, id];
};
const changePage = async (value: string | number) => {
    const page = Number.parseInt(String(value), 10);
    if (Number.isNaN(page)) return;
    serverParams.value.page = page;
    selectedRows.value = [];
    await refresh();
};

const resetItemValues = () => {
    item.value = { name: null, slug: null, permissions: [] };
    pageSearch.value = '';
};
const normalizeRole = (role: any): RoleForm => ({
    id: role.id,
    name: role.name ?? null,
    slug: role.slug ?? null,
    permissions: (role.permissions ?? [])
        .map((permission: any) => permission?.permission_id ?? permission?.permissionId ?? permission?.id)
        .filter((id: unknown): id is number => typeof id === 'number')
        .map((permission_id: number) => ({ permission_id })),
});
const fetchItem = async (id: number) => {
    const { data, error } = await useApiFetch(`/api/role/${id}`, { lazy: true });
    if (data.value) item.value = normalizeRole((data.value as any).data);
    if (error.value) useToast({ title: 'Error', message: (error.value as any).data?.message ?? error.value.message, type: 'error', duration: 5000 });
};
const openModal = async (id: number | null = null) => {
    formLoading.value = true;
    resetItemValues();
    editMode.value = id !== null;
    if (id !== null) await fetchItem(id);
    formLoading.value = false;
    isOpen.value = true;
};
const closeModal = () => {
    isOpen.value = false;
    editMode.value = false;
    v$.value.$reset();
    resetItemValues();
};
const requestBody = () => ({ name: item.value.name, slug: item.value.slug, permissions: item.value.permissions.map(({ permission_id }) => ({ permission_id })) });
const saveItem = async () => {
    const endpoint = editMode.value ? `/api/role/${item.value.id}` : '/api/role';
    const { data, error } = await useApiFetch(endpoint, { method: editMode.value ? 'PATCH' : 'POST', body: requestBody(), lazy: true });
    if (data.value) {
        useToast({ title: 'Success', message: (data.value as any).message ?? 'Role saved successfully', type: 'success', duration: 5000 });
        closeModal();
        await refresh();
    }
    if (error.value) useToast({ title: 'Error', message: (error.value as any).data?.message ?? error.value.message, type: 'error', duration: 5000 });
};
const handleModalSubmit = async () => {
    formLoading.value = true;
    const valid = await v$.value.$validate();
    if (!valid) {
        useToast({ title: 'Error', message: 'Enter role name and page URL.', type: 'error', duration: 5000 });
        formLoading.value = false;
        return;
    }
    try {
        await saveItem();
    } finally {
        formLoading.value = false;
    }
};
const runBulkAction = async (endpoint: string, method: 'POST' | 'DELETE', confirmation: string) => {
    if (!selectedRows.value.length || !confirm(confirmation)) return;
    const { data, error } = await useApiFetch(`/api/role/${endpoint}`, { method, body: { items: selectedRows.value }, lazy: true });
    if (data.value) {
        useToast({ title: 'Success', message: (data.value as any).message ?? 'Action completed successfully', type: 'success', duration: 5000 });
        selectedRows.value = [];
        await refresh();
    }
    if (error.value) useToast({ title: 'Error', message: (error.value as any).data?.message ?? error.value.message, type: 'error', duration: 5000 });
};
const deleteItems = () => runBulkAction('delete', 'DELETE', 'Are you sure you want to delete the selected role(s)?');
const forceDeleteItems = () => runBulkAction('force-delete', 'DELETE', 'Permanently delete the selected role(s)?');
const restoreItems = () => runBulkAction('restore', 'POST', 'Restore the selected role(s)?');
</script>

<template>
    <div class="flex flex-col gap-8">
        <div class="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div class="flex items-start gap-3">
                <div class="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon name="solar:shield-keyhole-bold-duotone" class="size-6" /></div>
                <div>
                    <h1 class="text-xl font-semibold text-slate-800">{{ serverParams.deleted ? 'Deleted roles' : 'Roles & page permissions' }}</h1>
                    <p class="mt-1 text-sm text-slate-500">Every role uses the same five actions for every website page.</p>
                </div>
            </div>
            <div class="flex flex-col gap-3 sm:flex-row">
                <template v-if="selectedRows.length"
                    ><button v-if="serverParams.deleted && canForceDelete" class="btn btn-danger btn-rounded btn-sm gap-2" @click="forceDeleteItems"><Icon name="solar:trash-bin-minimalistic-line-duotone" class="size-5" /> Permanently delete</button
                    ><button v-else-if="!serverParams.deleted && canDelete" class="btn btn-danger btn-rounded btn-sm gap-2" @click="deleteItems"><Icon name="solar:trash-bin-minimalistic-line-duotone" class="size-5" /> Delete</button
                    ><button v-if="serverParams.deleted && canRestore" class="btn btn-success btn-rounded btn-sm gap-2" @click="restoreItems"><Icon name="solar:restart-circle-outline" class="size-5" /> Restore</button></template
                >
                <button v-if="canCreate" :disabled="serverParams.deleted" class="btn btn-primary btn-rounded btn-sm gap-2" @click="openModal()"><Icon name="solar:add-square-linear" class="size-5" /> Add role</button
                ><button class="btn btn-secondary btn-rounded btn-sm gap-2" @click="toggleDeleted">
                    <Icon :name="serverParams.deleted ? 'solar:hamburger-menu-line-duotone' : 'solar:trash-bin-minimalistic-line-duotone'" class="size-5" />{{ serverParams.deleted ? 'Roles list' : 'Deleted roles' }}
                </button>
            </div>
        </div>
        <div class="grid items-center gap-4 rounded-2xl border bg-white p-5 lg:grid-cols-12">
            <FormInputField v-model="filter.name" rounded class="lg:col-span-4" placeholder="Search by role name" /><FormSelectField
                v-model="serverParams.orderBy"
                :clearable="false"
                class="lg:col-span-3"
                labelvalue="name"
                keyvalue="value"
                placeholder="Sort by"
                :select-data="sortByList"
            /><FormSelectField
                v-model="serverParams.orderByDirection"
                class="lg:col-span-3"
                :clearable="false"
                labelvalue="name"
                keyvalue="value"
                placeholder="Direction"
                :select-data="[
                    { name: 'A → Z', value: 'asc' },
                    { name: 'Z → A', value: 'desc' },
                ]"
            />
            <div class="flex gap-2 lg:col-span-2"><button class="btn btn-primary btn-rounded btn-sm flex-1" @click="refresh">Filter</button><button class="btn btn-secondary btn-rounded btn-sm flex-1" @click="resetServerParams">Reset</button></div>
        </div>
        <div class="overflow-hidden rounded-2xl border bg-white">
            <table class="table table-report font-light">
                <thead>
                    <tr class="text-sm uppercase">
                        <th class="w-14"><input v-model="allSelected" type="checkbox" class="form-check-input" :disabled="!rows?.data?.length" @change="selectAllRows" /></th>
                        <th>Role name</th>
                        <th>Page URL / role slug</th>
                        <th>Permissions</th>
                        <th v-if="serverParams.deleted">Deleted at</th>
                        <th class="text-right">Action</th>
                    </tr>
                </thead>
                <tbody>
                    <template v-if="!pending && rows?.data"
                        ><tr v-for="row in rows.data" :key="row.id" class="text-sm">
                            <td><input :checked="isSelected(row.id)" type="checkbox" class="form-check-input" @change="toggleRowSelection(row.id)" /></td>
                            <td>
                                <div class="font-medium text-slate-800">{{ row.name }}</div>
                                <div class="text-xs text-slate-400">Role ID #{{ row.id }}</div>
                            </td>
                            <td>
                                <code class="rounded-lg bg-slate-100 px-2 py-1 text-xs text-primary">{{ row.slug || '—' }}</code>
                            </td>
                            <td>
                                <span class="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{{ row.permissions?.length ?? 0 }} permissions</span>
                            </td>
                            <td v-if="serverParams.deleted">{{ row.deletedAt }}</td>
                            <td class="text-right">
                                <button v-if="canUpdate" :disabled="serverParams.deleted" class="btn btn-secondary btn-rounded btn-sm gap-2" @click="openModal(row.id)"><Icon name="solar:pen-new-round-outline" class="size-4" /> Edit</button>
                            </td>
                        </tr></template
                    ><template v-else
                        ><tr v-for="i in serverParams.perPage" :key="i">
                            <td colspan="6"><div class="h-12 animate-pulse opacity-50" /></td></tr
                    ></template>
                    <tr v-if="!pending && rows?.data?.length === 0">
                        <td colspan="6" class="p-8 text-center text-sm text-slate-500">No roles found.</td>
                    </tr>
                </tbody>
            </table>
        </div>
        <TablePagination :pending="pending" :rows="rows" :page="serverParams.page" @change-page="changePage" />
        <TheModal :open-modal="isOpen" size="6xl" @close-modal="closeModal"
            ><template #header
                ><div class="flex items-center justify-between gap-4">
                    <div>
                        <div class="text-lg font-semibold text-slate-800">{{ editMode ? 'Edit role' : 'Create role' }}</div>
                        <div class="text-xs text-slate-500">Save a name, page URL slug, and page actions.</div>
                    </div>
                    <Icon class="size-7 cursor-pointer opacity-50 transition hover:opacity-100" name="solar:close-square-outline" @click="closeModal" /></div></template
            ><template #content
                ><div class="flex flex-col gap-6">
                    <div class="grid gap-4 md:grid-cols-2">
                        <FormInputField v-model="item.name" :errors="v$.name.$errors" label="Role name" name="name" placeholder="Admin" /><FormInputField
                            v-model="item.slug"
                            :errors="v$.slug.$errors"
                            label="Page URL / slug"
                            name="slug"
                            placeholder="/members-data/members"
                        />
                    </div>
                    <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div class="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <div class="font-semibold text-slate-800">Website pages</div>
                                <div class="text-xs text-slate-500">Each page has exactly five fixed permissions.</div>
                            </div>
                            <div class="relative md:w-72">
                                <Icon name="solar:magnifer-linear" class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input
                                    v-model="pageSearch"
                                    class="form-control rounded-xl bg-white pl-9"
                                    placeholder="Search pages or URL"
                                />
                            </div>
                        </div>
                        <div v-if="permissionsPending" class="rounded-xl bg-white p-8 text-center text-sm text-slate-500">Loading page permissions…</div>
                        <div v-else class="overflow-x-auto rounded-xl bg-white">
                            <table class="min-w-[780px] w-full">
                                <thead>
                                    <tr class="border-b text-left text-xs uppercase text-slate-500">
                                        <th class="p-3">Page</th>
                                        <th v-for="action in PAGE_PERMISSION_ACTIONS" :key="action.key" class="p-3 text-center">{{ action.label }}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="page in visiblePages" :key="pagePermissionKey(page, 'show')" class="border-b last:border-b-0">
                                        <td class="p-3">
                                            <div class="font-medium text-slate-800">{{ page.name }}</div>
                                            <div class="text-xs text-slate-400">{{ page.slug }}</div>
                                        </td>
                                        <td v-for="action in PAGE_PERMISSION_ACTIONS" :key="action.key" class="p-3 text-center">
                                            <label class="inline-flex cursor-pointer flex-col items-center gap-1"
                                                ><input
                                                    type="checkbox"
                                                    class="form-check-input size-5"
                                                    :checked="isActionSelected(page, action.key)"
                                                    :disabled="!pageActionStatus(page, action.key) || formLoading"
                                                    @change="togglePageAction(page, action.key)"
                                                /><span class="text-[10px] text-slate-400">{{ pageActionStatus(page, action.key) ? 'ready' : 'create first' }}</span></label
                                            >
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div></template
            ><template #footer
                ><div class="flex w-full items-center justify-end gap-3">
                    <button :disabled="formLoading" class="btn btn-danger btn-rounded btn-sm px-5" type="button" @click="closeModal">Cancel</button
                    ><button :disabled="formLoading || (editMode ? !canUpdate : !canCreate)" class="btn btn-primary btn-rounded btn-sm px-5" type="button" @click="handleModalSubmit">
                        <Icon :name="formLoading ? 'svg-spinners:3-dots-fade' : 'solar:check-circle-broken'" class="mr-2 size-5" />{{ editMode ? 'Save changes' : 'Create role' }}
                    </button>
                </div></template
            ></TheModal
        >
    </div>
</template>
