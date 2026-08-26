<script setup>
import { email, required, requiredIf } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';

definePageMeta({
    middleware: ['auth', 'permission'],
    permissions: ['show-admins-area-admins'],
});

// ========== Permissions ==========
const pageSlug = 'admins-area-admins';
const canCreate = useCheckPermission([`create-${pageSlug}`]);
const canUpdate = useCheckPermission([`update-${pageSlug}`]);
const canDelete = useCheckPermission([`delete-${pageSlug}`]);
const canForceDelete = useCheckPermission([`forceDelete-${pageSlug}`]);
const canRestore = useCheckPermission([`restore-${pageSlug}`]);
const canShow = useCheckPermission([`show-${pageSlug}`]);
// ========== End Permissions ==========

// Get current user from auth store
const { $auth } = useNuxtApp();
const currentUser = computed(() => $auth?.user || {});
const isCurrentUserSuperAdmin = computed(() => currentUser.value?.superAdmin === true);

const selectedRows = ref([]);
const sortByList = ref([
    { name: 'Sort By ID', value: 'id' },
    { name: 'Sort By Name', value: 'name' },
]);
const filter = ref({
    name: null,
});

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

const resetServerParams = async () => {
    filter.value = {
        name: null,
    };
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

const {
    data: rows,
    pending,
    refresh,
} = await useApiFetch('/api/admin/index', {
    method: 'POST',
    body: serverParams,
    lazy: true,
});

const { data: roles, refresh: refreshRoles } = await useApiFetch('/api/role/index', {
    method: 'POST',
    body: {
        filters: {},
        orderBy: 'name',
        orderByDirection: 'asc',
        perPage: 25,
        page: 1,
        paginate: false,
        deleted: false,
    },
    transform: (roles) => roles.data,
    lazy: true,
});

const { data: permissionResponse } = await useApiFetch('/api/permission', {
    method: 'GET',
    query: { page: 1, perPage: 100 },
});

const normalizeCollection = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.data)) return response.data.data;
    return [];
};

const permissionCatalog = computed(() => normalizeCollection(permissionResponse.value));
const extraPermissionIds = ref([]);

const extraPermissionSelection = computed({
    get: () => extraPermissionIds.value.map((permission_id) => ({ permission_id })),
    set: (value) => {
        extraPermissionIds.value = value.map(({ permission_id }) => permission_id);
    },
});

// Ref for the permission matrix
const permissionMatrixRef = ref();

watch(
    filter,
    (newVal) => {
        for (const key in newVal) {
            const value = newVal[key];
            if (value) {
                serverParams.value.filters[key] = value;
            } else {
                delete serverParams.value.filters[key];
            }
        }
    },
    { deep: true },
);

const toggleDeleted = async () => {
    serverParams.value.deleted = !serverParams.value.deleted;
    selectedRows.value = [];
    await refresh();
};

const isSelected = (id) => {
    return selectedRows.value.some((r) => r === id);
};

const allSelected = computed(() => {
    return rows.value?.data?.every((row) => selectedRows.value.includes(row.id)) || false;
});

const selectAllRows = () => {
    if (!rows.value?.data) return;
    const allSelected = rows.value.data.every((row) => isSelected(row.id));
    if (allSelected) {
        selectedRows.value = [];
    } else {
        rows.value.data.forEach((row) => {
            const id = row.id;
            if (!isSelected(id)) {
                selectedRows.value.push(id);
            }
        });
    }
};

const changePage = async (value) => {
    const pageNumber = parseInt(value);
    if (!isNaN(pageNumber)) {
        serverParams.value.page = pageNumber;
    } else {
        console.error('Invalid page number:', value);
    }
    selectedRows.value = [];
    await refresh();
};

const toggleRowSelection = (id) => {
    const index = selectedRows.value.indexOf(id);
    if (index === -1) {
        selectedRows.value.push(id);
    } else {
        selectedRows.value.splice(index, 1);
    }
};

const item = ref({
    name: null,
    roleId: null,
    email: null,
    password: null,
    superAdmin: true,
});

const rules = ref({
    name: { required },
    roleId: {},
    email: { required, email },
    password: { required: requiredIf(() => editMode.value === false) },
    superAdmin: {},
});

