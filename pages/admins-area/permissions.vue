<script setup lang="ts">
import { required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';
import { PAGE_PERMISSION_ACTIONS, SITE_PAGES, actionLabel, pagePermissionCandidates, pagePermissionDefinition, pagePermissionKey, type PagePermissionAction } from '~/utils/page-permissions';

definePageMeta({ middleware: ['auth', 'permission'], permissions: ['list-role'] });

type ApiPermission = { id: number; name: string; slug: string };
type PermissionForm = { id?: number; role_id: number | null; name: string; slug: string };

const isOpen = ref(false);
const isEdit = ref(false);
const isSaving = ref(false);
const search = ref('');
const activePage = ref('');
const syncRoleId = ref<number | null>(null);
const form = ref<PermissionForm>({ id: undefined, role_id: null, name: '', slug: '' });
const rules = { role_id: { required }, name: { required }, slug: { required } };
const v$ = useVuelidate(rules, form);
const canCreate = useCheckPermission(['create-role']);
const canUpdate = useCheckPermission(['edit-role']);
const canDelete = useCheckPermission(['delete-role']);

const normalizeCollection = <T,>(response: any): T[] => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.data)) return response.data.data;
    return [];
};

const { data: permissionResponse, pending, refresh } = await useApiFetch('/api/permission', { method: 'GET', query: { page: 1, perPage: 500 } });
const { data: roleResponse } = await useApiFetch('/api/role/index', {
    method: 'POST',
    body: { filters: {}, orderBy: 'name', orderByDirection: 'asc', perPage: 100, page: 1, paginate: false, deleted: false },
});
const permissions = computed<ApiPermission[]>(() => normalizeCollection<ApiPermission>(permissionResponse.value));
const roles = computed(() => normalizeCollection<any>(roleResponse.value));
const visiblePages = computed(() => {
    const term = search.value.trim().toLowerCase();
    return term ? SITE_PAGES.filter((page) => `${page.name} ${page.slug}`.toLowerCase().includes(term)) : SITE_PAGES;
});
const permissionFor = (page: (typeof SITE_PAGES)[number], action: PagePermissionAction) => permissions.value.find((permission) => pagePermissionCandidates(page, action).includes(permission.slug));
const missingCount = computed(() => SITE_PAGES.reduce((count, page) => count + PAGE_PERMISSION_ACTIONS.filter(({ key }) => !permissionFor(page, key)).length, 0));

const resetForm = () => {
    form.value = { id: undefined, role_id: null, name: '', slug: '' };
    v$.value.$reset();
    activePage.value = '';
};
const openCreate = (page = SITE_PAGES[0], action: PagePermissionAction = 'show') => {
    isEdit.value = false;
    resetForm();
    activePage.value = page.slug;
    const definition = pagePermissionDefinition(page, action);
    form.value.name = definition.name;
    form.value.slug = definition.slug;
    isOpen.value = true;
};
const openEdit = (permission: ApiPermission) => {
    isEdit.value = true;
    form.value = { id: permission.id, role_id: null, name: permission.name, slug: permission.slug };
    v$.value.$reset();
    isOpen.value = true;
};
const closeModal = () => {
    if (isSaving.value) return;
    isOpen.value = false;
    resetForm();
};

const syncMissing = async () => {
    if (!canCreate || !syncRoleId.value) {
        useToast({ title: 'Info', message: 'Select the role that should receive the generated permissions first.', type: 'info', duration: 5000 });
        return;
    }
    const definitions = SITE_PAGES.flatMap((page) => PAGE_PERMISSION_ACTIONS.map(({ key }) => ({ page, key })))
        .filter(({ page, key }) => !permissionFor(page, key))
        .map(({ page, key }) => pagePermissionDefinition(page, key));
    if (!definitions.length) {
        useToast({ title: 'Info', message: 'All fixed page permissions already exist.', type: 'info', duration: 5000 });
        return;
    }
    isSaving.value = true;
    const { data, error } = await useApiFetch('/api/permission', { method: 'POST', body: { role_id: syncRoleId.value, permissions: definitions.map(({ name, slug }) => ({ name, slug })) }, lazy: true });
    if (data.value) {
        useToast({ title: 'Success', message: (data.value as any).message ?? 'Page permissions synchronized.', type: 'success', duration: 5000 });
        await refresh();
    }
    if (error.value) useToast({ title: 'Error', message: (error.value as any).data?.message ?? error.value.message, type: 'error', duration: 5000 });
    isSaving.value = false;
};

