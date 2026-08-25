<script setup lang="ts">
import { required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';

definePageMeta({
    middleware: ['auth', 'permission'],
    permissions: ['list-role'],
});

type PermissionRecord = {
    id: number;
    name: string;
    slug: string;
    parentId?: number | null;
};

type PermissionDraft = {
    role_id: number | null;
    permissions: { name: string; slug: string }[];
};

type PermissionUpdateDraft = {
    role_id: number | null;
    permissions: { permission_id: number }[];
};

type Role = {
    id: number;
    name: string;
};

const canCreatePermission = useCheckPermission(['create-role']);
const isOpen = ref(false);
const isSaving = ref(false);
const search = ref('');
const form = ref<PermissionDraft>({ role_id: null, permissions: [{ name: '', slug: '' }] });
const rules = { role_id: { required } };
const v$ = useVuelidate(rules, form);

// Update related refs
const isEditModalOpen = ref(false);
const editingRoleId = ref<number | null>(null);
const updateForm = ref<PermissionUpdateDraft>({ role_id: null, permissions: [] });
const isUpdating = ref(false);

const normalizeCollection = <T,>(response: any): T[] => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.data)) return response.data.data;
    return [];
};

const {
    data: permissionResponse,
    pending,
    refresh,
} = await useApiFetch('/api/permission', {
    method: 'GET',
    query: { page: 1, perPage: 100 },
});

const { data: roles } = await useApiFetch('/api/role/index', {
    method: 'POST',
    body: {
        filters: {},
        orderBy: 'name',
        orderByDirection: 'asc',
        perPage: 100,
        page: 1,
        paginate: false,
        deleted: false,
    },
    transform: (response: any) => normalizeCollection(response),
});

const permissions = computed<PermissionRecord[]>(() => normalizeCollection<PermissionRecord>(permissionResponse.value));
const filteredPermissions = computed(() => {
    const term = search.value.trim().toLowerCase();
    if (!term) return permissions.value;
    return permissions.value.filter((permission) => `${permission.name} ${permission.slug}`.toLowerCase().includes(term));
});

const resetForm = () => {
    form.value = { role_id: null, permissions: [{ name: '', slug: '' }] };
    v$.value.$reset();
};

const openCreateModal = () => {
    resetForm();
    isOpen.value = true;
};

const closeModal = () => {
    if (isSaving.value) return;
    isOpen.value = false;
    resetForm();
};

const addPermissionRow = () => form.value.permissions.push({ name: '', slug: '' });
const removePermissionRow = (index: number) => {
    if (form.value.permissions.length === 1) return;
    form.value.permissions.splice(index, 1);
};

const savePermissions = async () => {
    isSaving.value = true;
    const valid = await v$.value.$validate();
    const permissionsToCreate = form.value.permissions.map((permission) => ({ name: permission.name.trim(), slug: permission.slug.trim() })).filter((permission) => permission.name && permission.slug);

    if (!valid || !permissionsToCreate.length) {
        useToast({ title: 'Error', message: 'Choose a role and enter at least one permission name and slug.', type: 'error', duration: 5000 });
        isSaving.value = false;
        return;
    }

    const { data, error } = await useApiFetch('/api/permission', {
        method: 'POST',
        body: { role_id: form.value.role_id, permissions: permissionsToCreate },
        lazy: true,
    });

    if (data.value) {
        useToast({ title: 'Success', message: (data.value as any).message ?? 'Permissions created successfully.', type: 'success', duration: 5000 });
        closeModal();
        await refresh();
    }
    if (error.value) {
        useToast({ title: 'Error', message: (error.value as any).data?.message ?? error.value.message, type: 'error', duration: 5000 });
    }
    isSaving.value = false;
};

// Update functions
const fetchRolePermissions = async (roleId: number) => {
    try {
        const { data, error } = await useApiFetch(`/api/role/${roleId}`, {
            method: 'GET',
        });

        if (data.value) {
            const roleData = data.value as any;
            updateForm.value = {
                role_id: roleId,
                permissions:
                    roleData.permissions?.map((p: any) => ({
                        permission_id: p.permission_id,
                    })) || [],
            };
            editingRoleId.value = roleId;
            isEditModalOpen.value = true;
        }

        if (error.value) {
            useToast({
                title: 'Error',
                message: 'Failed to fetch role permissions',
                type: 'error',
                duration: 5000,
            });
        }
    } catch (error) {
        console.error('Error fetching role permissions:', error);
        useToast({
            title: 'Error',
            message: 'Failed to fetch role permissions',
            type: 'error',
            duration: 5000,
        });
    }
};