const v$ = useVuelidate(rules, item);

const fetchItem = async (id) => {
    const { data, error } = await useApiFetch(`/api/admin/${id}`, {
        lazy: true,
    });
    if (data.value) {
        item.value = data.value.data;
        // If superAdmin is true, clear extra permissions
        if (item.value.superAdmin) {
            extraPermissionIds.value = [];
        } else {
            extraPermissionIds.value = (data.value.data.extra_permissions ?? []).map((permission) => permission.id);
        }
        // Update matrix mode
        if (permissionMatrixRef.value) {
            permissionMatrixRef.value.setSuperAdminMode(item.value.superAdmin);
        }
    }
    if (error.value) {
        useToast({ title: 'Error', message: error.value.message, type: 'error', duration: 5000 });
    }
};

const resetItemValues = async () => {
    item.value = {
        name: null,
        roleId: null,
        email: null,
        password: null,
        superAdmin: true,
    };
    extraPermissionIds.value = [];
};

async function closeModal() {
    isOpen.value = false;
    editMode.value = false;
    v$.value.$reset();
    await resetItemValues();
    await refreshRoles();
}

async function openModal(id = null) {
    formLoading.value = true;
    if (id !== null) {
        editMode.value = true;
        await fetchItem(id);
    } else {
        editMode.value = false;
    }
    formLoading.value = false;
    isOpen.value = true;
}

async function saveExtraPermissions() {
    // If superAdmin is true, clear all extra permissions
    if (item.value.superAdmin) {
        extraPermissionIds.value = [];
        return true;
    }

    if (!item.value.id || item.value.roleId === null || item.value.roleId === undefined) return true;

    const { data, error } = await useApiFetch(`/api/admins/${item.value.id}/role-permissions`, {
        method: 'PUT',
        body: {
            role_id: item.value.roleId,
            permissions: extraPermissionIds.value,
        },
        lazy: true,
    });

    if (error.value) {
        useToast({ title: 'Error', message: error.value.data?.message ?? error.value.message, type: 'error', duration: 5000 });
        return false;
    }

    return Boolean(data.value);
}

async function updateItem() {
    const { data, error } = await useApiFetch(`/api/admin/${item.value.id}`, {
        method: 'PATCH',
        body: item,
        lazy: true,
    });
    if (data.value) {
        const extraSaved = await saveExtraPermissions();
        if (!extraSaved) return;
        useToast({ title: 'Success', message: data.value.message, type: 'success', duration: 5000 });
        await closeModal();
        await refresh();
    }
    if (error.value) {
        useToast({ title: 'Error', message: error.value.data?.message ?? error.value.message, type: 'error', duration: 5000 });
    }
}

async function addItem() {
    const { data, error } = await useApiFetch(`/api/admin`, {
        method: 'POST',
        body: item,
        lazy: true,
    });
    if (data.value) {
        useToast({ title: 'Success', message: data.value.message, type: 'success', duration: 5000 });
        await closeModal();
        await refresh();
    }
    if (error.value) {
        useToast({ title: 'Error', message: error.value.data?.message ?? error.value.message, type: 'error', duration: 5000 });
    }
}

async function handleModalSubmit() {
    formLoading.value = true;
    const result = await v$.value.$validate();
    if (!result) {
        formLoading.value = false;
        useToast({ title: 'Error', message: 'Please fill all required inputs', type: 'error', duration: 5000 });
        return false;
    }
    if (editMode.value === true) {
        await updateItem();
    } else {
        await addItem();
    }
}

async function deleteItems() {
    const confirmed = confirm('Are you sure you want to delete the selected items?');
    if (confirmed) {
        const { data, error } = await useApiFetch(`/api/admin/delete`, {
            body: { items: selectedRows.value },
            method: 'DELETE',
            lazy: true,
        });
        if (data.value) {
            useToast({ title: 'Success', message: data.value.message, type: 'success', duration: 5000 });
            selectedRows.value = [];
            await refresh();
        }
        if (error.value) {
            useToast({ title: 'Error', message: error.value?.data?.message || error.value?.message, type: 'error', duration: 5000 });
        }
    }
}

