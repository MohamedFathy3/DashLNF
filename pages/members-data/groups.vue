<script setup>
import { required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';

definePageMeta({
    middleware: ['auth', 'permission'],
    permissions: ['network_group_list'],
});

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
    orderByDirection: 'desc',
    perPage: 15,
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
        orderByDirection: 'desc',
        perPage: 15,
        page: 1,
        paginate: true,
        deleted: false,
    };
    selectedRows.value = [];
    await refresh();
};

const {
    data: rows,
    status,
    refresh,
} = await useApiFetch('/api/group/index', {
    method: 'POST',
    body: serverParams,
    lazy: true,
});

watch(
    filter,
    (newVal) => {
        if (newVal.name && newVal.name.trim() !== '') {
            serverParams.value.filters.name = newVal.name.trim();
        } else {
            delete serverParams.value.filters.name;
        }
        serverParams.value.page = 1;
    },
    { deep: true },
);

const toggleDeleted = async () => {
    serverParams.value.deleted = !serverParams.value.deleted;
    serverParams.value.page = 1;
    selectedRows.value = [];
    await refresh();
};

const isSelected = (id) => {
    return selectedRows.value.some((r) => r === id);
};

const allSelected = computed(() => {
    return rows?.value?.data?.every((row) => selectedRows.value.includes(row.id)) || false;
});

const selectAllRows = () => {
    if (!rows.value?.data) return;
    const allSelected = rows.value.data.every((row) => isSelected(row.id));
    if (allSelected) {
        selectedRows.value = [];
    } else {
        rows.value.data.forEach((row) => {
            if (!isSelected(row.id)) {
                selectedRows.value.push(row.id);
            }
        });
    }
};

const changePage = async (value) => {
    const pageNumber = parseInt(value);
    if (!isNaN(pageNumber) && pageNumber > 0) {
        serverParams.value.page = pageNumber;
        selectedRows.value = [];
        await refresh();
    }
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
    companies: [],
});

const rules = ref({
    name: { required },
    companies: {},
});

const v$ = useVuelidate(rules, item);

const fetchItem = async (id) => {
    const { data, error } = await useApiFetch(`/api/group/${id}`, {
        lazy: true,
    });
    if (data.value) {
        item.value = data.value.data;
        if (!item.value.companies) {
            item.value.companies = [];
        }
        // تأكد من أن المفاتيح صحيحة
        item.value.companies = item.value.companies.map((company) => ({
            id_company: company.idCompany || company.id_company,
            type_company: company.typeCompany || company.type_company,
        }));
    }
    if (error.value) {
        useToast({
            title: 'Error',
            message: data.value?.message || 'Error fetching item',
            type: 'error',
            duration: 5000,
        });
    }
};

const resetItemValues = async () => {
    item.value = {
        name: null,
        companies: [],
    };
};

async function closeModal() {
    isOpen.value = false;
    editMode.value = false;
    v$.value.$reset();
    await resetItemValues();
}

async function openModal(id = null) {
    formLoading.value = true;
    if (id !== null) {
        editMode.value = true;
        await fetchItem(id);
    } else {
        editMode.value = false;
        await resetItemValues();
    }
    formLoading.value = false;
    isOpen.value = true;
}

// جلب الشركات للـ select مع perPage كبير عشان يجيب كل الشركات
const { data: activeMembers, refresh: refreshMembers } = await useApiFetch(`/api/member-network/index`, {
    method: 'POST',
    body: {
        filters: {},
        orderBy: 'id',
        orderByDirection: 'desc',
        perPage: 1000, // عشان يجيب كل الشركات
        page: 1,
        paginate: true,
        deleted: false,
    },
    lazy: true,
});

async function updateItem() {
    // تحويل البيانات للصيغة المطلوبة من الباك
    const payload = {
        name: item.value.name,
        companies: item.value.companies.map((company) => ({
            idCompany: company.id_company,
            typeCompany: company.type_company,
        })),
    };

    const { data, error } = await useApiFetch(`/api/group/${item.value?.id}`, {
        method: 'PATCH',
        body: payload,
        lazy: true,
    });
    if (data.value) {
        useToast({ title: 'Success', message: data.value.message, type: 'success', duration: 5000 });
        await closeModal();
        await refresh();
    }
    if (error.value) {
        useToast({ title: 'Error', message: data.value?.message || 'Error updating item', type: 'error', duration: 5000 });
    }
}

