<script setup lang="ts">
import { required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';
import { permissionSlug, type RbacAction } from '~/utils/rbac';

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

const canCreatePermission = useCheckPermission(['create-role']);
const isOpen = ref(false);
const isSaving = ref(false);
const search = ref('');
const form = ref<PermissionDraft>({ role_id: null, permissions: [{ name: '', slug: '' }] });
const resourceDraft = ref('');
const actionDraft = ref<RbacAction[]>(['list']);
const actionOptions: { label: string; value: RbacAction }[] = [
    { label: 'Show', value: 'list' },
    { label: 'Create', value: 'create' },
    { label: 'Update', value: 'edit' },
    { label: 'Delete', value: 'delete' },
    { label: 'Restore', value: 'restore' },
    { label: 'Force Delete', value: 'force-delete' },
];
const rules = { role_id: { required } };
const v$ = useVuelidate(rules, form);

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
    resourceDraft.value = '';
    actionDraft.value = ['list'];
    v$.value.$reset();
};

const generateCrudPermissions = () => {
    const resource = resourceDraft.value.trim();
    if (!resource || !actionDraft.value.length) {
        useToast({ title: 'Error', message: 'Enter a resource name and select at least one action.', type: 'error', duration: 5000 });
        return;
    }

    form.value.permissions = actionDraft.value.map((action) => ({
        name: `${actionOptions.find((option) => option.value === action)?.label ?? action} ${resource}`,
        slug: permissionSlug(resource, action),
    }));
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
</script>

<template>
    <div class="flex flex-col gap-8">
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

        <div class="grid gap-4 rounded-2xl border bg-white p-5 md:grid-cols-12 md:items-center">
            <div class="relative md:col-span-8">
                <Icon name="solar:magnifer-linear" class="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                <input v-model="search" type="search" class="form-control w-full rounded-xl border-slate-200 pl-10" placeholder="Search by permission name or slug" />
            </div>
            <div class="text-sm text-slate-500 md:col-span-4 md:text-right">{{ filteredPermissions.length }} of {{ permissions.length }} permissions</div>
        </div>

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
                    <div class="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                        <div class="mb-3">
                            <div class="font-semibold text-slate-800">Generate CRUD permissions automatically</div>
                            <div class="text-xs text-slate-500">Enter `member`, select actions, and the system generates names and slugs such as `create-member`.</div>
                        </div>
                        <div class="grid gap-3 md:grid-cols-12 md:items-end">
                            <div class="md:col-span-4"><label class="mb-1 block text-xs font-medium text-slate-600">Resource</label><input v-model="resourceDraft" class="form-control rounded-xl bg-white" placeholder="member" /></div>
                            <div class="flex flex-wrap gap-2 md:col-span-6">
                                <label v-for="option in actionOptions" :key="option.value" class="flex cursor-pointer items-center gap-2 rounded-lg bg-white px-2 py-2 text-xs text-slate-600"
                                    ><input v-model="actionDraft" type="checkbox" class="form-check-input" :value="option.value" />{{ option.label }}</label
                                >
                            </div>
                            <button type="button" class="btn btn-primary btn-sm rounded-xl md:col-span-2" :disabled="isSaving" @click="generateCrudPermissions"><Icon name="solar:magic-stick-3-linear" class="size-4" /> Generate</button>
                        </div>
                    </div>
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
    </div>
</template>