const updatePermissions = async () => {
    isUpdating.value = true;

    if (!updateForm.value.role_id) {
        useToast({
            title: 'Error',
            message: 'Please select a role.',
            type: 'error',
            duration: 5000,
        });
        isUpdating.value = false;
        return;
    }

    try {
        const role = roles.value?.find((r: any) => r.id === updateForm.value.role_id);

        const { data, error } = await useApiFetch(`/api/role/${updateForm.value.role_id}`, {
            method: 'PUT',
            body: {
                name: role?.name || '',
                permissions: updateForm.value.permissions,
            },
            lazy: true,
        });

        if (data.value) {
            useToast({
                title: 'Success',
                message: (data.value as any).message ?? 'Permissions updated successfully.',
                type: 'success',
                duration: 5000,
            });
            closeEditModal();
            await refresh();
        }

        if (error.value) {
            useToast({
                title: 'Error',
                message: (error.value as any).data?.message ?? error.value.message,
                type: 'error',
                duration: 5000,
            });
        }
    } catch (error) {
        console.error('Error updating permissions:', error);
        useToast({
            title: 'Error',
            message: 'Failed to update permissions',
            type: 'error',
            duration: 5000,
        });
    } finally {
        isUpdating.value = false;
    }
};

const openEditModal = (roleId: number) => {
    fetchRolePermissions(roleId);
};

const closeEditModal = () => {
    if (isUpdating.value) return;
    isEditModalOpen.value = false;
    updateForm.value = { role_id: null, permissions: [] };
    editingRoleId.value = null;
};

const addPermissionToUpdate = () => {
    updateForm.value.permissions.push({ permission_id: 0 });
};

const removePermissionFromUpdate = (index: number) => {
    if (updateForm.value.permissions.length === 1) return;
    updateForm.value.permissions.splice(index, 1);
};

// Get available permissions for the update dropdown
const availablePermissions = computed(() => {
    return permissions.value.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
    }));
});

// Get role name for the edit modal header
const selectedRoleName = computed(() => {
    if (!updateForm.value.role_id) return '';
    const role = roles.value?.find((r: any) => r.id === updateForm.value.role_id);
    return role?.name || '';
});
</script>