const savePermission = async () => {
    isSaving.value = true;
    const valid = await v$.value.$validate();
    if (!valid) {
        useToast({ title: 'Error', message: 'Role, name, and slug are required.', type: 'error', duration: 5000 });
        isSaving.value = false;
        return;
    }
    const endpoint = isEdit.value ? `/api/permission/${(form.value as any).id}` : '/api/permission';
    const options: any = {
        method: isEdit.value ? 'PATCH' : 'POST',
        body: isEdit.value ? { name: form.value.name, slug: form.value.slug } : { role_id: form.value.role_id, permissions: [{ name: form.value.name, slug: form.value.slug }] },
        lazy: true,
    };
    const { data, error } = await useApiFetch(endpoint, options);
    if (data.value) {
        useToast({ title: 'Success', message: (data.value as any).message ?? 'Permission saved.', type: 'success', duration: 5000 });
        closeModal();
        await refresh();
    }
    if (error.value) useToast({ title: 'Error', message: (error.value as any).data?.message ?? error.value.message, type: 'error', duration: 5000 });
    isSaving.value = false;
};
const deletePermission = async (permission: ApiPermission) => {
    if (!canDelete || !confirm(`Delete permission ${permission.name}?`)) return;
    const { data, error } = await useApiFetch(`/api/permission/${permission.id}`, { method: 'DELETE', lazy: true });
    if (data.value) {
        useToast({ title: 'Success', message: (data.value as any).message ?? 'Permission deleted.', type: 'success', duration: 5000 });
        await refresh();
    }
    if (error.value) useToast({ title: 'Error', message: (error.value as any).data?.message ?? error.value.message, type: 'error', duration: 5000 });
};
</script>

