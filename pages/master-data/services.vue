<script setup>
import { required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';

definePageMeta({
    middleware: ['auth', 'permission'],
    permissions: ['show-master-data-services'],
});

const selectedRows = ref([]);
const filter = ref({ name: null });
const serverParams = ref({
    filters: {},
    orderBy: 'id',
    orderByDirection: 'desc',
    perPage: 25,
    page: 1,
    paginate: true,
    deleted: false,
});
const formLoading = ref(false);
const isOpen = ref(false);
const editMode = ref(false);
const item = ref({ name: '', active: 1 });
const rules = { name: { required } };
const v$ = useVuelidate(rules, item);

const canCreate = useCheckPermission(['create-master-data-services']);
const canUpdate = useCheckPermission(['update-master-data-services']);
const canDelete = useCheckPermission(['delete-master-data-services']);
const canForceDelete = useCheckPermission(['forceDelete-master-data-services']);

const {
    data: rows,
    status,
    refresh,
} = await useApiFetch('/api/member-servise/index', {
    method: 'POST',
    body: serverParams,
    lazy: true,
});

watch(
    () => filter.value.name,
    (name) => {
        if (name?.trim()) serverParams.value.filters.name = name.trim();
        else delete serverParams.value.filters.name;
        serverParams.value.page = 1;
    },
);

const resetFilters = async () => {
    filter.value.name = null;
    serverParams.value.filters = {};
    serverParams.value.page = 1;
    selectedRows.value = [];
    await refresh();
};

const toggleDeleted = async () => {
    serverParams.value.deleted = !serverParams.value.deleted;
    serverParams.value.page = 1;
    selectedRows.value = [];
    await refresh();
};

const isSelected = (id) => selectedRows.value.includes(id);
const allSelected = computed(() => {
    const data = rows.value?.data ?? [];
    return data.length > 0 && data.every((row) => isSelected(row.id));
});

const selectAllRows = () => {
    const data = rows.value?.data ?? [];
    selectedRows.value = allSelected.value ? [] : data.map((row) => row.id);
};

const toggleRowSelection = (id) => {
    selectedRows.value = isSelected(id) ? selectedRows.value.filter((rowId) => rowId !== id) : [...selectedRows.value, id];
};

const changePage = async (value) => {
    const page = Number.parseInt(String(value), 10);
    if (Number.isNaN(page) || page < 1) return;
    serverParams.value.page = page;
    selectedRows.value = [];
    await refresh();
};

const resetItem = () => {
    item.value = { name: '', active: 1 };
};

const openModal = async (id = null) => {
    formLoading.value = true;
    editMode.value = id !== null;
    resetItem();

    if (id !== null) {
        const { data, error } = await useApiFetch(`/api/member-servise/${id}`);
        if (error.value) {
            useToast({ title: 'Error', message: error.value.data?.message ?? error.value.message ?? 'Failed to load service.', type: 'error', duration: 5000 });
            formLoading.value = false;
            return;
        }
        const service = data.value?.data;
        if (!service) {
            useToast({ title: 'Error', message: 'The server did not return the service.', type: 'error', duration: 5000 });
            formLoading.value = false;
            return;
        }
        item.value = { id: service.id, name: service.name ?? '', active: Number(service.active) ? 1 : 0 };
    }

    formLoading.value = false;
    isOpen.value = true;
};

const closeModal = () => {
    isOpen.value = false;
    editMode.value = false;
    v$.value.$reset();
    resetItem();
};

const saveItem = async () => {
    formLoading.value = true;
    const valid = await v$.value.$validate();
    if (!valid) {
        formLoading.value = false;
        useToast({ title: 'Error', message: 'Please enter a service name.', type: 'error', duration: 5000 });
        return;
    }

    const body = { name: item.value.name.trim(), active: item.value.active ? 1 : 0 };
    const endpoint = editMode.value ? `/api/member-servise/${item.value.id}` : '/api/member-servise';
    const { data, error } = await useApiFetch(endpoint, {
        method: editMode.value ? 'PATCH' : 'POST',
        body,
    });

    if (error.value) {
        useToast({ title: 'Error', message: error.value.data?.message ?? error.value.message ?? 'Failed to save service.', type: 'error', duration: 5000 });
    } else if (data.value) {
        useToast({ title: 'Success', message: data.value.message ?? 'Service saved successfully.', type: 'success', duration: 5000 });
        closeModal();
        await refresh();
    } else {
        useToast({ title: 'Error', message: 'The server did not confirm the service was saved.', type: 'error', duration: 5000 });
    }

    formLoading.value = false;
};

const runBulkAction = async (action, method, confirmation) => {
    if (!selectedRows.value.length || !confirm(confirmation)) return;

    const { data, error } = await useApiFetch(`/api/member-servise/${action}`, {
        method,
        body: { items: selectedRows.value },
    });

    if (error.value) {
        useToast({ title: 'Error', message: error.value.data?.message ?? error.value.message ?? 'The services could not be updated.', type: 'error', duration: 5000 });
    } else if (data.value) {
        useToast({ title: 'Success', message: data.value.message ?? 'Services updated successfully.', type: 'success', duration: 5000 });
        selectedRows.value = [];
        await refresh();
    } else {
        useToast({ title: 'Error', message: 'The server did not confirm the service action.', type: 'error', duration: 5000 });
    }
};
</script>

<template>
    <div class="flex flex-col gap-8">
        <div class="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div class="flex items-center gap-2">
                <Icon name="solar:star-circle-linear" class="size-5 opacity-75" />
                <h1>{{ serverParams.deleted ? 'Deleted Services' : 'Services' }}</h1>
            </div>
            <div class="flex flex-wrap items-center gap-3">
                <button v-if="selectedRows.length && serverParams.deleted && canForceDelete" class="btn btn-danger btn-rounded btn-sm gap-2" type="button" @click="runBulkAction('force-delete', 'DELETE', 'Permanently delete the selected services?')">
                    <Icon name="solar:trash-bin-minimalistic-line-duotone" class="size-5" />
                    Delete Permanently
                </button>
                <button v-else-if="selectedRows.length && !serverParams.deleted && canDelete" class="btn btn-danger btn-rounded btn-sm gap-2" type="button" @click="runBulkAction('delete', 'DELETE', 'Delete the selected services?')">
                    <Icon name="solar:trash-bin-minimalistic-line-duotone" class="size-5" />
                    Delete Selected
                </button>
                <button v-if="!serverParams.deleted && canCreate" class="btn btn-primary btn-rounded btn-sm gap-2" type="button" @click="openModal()">
                    <Icon name="solar:add-square-linear" class="size-5" />
                    Add Service
                </button>
                <button class="btn btn-secondary btn-rounded btn-sm gap-2" type="button" @click="toggleDeleted">
                    <Icon :name="serverParams.deleted ? 'solar:hamburger-menu-line-duotone' : 'solar:trash-bin-minimalistic-line-duotone'" class="size-5" />
                    {{ serverParams.deleted ? 'Active Services' : 'Deleted Services' }}
                </button>
            </div>
        </div>

        <div class="grid items-center gap-4 rounded-2xl border bg-white p-5 md:grid-cols-12">
            <FormInputField v-model="filter.name" rounded class="md:col-span-8" placeholder="Search by name" />
            <button class="btn btn-primary btn-rounded btn-sm gap-2 md:col-span-2" type="button" @click="refresh">
                <Icon name="solar:rounded-magnifer-line-duotone" class="size-5" />
                Search
            </button>
            <button class="btn btn-secondary btn-rounded btn-sm gap-2 md:col-span-2" type="button" @click="resetFilters">
                <Icon name="solar:restart-circle-outline" class="size-5" />
                Reset
            </button>
        </div>

        <div class="overflow-x-auto">
            <table class="table table-report font-light">
                <thead>
                    <tr class="text-sm uppercase">
                        <th>
                            <input :checked="allSelected" type="checkbox" class="form-check-input" @change="selectAllRows" />
                        </th>
                        <th>Name</th>
                        <th class="text-center">Active</th>
                        <th v-if="serverParams.deleted">Deleted At</th>
                        <th class="text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-if="status === 'pending'">
                        <td colspan="5" class="py-8 text-center text-slate-500">Loading services...</td>
                    </tr>
                    <tr v-else-if="!rows?.data?.length">
                        <td colspan="5" class="py-8 text-center text-slate-500">No services found.</td>
                    </tr>
                    <template v-else>
                        <tr v-for="row in rows?.data ?? []" :key="row.id">
                            <td><input :checked="isSelected(row.id)" type="checkbox" class="form-check-input" @change="toggleRowSelection(row.id)" /></td>
                            <td>{{ row.name }}</td>
                            <td class="text-center">{{ Number(row.active) ? 'Yes' : 'No' }}</td>
                            <td v-if="serverParams.deleted">{{ row.deletedAt ?? row.deleted_at ?? '-' }}</td>
                            <td class="text-right">
                                <button v-if="!serverParams.deleted && canUpdate" class="btn btn-secondary btn-rounded btn-sm gap-2" type="button" @click="openModal(row.id)">
                                    <Icon name="solar:pen-new-round-outline" class="size-4" />
                                    Edit
                                </button>
                            </td>
                        </tr>
                    </template>
                </tbody>
            </table>
        </div>
        <TablePagination :pending="status === 'pending'" :rows="rows" :page="serverParams.page" @change-page="changePage" />

        <TheModal :open-modal="isOpen" size="xl" @close-modal="closeModal">
            <template #header>
                <div class="flex items-center justify-between">
                    <h2 class="text-lg font-medium">{{ editMode ? 'Update Service' : 'Add Service' }}</h2>
                    <button type="button" aria-label="Close" @click="closeModal">
                        <Icon name="solar:close-square-outline" class="size-7 opacity-60" />
                    </button>
                </div>
            </template>
            <template #content>
                <div class="grid gap-5">
                    <FormInputField v-model="item.name" :errors="v$.name.$errors" label="Name" name="service-name" required />
                    <FormSwitch v-model="item.active" label="Active" name="service-active" />
                </div>
            </template>
            <template #footer>
                <div class="flex justify-end gap-3">
                    <button class="btn btn-danger btn-rounded btn-sm" type="button" :disabled="formLoading" @click="closeModal">Cancel</button>
                    <button class="btn btn-primary btn-rounded btn-sm" type="button" :disabled="formLoading" @click="saveItem">
                        {{ formLoading ? 'Saving...' : editMode ? 'Update' : 'Save' }}
                    </button>
                </div>
            </template>
        </TheModal>
    </div>
</template>