async function addItem() {
    // تحويل البيانات للصيغة المطلوبة من الباك
    const payload = {
        name: item.value.name,
        companies: item.value.companies.map((company) => ({
            idCompany: company.id_company,
            typeCompany: company.type_company,
        })),
    };

    const { data, error } = await useApiFetch(`/api/group`, {
        method: 'POST',
        body: payload,
        lazy: true,
    });
    if (data.value) {
        useToast({ title: 'Success', message: data.value.message, type: 'success', duration: 5000 });
        await closeModal();
        await refresh();
    }
    if (error.value) {
        useToast({ title: 'Error', message: data.value?.message || 'Error adding item', type: 'error', duration: 5000 });
    }
}

async function handleModalSubmit() {
    formLoading.value = true;
    const result = await v$.value.$validate();
    if (!result) {
        formLoading.value = false;
        return false;
    }
    if (editMode.value === true) {
        await updateItem();
    } else {
        await addItem();
    }
    formLoading.value = false;
}

async function deleteItems() {
    const confirmed = confirm('Are you sure you want to delete this item?');
    if (confirmed) {
        const { data, error } = await useApiFetch(`/api/group/delete`, {
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
            useToast({ title: 'Error', message: data.value?.message || 'Error deleting items', type: 'error', duration: 5000 });
        }
    }
}

async function forceDeleteItems() {
    const confirmed = confirm('Are you sure you want to permanently delete this item?');
    if (confirmed) {
        const { data, error } = await useApiFetch(`/api/group/force-delete`, {
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
            useToast({ title: 'Error', message: data.value?.message || 'Error force deleting items', type: 'error', duration: 5000 });
        }
    }
}

async function restoreItems() {
    const confirmed = confirm('Are you sure you want to restore this item?');
    if (confirmed) {
        const { data, error } = await useApiFetch(`/api/group/restore`, {
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
            useToast({ title: 'Error', message: data.value?.message || 'Error restoring items', type: 'error', duration: 5000 });
        }
    }
}

function addRow() {
    if (!item.value.companies) {
        item.value.companies = [];
    }
    item.value.companies.push({
        id_company: null,
        type_company: null,
    });
}

function removeRow(index) {
    if (item.value.companies && Array.isArray(item.value.companies)) {
        item.value.companies.splice(index, 1);
    }
}

const companyTypes = ref([
    { name: 'HQ', value: 'hq' },
    { name: 'Branch', value: 'branch' },
]);
</script>

<template>
    <div v-if="useCheckPermission(['show-members-data-groups'])" class="flex flex-col gap-8">
        <!-- Page Title & Action Buttons -->
        <div class="md:flex md:items-center md:justify-between md:gap-5">
            <div class="flex items-center gap-2">
                <Icon name="solar:link-square-line-duotone" class="size-5 opacity-75" />
                <div>{{ serverParams.deleted ? 'Deleted Groups' : 'Groups' }}</div>
                <span v-if="rows?.meta?.total" class="text-sm opacity-50">({{ rows.meta.total }})</span>
            </div>
            <div class="md:flex md:items-center md:gap-5 md:space-y-0 space-y-5">
                <template v-if="selectedRows.length > 0">
                    <template v-if="serverParams.deleted">
                        <button v-if="useCheckPermission(['forceDelete-members-data-groups'])" class="btn btn-danger btn-rounded px-6 btn-sm gap-3 md:w-fit w-full md:mt-0 mt-5" @click="forceDeleteItems">
                            <Icon name="solar:trash-bin-minimalistic-line-duotone" class="size-5 opacity-75" />
                            Delete Permanently
                        </button>
                    </template>
                    <template v-else>
                        <button v-if="useCheckPermission(['delete-members-data-groups'])" class="btn btn-danger btn-rounded px-6 btn-sm gap-3 md:w-fit w-full md:mt-0 mt-5" @click="deleteItems">
                            <Icon name="solar:trash-bin-minimalistic-line-duotone" class="size-5 opacity-75" />
                            Delete Items
                        </button>
                    </template>
                    <template v-if="serverParams.deleted">
                        <button v-if="useCheckPermission(['network_group_restore'])" class="btn btn-success btn-rounded px-6 btn-sm gap-3 md:w-fit w-full md:mt-0 mt-5" @click="restoreItems">
                            <Icon name="solar:restart-circle-outline" class="size-5 opacity-75" />
                            Restore Items
                        </button>
                    </template>
                </template>
                <button v-if="useCheckPermission(['create-members-data-groups'])" :disabled="serverParams.deleted" class="btn btn-primary btn-rounded px-6 btn-sm gap-3 md:w-fit w-full md:mt-0 mt-5" @click="openModal()">
                    <Icon name="solar:add-square-linear" class="size-5 opacity-75" />
                    Add New
                </button>
                <button v-if="useCheckPermission(['delete-members-data-groups', 'forceDelete-members-data-groups', 'network_group_restore'])" class="btn btn-primary btn-rounded px-6 btn-sm gap-3 md:w-fit w-full md:mt-0 mt-5" @click="toggleDeleted">
                    <Icon :name="serverParams.deleted ? 'solar:hamburger-menu-line-duotone' : 'solar:trash-bin-minimalistic-line-duotone'" class="size-5 opacity-75" />
                    {{ serverParams.deleted ? 'Items List' : 'Deleted Items' }}
                </button>
            </div>
        </div>

        <!-- Filter & Search -->
        <div class="grid lg:grid-cols-12 gap-5 items-center p-5 bg-white border rounded-2xl">
            <FormInputField v-model="filter.name" rounded class="xl:col-span-4 lg:col-span-4" placeholder="Search by Name" />
            <FormSelectField v-model="serverParams.orderBy" :clearable="false" class="xl:col-span-4 lg:col-span-4" labelvalue="name" keyvalue="value" placeholder="Sort By" :select-data="sortByList" />
            <FormSelectField
                v-model="serverParams.orderByDirection"
                class="xl:col-span-4 lg:col-span-4"
                :clearable="false"
                labelvalue="name"
                keyvalue="value"
                placeholder="Sort Direction"
                :select-data="[
                    { name: 'Z : A', value: 'desc' },
                    { name: 'A : Z', value: 'asc' },
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
        <table class="table table-report font-light">
            <thead>
                <tr class="uppercase text-sm">
                    <th class="text-left">
                        <input v-model="allSelected" type="checkbox" class="form-check-input" @change="selectAllRows" />
                    </th>
                    <th class="text-left">Name</th>
                    <th class="text-center">Companies</th>
                    <th v-if="serverParams.deleted">Deleted At</th>
                    <th class="text-right">Action</th>
                </tr>
            </thead>
            <tbody>
                <template v-if="status !== 'pending' && rows?.data">
                    <tr v-for="row in rows.data" :key="row.id" class="text-sm">
                        <td>
                            <input :checked="isSelected(row.id)" type="checkbox" class="form-check-input" @change="toggleRowSelection(row.id)" />
                        </td>
                        <td class="font-normal">
                            <div>{{ row.name }}</div>
                        </td>
                        <td class="text-center">
                            <div>{{ row.companies?.length || 0 }}</div>
                        </td>
                        <td v-if="serverParams.deleted" class="text-sm">{{ row.deletedAt }}</td>
                        <td class="text-right">
                            <div>
                                <button v-if="useCheckPermission(['update-members-data-groups'])" :disabled="serverParams.deleted" class="btn btn-secondary btn-rounded btn-sm gap-3" @click="openModal(row.id)">
                                    <Icon name="solar:pen-new-round-outline" class="size-4" />
                                    Edit
                                </button>
                            </div>
                        </td>
                    </tr>
                </template>
                <template v-else-if="status === 'pending'">
                    <tr v-for="i in serverParams.perPage" :key="'skeleton-' + i">
                        <td colspan="5">
                            <div class="h-12 !opacity-50 animate-pulse bg-gray-200 rounded" />
                        </td>
                    </tr>
                </template>
                <template v-else>
                    <tr>
                        <td colspan="5" class="text-center py-8 text-gray-500">No data available</td>
                    </tr>
                </template>
            </tbody>
        </table>

        <!-- Pagination -->
        <TablePagination :pending="status === 'pending'" :rows="rows" :page="serverParams.page" @change-page="changePage" />

        <!-- Modal -->
        <TheModal :open-modal="isOpen" size="5xl" @close-modal="closeModal()">
            <template #header>
                <div class="flex justify-between items-center">
                    <div class="font-medium" v-html="editMode ? 'Update Group' : 'Add New Group'"></div>
                    <Icon class="w-8 h-8 opacity-50 cursor-pointer hover:opacity-100 ease-in-out duration-300" name="solar:close-square-outline" @click="closeModal" />
                </div>
            </template>
            <template #content>
                <div class="grid lg:grid-cols-12 gap-5 items-start">
                    <FormInputField v-model="item.name" :errors="v$.name?.$errors" class="lg:col-span-12" label="Name" name="name" placeholder="Enter Name" />

                    <div v-if="editMode" class="col-span-12 pt-8 border-slate-200 border-t">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="font-medium text-lg">Companies</h3>
                            <button v-if="useCheckPermission(['update-members-data-groups'])" type="button" class="btn btn-dark btn-sm btn-rounded px-3" @click="addRow">
                                <Icon name="solar:add-square-linear" class="size-4 mr-1" />
                                Add Company
                            </button>
                        </div>
                        <div class="space-y-4">
                            <div v-for="(member, index) in item.companies" :key="index" class="grid xl:grid-cols-4 grid-cols-1 gap-6 items-end">
                                <FormSelectField
                                    v-model="member.id_company"
                                    labelvalue="name"
                                    secondlabelvalue="city"
                                    thirdlabelvalue="countryName"
                                    :disabled="!useCheckPermission(['update-members-data-groups'])"
                                    imgvalue="imageUrl"
                                    keyvalue="id"
                                    :select-data="activeMembers?.data || []"
                                    class="col-span-2"
                                    :name="'company-' + index"
                                    :placeholder="'Search and Select Member ' + (index + 1)"
                                    label="Company"
                                    searchable
                                    filterable
                                />
                                <FormSelectField
                                    v-model="member.type_company"
                                    :disabled="!useCheckPermission(['update-members-data-groups'])"
                                    labelvalue="name"
                                    keyvalue="value"
                                    :select-data="companyTypes"
                                    class="col-span-1"
                                    name="company-type-company"
                                    placeholder="Select Type"
                                    label="Type"
                                />
                                <div>
                                    <button :disabled="!useCheckPermission(['update-members-data-groups'])" type="button" class="btn btn-danger btn-sm btn-rounded px-3" @click="removeRow(index)">
                                        <Icon name="solar:trash-bin-minimalistic-line-duotone" class="size-4" />
                                        Remove
                                    </button>
                                </div>
                            </div>
                            <div v-if="!item.companies || item.companies.length === 0" class="text-center py-4 text-gray-400">No companies added yet. Click "Add Company" to add one.</div>
                        </div>
                    </div>
                </div>
            </template>
            <template #footer>
                <div class="w-full flex items-center justify-end gap-5">
                    <button :disabled="formLoading" class="btn-rounded btn-sm btn btn-danger px-4" type="button" @click="closeModal">
                        <Icon :name="formLoading ? 'svg-spinners:3-dots-fade' : 'solar:close-circle-linear'" class="w-5 h-5 mr-2" />
                        <span>Close</span>
                    </button>
                    <button v-if="useCheckPermission(['network_group_create', 'update-members-data-groups'])" :disabled="formLoading" class="btn-rounded btn-sm btn btn-primary px-4" type="button" @click="handleModalSubmit()">
                        <Icon :name="formLoading ? 'svg-spinners:3-dots-fade' : 'solar:check-circle-broken'" class="w-5 h-5 mr-2" />
                        <span v-html="editMode ? 'Update' : 'Save'" />
                    </button>
                </div>
            </template>
        </TheModal>
    </div>
</template>