<template>
    <div class="flex flex-col gap-8">
        <div class="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div class="flex items-start gap-3">
                <div class="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon name="solar:key-square-bold-duotone" class="size-6" /></div>
                <div>
                    <h1 class="text-xl font-semibold text-slate-800">Page permissions</h1>
                    <p class="mt-1 text-sm text-slate-500">Every website page has the same five fixed actions.</p>
                </div>
            </div>
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
                <FormSelectField v-if="canCreate" v-model="syncRoleId" :select-data="roles" labelvalue="name" keyvalue="id" class="sm:w-56" placeholder="Role for sync" /><button
                    v-if="canCreate"
                    class="btn btn-primary btn-rounded btn-sm gap-2"
                    type="button"
                    @click="openCreate()"
                >
                    <Icon name="solar:add-square-linear" class="size-5" /> Add permission</button
                ><button v-if="canCreate" class="btn btn-secondary btn-rounded btn-sm gap-2" type="button" :disabled="isSaving || !missingCount" @click="syncMissing">
                    <Icon name="solar:refresh-circle-linear" class="size-5" /> Sync {{ missingCount }} missing
                </button>
            </div>
        </div>
        <div class="grid gap-4 rounded-2xl border bg-white p-5 md:grid-cols-12 md:items-center">
            <div class="relative md:col-span-8">
                <Icon name="solar:magnifer-linear" class="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" /><input
                    v-model="search"
                    type="search"
                    class="form-control w-full rounded-xl border-slate-200 pl-10"
                    placeholder="Search pages or URLs"
                />
            </div>
            <div class="text-sm text-slate-500 md:col-span-4 md:text-right">{{ SITE_PAGES.length }} pages · {{ missingCount }} definitions missing</div>
        </div>
        <div class="overflow-hidden rounded-2xl border bg-white">
            <div class="overflow-x-auto">
                <table class="min-w-[980px] w-full">
                    <thead>
                        <tr class="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
                            <th class="p-4">Website page</th>
                            <th v-for="action in PAGE_PERMISSION_ACTIONS" :key="action.key" class="p-4 text-center">{{ action.label }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <template v-if="!pending"
                            ><tr v-for="page in visiblePages" :key="page.slug" class="border-b last:border-b-0">
                                <td class="p-4">
                                    <div class="font-medium text-slate-800">{{ page.name }}</div>
                                    <code class="text-xs text-slate-400">{{ page.slug }}</code>
                                </td>
                                <td v-for="action in PAGE_PERMISSION_ACTIONS" :key="pagePermissionKey(page, action.key)" class="p-4 text-center">
                                    <div v-if="permissionFor(page, action.key)" class="flex items-center justify-center gap-2">
                                        <span class="inline-flex size-8 items-center justify-center rounded-full bg-success/15 text-success"><Icon name="solar:check-circle-bold" class="size-5" /></span>
                                        <div class="hidden text-left xl:block">
                                            <div class="text-xs font-medium text-slate-700">{{ permissionFor(page, action.key)?.name }}</div>
                                            <code class="text-[10px] text-slate-400">#{{ permissionFor(page, action.key)?.id }}</code>
                                        </div>
                                        <button v-if="canUpdate" type="button" class="text-slate-400 hover:text-primary" @click="openEdit(permissionFor(page, action.key)!)"><Icon name="solar:pen-new-round-outline" class="size-4" /></button
                                        ><button v-if="canDelete" type="button" class="text-slate-400 hover:text-danger" @click="deletePermission(permissionFor(page, action.key)!)">
                                            <Icon name="solar:trash-bin-minimalistic-linear" class="size-4" />
                                        </button>
                                    </div>
                                    <button v-else-if="canCreate" type="button" class="btn btn-secondary btn-sm rounded-lg" @click="openCreate(page, action.key)">Create {{ actionLabel(action.key) }}</button
                                    ><span v-else class="text-xs text-slate-300">Not defined</span>
                                </td>
                            </tr></template
                        >
                        <tr v-else>
                            <td colspan="6" class="p-10 text-center text-sm text-slate-500">Loading permissions…</td>
                        </tr>
                        <tr v-if="!pending && !visiblePages.length">
                            <td colspan="6" class="p-10 text-center text-sm text-slate-500">No pages found.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <TheModal :open-modal="isOpen" size="4xl" @close-modal="closeModal"
            ><template #header
                ><div class="flex items-center justify-between">
                    <div>
                        <div class="text-lg font-semibold text-slate-800">{{ isEdit ? 'Edit permission' : 'Create permission' }}</div>
                        <div class="text-xs text-slate-500">{{ activePage || 'Create one fixed page action' }}</div>
                    </div>
                    <Icon class="size-7 cursor-pointer opacity-50 transition hover:opacity-100" name="solar:close-square-outline" @click="closeModal" /></div></template
            ><template #content
                ><div class="grid gap-5 md:grid-cols-2">
                    <FormSelectField v-if="!isEdit" v-model="form.role_id" :select-data="roles" :errors="v$.role_id.$errors" labelvalue="name" keyvalue="id" label="Role to receive permission" name="role-id" placeholder="Select role" /><FormInputField
                        v-model="form.name"
                        :errors="v$.name.$errors"
                        label="Permission name"
                        name="permission-name"
                        placeholder="Show Members"
                    /><FormInputField v-model="form.slug" :errors="v$.slug.$errors" label="Permission slug" name="permission-slug" placeholder="show-members" /></div></template
            ><template #footer
                ><div class="flex w-full items-center justify-end gap-3">
                    <button class="btn btn-danger btn-rounded btn-sm px-5" type="button" :disabled="isSaving" @click="closeModal">Cancel</button
                    ><button class="btn btn-primary btn-rounded btn-sm px-5" type="button" :disabled="isSaving || (isEdit ? !canUpdate : !canCreate)" @click="savePermission">
                        <Icon :name="isSaving ? 'svg-spinners:3-dots-fade' : 'solar:check-circle-broken'" class="mr-2 size-5" />Save
                    </button>
                </div></template
            ></TheModal
        >
    </div>
</template>