async function forceDeleteItems() {
    const confirmed = confirm('Are you sure you want to permanently delete the selected items?');
    if (confirmed) {
        const { data, error } = await useApiFetch(`/api/admin/force-delete`, {
            body: { items: selectedRows.value },
            method: 'DELETE',
            lazy: true,
        });
        if (data.value) {
            useToast({ title: 'Success', message: data.value.message, type: 'success', duration: 5000 });
            selectedRows.value = [];
            await refresh();
        }
        if (error.value) {
            useToast({ title: 'Error', message: error.value?.data?.message || error.value?.message, type: 'error', duration: 5000 });
        }
    }
}

async function restoreItems() {
    const confirmed = confirm('Are you sure you want to restore the selected items?');
    if (confirmed) {
        const { data, error } = await useApiFetch(`/api/admin/restore`, {
            body: { items: selectedRows.value },
            method: 'POST',
            lazy: true,
        });
        if (data.value) {
            useToast({ title: 'Success', message: data.value.message, type: 'success', duration: 5000 });
            selectedRows.value = [];
            await refresh();
        }
        if (error.value) {
            useToast({ title: 'Error', message: error.value?.data?.message || error.value?.message, type: 'error', duration: 5000 });
        }
    }
}

// Watch superAdmin to clear extra permissions when enabled
watch(
    () => item.value.superAdmin,
    (isSuperAdmin) => {
        if (isSuperAdmin) {
            extraPermissionIds.value = [];
        }
        // Update matrix mode
        if (permissionMatrixRef.value) {
            permissionMatrixRef.value.setSuperAdminMode(isSuperAdmin);
        }
    },
);
</script>