<template>
    <div class="flex flex-col gap-8">
        <!-- Header Section -->
        <div class="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div class="flex items-start gap-3">
                <div class="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon name="solar:key-square-bold-duotone" class="size-6" />
                </div>
                <div>
                    <h1 class="text-xl font-semibold text-slate-800">Permission catalog</h1>
                    <p class="mt-1 text-sm text-slate-500">Create reusable permissions and assign them to a role.</p>
                </div>
            </div>
            <button v-if="canCreatePermission" class="btn btn-primary btn-rounded btn-sm gap-2" type="button" @click="openCreateModal"><Icon name="solar:add-square-linear" class="size-5" /> Create permissions</button>
        </div>

        <!-- Search Section -->
        <div class="grid gap-4 rounded-2xl border bg-white p-5 md:grid-cols-12 md:items-center">
            <div class="relative md:col-span-8">
                <Icon name="solar:magnifer-linear" class="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                <input v-model="search" type="search" class="form-control w-full rounded-xl border-slate-200 pl-10" placeholder="Search by permission name or slug" />
            </div>
            <div class="text-sm text-slate-500 md:col-span-4 md:text-right">{{ filteredPermissions.length }} of {{ permissions.length }} permissions</div>
        </div>

        <!-- Roles Section -->
        <div v-if="roles?.length" class="rounded-2xl border bg-white p-5">
            <h3 class="mb-4 font-semibold text-slate-800">Manage Role Permissions</h3>
            <div class="flex flex-wrap gap-3">
                <button v-for="role in roles" :key="role.id" class="btn btn-secondary btn-sm rounded-xl" @click="openEditModal(role.id)">
                    <Icon name="solar:pen-linear" class="size-4" />
                    Edit {{ role.name }}
                </button>
            </div>
        </div>

        <!-- Permissions Table -->
        <div class="overflow-hidden rounded-2xl border bg-white">
            <table class="table table-report font-light">
                <thead>
                    <tr class="text-sm uppercase">
                        <th class="w-20">ID</th>
                        <th>Name</th>
                        <th>Slug</th>
                        <th>Parent ID</th>
                    </tr>
                </thead>
                <tbody>
                    <template v-if="!pending">
                        <tr v-for="permission in filteredPermissions" :key="permission.id" class="text-sm">
                            <td class="font-medium text-slate-500">#{{ permission.id }}</td>
                            <td class="font-medium text-slate-800">{{ permission.name }}</td>
                            <td>
                                <code class="rounded-lg bg-slate-100 px-2 py-1 text-xs text-primary">{{ permission.slug }}</code>
                            </td>
                            <td class="text-slate-500">{{ permission.parentId ?? '—' }}</td>
                        </tr>
                        <tr v-if="filteredPermissions.length === 0">
                            <td colspan="4" class="p-8 text-center text-sm text-slate-500">No permissions found.</td>
                        </tr>
                    </template>
                    <template v-else>
                        <tr v-for="i in 8" :key="i">
                            <td colspan="4"><div class="h-12 animate-pulse opacity-50" /></td>
                        </tr>
                    </template>
                </tbody>
            </table>
        </div>

        <!-- Create Modal -->
        <TheModal :open-modal="isOpen" size="5xl" @close-modal="closeModal">
            <template #header>
                <div class="flex items-center justify-between gap-4">
                    <div>
                        <div class="text-lg font-semibold text-slate-800">Create permissions</div>
                        <div class="text-xs text-slate-500">New permissions will appear in the Role permissions matrix.</div>
                    </div>
                    <Icon class="size-7 cursor-pointer opacity-50 transition hover:opacity-100" name="solar:close-square-outline" @click="closeModal" />
                </div>
            </template>
            <template #content>
                <div class="flex flex-col gap-5">
                    <FormSelectField v-model="form.role_id" :select-data="roles" :errors="v$.role_id.$errors" labelvalue="name" keyvalue="id" label="Assign to role" name="role-id" placeholder="Select a role" />
                    <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div class="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <div class="font-semibold text-slate-800">Permission definitions</div>
                                <div class="text-xs text-slate-500">Use a readable name and a unique slug, for example `View reports` / `view-reports`.</div>
                            </div>
                            <button type="button" class="btn btn-secondary btn-sm rounded-xl" :disabled="isSaving" @click="addPermissionRow"><Icon name="solar:add-circle-linear" class="size-4" /> Add row</button>
                        </div>
                        <div class="flex flex-col gap-3">
                            <div v-for="(permission, index) in form.permissions" :key="index" class="grid gap-3 md:grid-cols-12">
                                <input v-model="permission.name" class="form-control rounded-xl bg-white md:col-span-5" placeholder="Permission name" />
                                <input v-model="permission.slug" class="form-control rounded-xl bg-white md:col-span-6" placeholder="permission-slug" />
                                <button type="button" class="btn btn-danger btn-sm rounded-xl md:col-span-1" :disabled="form.permissions.length === 1 || isSaving" aria-label="Remove permission" @click="removePermissionRow(index)">
                                    <Icon name="solar:trash-bin-minimalistic-linear" class="size-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
            <template #footer>
                <div class="flex w-full items-center justify-end gap-3">
                    <button class="btn btn-danger btn-rounded btn-sm px-5" type="button" :disabled="isSaving" @click="closeModal">Cancel</button>
                    <button class="btn btn-primary btn-rounded btn-sm px-5" type="button" :disabled="isSaving" @click="savePermissions">
                        <Icon :name="isSaving ? 'svg-spinners:3-dots-fade' : 'solar:check-circle-broken'" class="mr-2 size-5" />Save permissions
                    </button>
                </div>
            </template>
        </TheModal>

        <!-- Update Modal -->
        <TheModal :open-modal="isEditModalOpen" size="5xl" @close-modal="closeEditModal">
            <template #header>
                <div class="flex items-center justify-between gap-4">
                    <div>
                        <div class="text-lg font-semibold text-slate-800">Update permissions for {{ selectedRoleName }}</div>
                        <div class="text-xs text-slate-500">Select the permissions you want to assign to this role.</div>
                    </div>
                    <Icon class="size-7 cursor-pointer opacity-50 transition hover:opacity-100" name="solar:close-square-outline" @click="closeEditModal" />
                </div>
            </template>
            <template #content>
                <div class="flex flex-col gap-5">
                    <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div class="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <div class="font-semibold text-slate-800">Permission assignments</div>
                                <div class="text-xs text-slate-500">Select permission IDs to assign to this role.</div>
                            </div>
                            <button type="button" class="btn btn-secondary btn-sm rounded-xl" :disabled="isUpdating" @click="addPermissionToUpdate"><Icon name="solar:add-circle-linear" class="size-4" /> Add permission</button>
                        </div>
                        <div class="flex flex-col gap-3">
                            <div v-for="(permission, index) in updateForm.permissions" :key="index" class="grid gap-3 md:grid-cols-12">
                                <select v-model="permission.permission_id" class="form-control rounded-xl bg-white md:col-span-10">
                                    <option value="0">Select a permission...</option>
                                    <option v-for="p in availablePermissions" :key="p.id" :value="p.id">{{ p.name }} ({{ p.slug }})</option>
                                </select>
                                <button type="button" class="btn btn-danger btn-sm rounded-xl md:col-span-2" :disabled="updateForm.permissions.length === 1 || isUpdating" aria-label="Remove permission" @click="removePermissionFromUpdate(index)">
                                    <Icon name="solar:trash-bin-minimalistic-linear" class="size-4" /> Remove
                                </button>
                            </div>
                            <div v-if="updateForm.permissions.length === 0" class="text-center text-sm text-slate-500">No permissions assigned. Add a permission to get started.</div>
                        </div>
                    </div>
                </div>
            </template>
            <template #footer>
                <div class="flex w-full items-center justify-end gap-3">
                    <button class="btn btn-danger btn-rounded btn-sm px-5" type="button" :disabled="isUpdating" @click="closeEditModal">Cancel</button>
                    <button class="btn btn-primary btn-rounded btn-sm px-5" type="button" :disabled="isUpdating" @click="updatePermissions">
                        <Icon :name="isUpdating ? 'svg-spinners:3-dots-fade' : 'solar:check-circle-broken'" class="mr-2 size-5" />Update permissions
                    </button>
                </div>
            </template>
        </TheModal>
    </div>
</template>
