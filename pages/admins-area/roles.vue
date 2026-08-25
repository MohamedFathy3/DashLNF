<script setup lang="ts">
import { required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';

definePageMeta({
    middleware: ['auth', 'permission'],
    permissions: ['list-role'],
});

type ApiPermission = {
    id: number;
    name: string;
    slug: string;
};

type RoleForm = {
    id?: number;
    name: string | null;
    permissions: { permission_id: number }[];
};

const selectedRows = ref<number[]>([]);
const filter = ref({ name: null as string | null });
const serverParams = ref({
    filters: {},
    orderBy: 'id',
    orderByDirection: 'asc',
    perPage: 25,
    page: 1,
    paginate: true,
    deleted: false,
});
const formLoading = ref(false);
const isOpen = ref(false);
const editMode = ref(false);
const item = ref<RoleForm>({ name: null, permissions: [] });
const rules = { name: { required } };
const v$ = useVuelidate(rules, item);

const canCreate = useCheckPermission(['create-role']);
const canUpdate = useCheckPermission(['edit-role']);
const canDelete = useCheckPermission(['delete-role']);
const canRestore = useCheckPermission(['restore-role']);
const canForceDelete = useCheckPermission(['force-delete-role']);

const sortByList = [
    { name: 'Sort by ID', value: 'id' },
    { name: 'Sort by name', value: 'name' },
];

const {
    data: rows,
    pending,
    refresh,
} = await useApiFetch('/api/role/index', {
    method: 'POST',
    body: serverParams,
});

const { data: permissions, pending: permissionsPending } = await useApiFetch<ApiPermission[]>('/api/permission', {
    method: 'GET',
    query: { page: 1, perPage: 100 },
    transform: (response: any) => response?.data ?? [],
});

watch(
    filter,
    (newValue) => {
        serverParams.value.filters = newValue.name ? { name: newValue.name } : {};
    },
    { deep: true },
);

const resetServerParams = async () => {
    filter.value = { name: null };
    serverParams.value = {
        filters: {},
        orderBy: 'id',
        orderByDirection: 'asc',
        perPage: 25,
        page: 1,
        paginate: true,
        deleted: false,
    };
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
    if (allSelected.value) {
        selectedRows.value = [];
    } else {
        selectedRows.value = data.map((row: any) => row.id);
    }
};

const toggleRowSelection = (id: number) => {
    selectedRows.value = isSelected(id) ? selectedRows.value.filter((rowId) => rowId !== id) : [...selectedRows.value, id];
};

const changePage = async (value: string | number) => {
    const pageNumber = Number.parseInt(String(value), 10);
    if (Number.isNaN(pageNumber)) return;
    serverParams.value.page = pageNumber;
    selectedRows.value = [];
    await refresh();
};

const resetItemValues = () => {
    item.value = { name: null, permissions: [] };
};

const normalizeRole = (role: any): RoleForm => ({
    id: role.id,
    name: role.name ?? null,
    permissions: (role.permissions ?? [])
        .map((permission: any) => permission?.permission_id ?? permission?.permissionId ?? permission?.id)
        .filter((id: unknown): id is number => typeof id === 'number')
        .map((permission_id: number) => ({ permission_id })),
});

const fetchItem = async (id: number) => {
    const { data, error } = await useApiFetch(`/api/role/${id}`, { lazy: true });
    if (data.value) item.value = normalizeRole((data.value as any).data);
    if (error.value) {
        useToast({ title: 'Error', message: (error.value as any).data?.message ?? error.value.message, type: 'error', duration: 5000 });
    }
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

const requestBody = () => ({
    name: item.value.name,
    permissions: item.value.permissions.map(({ permission_id }) => ({ permission_id })),
});

const saveItem = async () => {
    const endpoint = editMode.value ? `/api/role/${item.value.id}` : '/api/role';
    const { data, error } = await useApiFetch(endpoint, {
        method: editMode.value ? 'PATCH' : 'POST',
        body: requestBody(),
        lazy: true,
    });

    if (data.value) {
        useToast({ title: 'Success', message: (data.value as any).message ?? 'Role saved successfully', type: 'success', duration: 5000 });
        closeModal();
        await refresh();
    }
    if (error.value) {
        useToast({ title: 'Error', message: (error.value as any).data?.message ?? error.value.message, type: 'error', duration: 5000 });
    }
};

const handleModalSubmit = async () => {
    formLoading.value = true;
    const valid = await v$.value.$validate();
    if (!valid) {
        useToast({ title: 'Error', message: 'Please enter a role name.', type: 'error', duration: 5000 });
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
    const { data, error } = await useApiFetch(`/api/role/${endpoint}`, {
        method,
        body: { items: selectedRows.value },
        lazy: true,
    });
    if (data.value) {
        useToast({ title: 'Success', message: (data.value as any).message ?? 'Action completed successfully', type: 'success', duration: 5000 });
        selectedRows.value = [];
        await refresh();
    }
    if (error.value) {
        useToast({ title: 'Error', message: (error.value as any).data?.message ?? error.value.message, type: 'error', duration: 5000 });
    }
};

const deleteItems = () => runBulkAction('delete', 'DELETE', 'Are you sure you want to delete the selected role(s)?');
const forceDeleteItems = () => runBulkAction('force-delete', 'DELETE', 'Permanently delete the selected role(s)? This cannot be undone.');
const restoreItems = () => runBulkAction('restore', 'POST', 'Restore the selected role(s)?');
</script>

<template>
    <div class="flex flex-col gap-8">
        <div class="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div class="flex items-start gap-3">
                <div class="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon name="solar:shield-keyhole-bold-duotone" class="size-6" />
                </div>
                <div>
                    <h1 class="text-xl font-semibold text-slate-800">{{ serverParams.deleted ? 'Deleted roles' : 'Roles & permissions' }}</h1>
                    <p class="mt-1 text-sm text-slate-500">Manage access through reusable roles and precise actions.</p>
                </div>
            </div>
            <div class="flex flex-col gap-3 sm:flex-row">
                <template v-if="selectedRows.length">
                    <button v-if="serverParams.deleted && canForceDelete" class="btn btn-danger btn-rounded btn-sm gap-2" @click="forceDeleteItems"><Icon name="solar:trash-bin-minimalistic-line-duotone" class="size-5" /> Permanently delete</button>
                    <button v-else-if="!serverParams.deleted && canDelete" class="btn btn-danger btn-rounded btn-sm gap-2" @click="deleteItems"><Icon name="solar:trash-bin-minimalistic-line-duotone" class="size-5" /> Delete</button>
                    <button v-if="serverParams.deleted && canRestore" class="btn btn-success btn-rounded btn-sm gap-2" @click="restoreItems"><Icon name="solar:restart-circle-outline" class="size-5" /> Restore</button>
                </template>
                <button v-if="canCreate" :disabled="serverParams.deleted" class="btn btn-primary btn-rounded btn-sm gap-2" @click="openModal()"><Icon name="solar:add-square-linear" class="size-5" /> Add role</button>
                <button class="btn btn-secondary btn-rounded btn-sm gap-2" @click="toggleDeleted">
                    <Icon :name="serverParams.deleted ? 'solar:hamburger-menu-line-duotone' : 'solar:trash-bin-minimalistic-line-duotone'" class="size-5" />
                    {{ serverParams.deleted ? 'Roles list' : 'Deleted roles' }}
                </button>
            </div>
        </div>

        <div class="grid items-center gap-4 rounded-2xl border bg-white p-5 lg:grid-cols-12">
            <FormInputField v-model="filter.name" rounded class="lg:col-span-4" placeholder="Search by role name" />
            <FormSelectField v-model="serverParams.orderBy" :clearable="false" class="lg:col-span-3" labelvalue="name" keyvalue="value" placeholder="Sort by" :select-data="sortByList" />
            <FormSelectField
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
            <div class="flex gap-2 lg:col-span-2">
                <button class="btn btn-primary btn-rounded btn-sm flex-1" @click="refresh">Filter</button>
                <button class="btn btn-secondary btn-rounded btn-sm flex-1" @click="resetServerParams">Reset</button>
            </div>
        </div>

        <div class="overflow-hidden rounded-2xl border bg-white">
            <table class="table table-report font-light">
                <thead>
                    <tr class="text-sm uppercase">
                        <th class="w-14 text-left"><input v-model="allSelected" type="checkbox" class="form-check-input" :disabled="!rows?.data?.length" @change="selectAllRows" /></th>
                        <th class="text-left">Role</th>
                        <th class="text-left">Permissions</th>
                        <th v-if="serverParams.deleted" class="text-left">Deleted at</th>
                        <th class="text-right">Action</th>
                    </tr>
                </thead>
                <tbody>
                    <template v-if="!pending && rows?.data">
                        <tr v-for="row in rows.data" :key="row.id" class="text-sm">
                            <td><input :checked="isSelected(row.id)" type="checkbox" class="form-check-input" @change="toggleRowSelection(row.id)" /></td>
                            <td>
                                <div class="font-medium text-slate-800">{{ row.name }}</div>
                                <div class="text-xs text-slate-400">Role ID #{{ row.id }}</div>
                            </td>
                            <td>
                                <span class="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{{ row.permissions?.length ?? 0 }} permissions</span>
                            </td>
                            <td v-if="serverParams.deleted" class="text-sm">{{ row.deletedAt }}</td>
                            <td class="text-right">
                                <button v-if="canUpdate" :disabled="serverParams.deleted" class="btn btn-secondary btn-rounded btn-sm gap-2" @click="openModal(row.id)"><Icon name="solar:pen-new-round-outline" class="size-4" /> Edit</button>
                            </td>
                        </tr>
                    </template>
                    <template v-else>
                        <tr v-for="i in serverParams.perPage" :key="i">
                            <td colspan="5"><div class="h-12 animate-pulse opacity-50" /></td>
                        </tr>
                    </template>
                    <tr v-if="!pending && rows?.data?.length === 0">
                        <td colspan="5" class="p-8 text-center text-sm text-slate-500">No roles found.</td>
                    </tr>
                </tbody>
            </table>
        </div>
        <TablePagination :pending="pending" :rows="rows" :page="serverParams.page" @change-page="changePage" />

        <TheModal :open-modal="isOpen" size="6xl" @close-modal="closeModal">
            <template #header>
                <div class="flex items-center justify-between gap-4">
                    <div>
                        <div class="text-lg font-semibold text-slate-800">{{ editMode ? 'Edit role' : 'Create role' }}</div>
                        <div class="text-xs text-slate-500">Assign only the access this role needs.</div>
                    </div>
                    <Icon class="size-7 cursor-pointer opacity-50 transition hover:opacity-100" name="solar:close-square-outline" @click="closeModal" />
                </div>
            </template>
            <template #content>
                <div class="flex flex-col gap-6">
                    <FormInputField v-model="item.name" :errors="v$.name.$errors" label="Role name" name="name" placeholder="e.g. Content Manager" />
                    <div v-if="permissionsPending" class="rounded-2xl border border-dashed p-8 text-center text-sm text-slate-500">Loading permissions…</div>
                    <AdminRolePermissionMatrix v-else v-model="item.permissions" :permissions="permissions ?? []" :disabled="formLoading" />
                </div>
            </template>
            <template #footer>
                <div class="flex w-full items-center justify-end gap-3">
                    <button :disabled="formLoading" class="btn btn-danger btn-rounded btn-sm px-5" type="button" @click="closeModal">Cancel</button>
                    <button :disabled="formLoading || (editMode ? !canUpdate : !canCreate)" class="btn btn-primary btn-rounded btn-sm px-5" type="button" @click="handleModalSubmit">
                        <Icon :name="formLoading ? 'svg-spinners:3-dots-fade' : 'solar:check-circle-broken'" class="mr-2 size-5" /> {{ editMode ? 'Save changes' : 'Create role' }}
                    </button>
                </div>
            </template>
        </TheModal>
    </div>
</template>