<template>
    <div class="flex flex-col gap-8">
        <!-- Page Title & Action Buttons -->
        <div class="md:flex md:items-center md:justify-between md:gap-5">
            <div class="flex items-center gap-2">
                <Icon name="solar:shield-user-linear" class="size-5 opacity-75" />
                <div>{{ serverParams.deleted ? 'Deleted Admins' : 'Admins' }}</div>
            </div>
            <div class="md:flex md:items-center md:gap-5 md:space-y-0 space-y-5">
                <template v-if="selectedRows.length > 0">
                    <button v-if="serverParams.deleted && canForceDelete" class="btn btn-danger btn-rounded px-6 btn-sm gap-3 md:w-fit w-full md:mt-0 mt-5" @click="forceDeleteItems">
                        <Icon name="solar:trash-bin-minimalistic-line-duotone" class="size-5 opacity-75" />
                        Delete Permanently
                    </button>
                    <button v-else-if="!serverParams.deleted && canDelete" class="btn btn-danger btn-rounded px-6 btn-sm gap-3 md:w-fit w-full md:mt-0 mt-5" @click="deleteItems">
                        <Icon name="solar:trash-bin-minimalistic-line-duotone" class="size-5 opacity-75" />
                        Delete Items
                    </button>
                    <button v-if="serverParams.deleted && canRestore" class="btn btn-success btn-rounded px-6 btn-sm gap-3 md:w-fit w-full md:mt-0 mt-5" @click="restoreItems">
                        <Icon name="solar:restart-circle-outline" class="size-5 opacity-75" />
                        Restore Items
                    </button>
                </template>
                <button v-if="canCreate" :disabled="serverParams.deleted" class="btn btn-primary btn-rounded px-6 btn-sm gap-3 md:w-fit w-full md:mt-0 mt-5" @click="openModal()">
                    <Icon name="solar:add-square-linear" class="size-5 opacity-75" />
                    Add New
                </button>
                <button class="btn btn-secondary btn-rounded px-6 btn-sm gap-3 md:w-fit w-full md:mt-0 mt-5" @click="toggleDeleted">
                    <Icon :name="serverParams.deleted ? 'solar:hamburger-menu-line-duotone' : 'solar:trash-bin-minimalistic-line-duotone'" class="size-5 opacity-75" />
                    {{ serverParams.deleted ? 'Items List' : 'Deleted Items' }}
                </button>
            </div>
        </div>

        <!-- Filter & Search -->
        <div class="grid lg:grid-cols-12 gap-5 items-center p-5 bg-white border rounded-2xl">
            <FormInputField v-model="filter.name" rounded class="xl:col-span-4 lg:col-span-4" placeholder="Search by name" />
            <FormSelectField v-model="serverParams.orderBy" :clearable="false" class="xl:col-span-4 lg:col-span-4" labelvalue="name" keyvalue="value" placeholder="Sort By" :select-data="sortByList" />
            <FormSelectField
                v-model="serverParams.orderByDirection"
                class="xl:col-span-4 lg:col-span-4"
                :clearable="false"
                labelvalue="name"
                keyvalue="value"
                placeholder="Sort Direction"
                :select-data="[
                    { name: 'Z → A', value: 'desc' },
                    { name: 'A → Z', value: 'asc' },
                ]"
            />
            <button class="xl:col-span-6 lg:col-span-6 btn btn-rounded btn-sm btn-primary gap-3 w-full" @click="refresh">
                <Icon name="solar:rounded-magnifer-line-duotone" class="size-5 shrink-0" />
                Filter
            </button>
            <button class="xl:col-span-6 lg:col-span-6 btn btn-rounded btn-sm btn-secondary gap-3 w-full" @click="resetServerParams">
                <Icon name="solar:restart-circle-outline" class="size-5 shrink-0" />
                Reset
            </button>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto rounded-2xl border bg-white">
            <table class="table table-report font-light w-full">
                <thead>
                    <tr class="uppercase text-sm bg-slate-50">
                        <th class="text-left w-14">
                            <input v-model="allSelected" type="checkbox" class="form-check-input" :disabled="!rows?.data?.length" @change="selectAllRows" />
                        </th>
                        <th class="text-left">Name</th>
                        <th class="text-center">Role</th>
                        <th class="text-center">Extra Permissions</th>
                        <th class="text-center">Super Admin</th>
                        <th v-if="serverParams.deleted" class="text-center">Deleted At</th>
                        <th class="text-right">Action</th>
                    </tr>
                </thead>
                <tbody>
                    <template v-if="!pending && rows">
                        <tr v-for="row in rows.data" :key="row.id" class="border-b hover:bg-slate-50/50">
                            <td>
                                <input :checked="isSelected(row.id)" type="checkbox" class="form-check-input" @change="toggleRowSelection(row.id)" />
                            </td>
                            <td>
                                <div>
                                    <div class="font-medium text-slate-800">{{ row.name }}</div>
                                    <div class="font-light text-xs opacity-75">{{ row.email }}</div>
                                </div>
                            </td>
                            <td class="text-center">
                                <div v-if="row.superAdmin">
                                    <span class="px-2 py-1 rounded-full bg-success/25 text-success border !border-success/25 text-xs">Super Admin</span>
                                </div>
                                <div v-else>
                                    <span v-if="row.role" class="px-2 py-1 rounded-full bg-slate-100 text-slate-700 border !border-slate-200 text-xs">{{ row.role?.name }}</span>
                                    <span v-else class="font-light text-sm opacity-75">—</span>
                                </div>
                            </td>
                            <td class="text-center text-sm text-slate-500">{{ row.extra_permissions?.length ?? 0 }}</td>
                            <td class="text-center">
                                <FormSwitch :id="'row-super-admin-' + row.id" v-model="row.superAdmin" :disabled="serverParams.deleted" @change="useToggleSwitch(row.id, 'super_admin', 'admin')" />
                            </td>
                            <td v-if="serverParams.deleted" class="text-center text-sm">{{ row.deletedAt }}</td>
                            <td class="text-right">
                                <button v-if="canUpdate" :disabled="serverParams.deleted" class="btn btn-secondary btn-rounded btn-sm gap-2" @click="openModal(row.id)">
                                    <Icon name="solar:pen-new-round-outline" class="size-4" />
                                    Edit
                                </button>
                            </td>
                        </tr>
                    </template>
                    <template v-else>
                        <tr v-for="i in serverParams.perPage" :key="i">
                            <td colspan="7">
                                <div class="h-12 !opacity-50 animate-pulse" />
                            </td>
                        </tr>
                    </template>
                    <tr v-if="!pending && rows?.data?.length === 0">
                        <td colspan="7" class="p-8 text-center text-sm text-slate-500">No admins found.</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Pagination -->
        <TablePagination :pending="pending" :rows="rows" :page="serverParams.page" @change-page="changePage" />

        <!-- Modal -->
        <TheModal :open-modal="isOpen" size="6xl" @close-modal="closeModal()">
            <template #header>
                <div class="flex justify-between items-center">
                    <div>
                        <div class="text-lg font-semibold text-slate-800">{{ editMode ? 'Update Admin' : 'Add New Admin' }}</div>
                        <div class="text-xs text-slate-500">{{ editMode ? 'Edit admin details' : 'Create a new admin' }}</div>
                    </div>
                    <Icon class="w-8 h-8 opacity-50 cursor-pointer hover:opacity-100 ease-in-out duration-300" name="solar:close-square-outline" @click="closeModal" />
                </div>
            </template>
            <template #content>
                <div class="grid lg:grid-cols-12 gap-5 items-start">
                    <FormInputField v-model="item.name" :errors="v$.name.$errors" class="lg:col-span-12" label="Name" name="name" placeholder="Admin Name" />
                    <FormInputField v-model="item.email" :errors="v$.email.$errors" class="lg:col-span-6" label="Email" name="email" placeholder="admin@example.com" type="email" />
                    <FormInputField v-model.trim="item.password" :errors="v$.password.$errors" class="lg:col-span-6" label="Password" name="password" :placeholder="editMode ? 'Leave blank to keep current' : 'Password'" type="password" />

                    <!-- Super Admin Switch - disabled if not super admin -->
                    <FormSwitch 
                        id="super-admin" 
                        v-model="item.superAdmin" 
                        label="Super Admin" 
                        class="lg:col-span-6" 
                        :disabled="!isCurrentUserSuperAdmin"
                    />
                    <div v-if="!isCurrentUserSuperAdmin" class="lg:col-span-6 text-xs text-slate-400 flex items-center gap-1">
                        <Icon name="solar:info-circle-outline" class="size-4" />
                        Only Super Admins can change this setting
                    </div>

                    <!-- Role Select - disabled when superAdmin is true -->
                    <FormSelectField v-model="item.roleId" :disabled="item.superAdmin" :select-data="roles" labelvalue="name" keyvalue="id" :errors="v$.roleId.$errors" class="lg:col-span-6" label="Role" name="role-id" placeholder="Select a role" />
                </div>

                <!-- Extra Permissions Matrix -->
                <div v-if="editMode && item.id && !item.superAdmin" class="mt-5">
                    <AdminRolePermissionMatrix
                        ref="permissionMatrixRef"
                        v-model="extraPermissionSelection"
                        :permissions="permissionCatalog"
                        title="Extra Permissions"
                        description="These permissions are added directly to this admin in addition to the selected role."
                    />
                </div>
                <div v-else-if="editMode && item.id && item.superAdmin" class="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                    <Icon name="solar:info-circle-outline" class="size-5 mr-2 inline" />
                    Super Admin has all permissions. No extra permissions needed.
                </div>
                <div v-else class="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                    <Icon name="solar:info-circle-outline" class="size-5 mr-2 inline" />
                    Save the admin first to assign extra permissions directly to this user.
                </div>
            </template>
            <template #footer>
                <div class="w-full flex items-center justify-end gap-5">
                    <button :disabled="formLoading" class="btn-rounded btn-sm btn btn-danger px-4" type="button" @click="closeModal">
                        <Icon :name="formLoading ? 'svg-spinners:3-dots-fade' : 'solar:close-circle-linear'" class="w-5 h-5 mr-2" />
                        <span>Cancel</span>
                    </button>
                    <button :disabled="formLoading || (editMode ? !canUpdate : !canCreate)" class="btn-rounded btn-sm btn btn-primary px-4" type="button" @click="handleModalSubmit()">
                        <Icon :name="formLoading ? 'svg-spinners:3-dots-fade' : 'solar:check-circle-broken'" class="w-5 h-5 mr-2" />
                        <span>{{ editMode ? 'Update' : 'Save' }}</span>
                    </button>
                </div>
            </template>
        </TheModal>
    </div>
</template>