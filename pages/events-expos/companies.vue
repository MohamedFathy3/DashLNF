<script setup>
import { email, required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';

definePageMeta({
    middleware: ['auth', 'permission'],
    permissions: ['show-events-expos-companies'],
});

// ========== Permissions ==========
const pageSlug = 'events-expos-companies';
const canCreate = useCheckPermission([`create-${pageSlug}`]);
const canUpdate = useCheckPermission([`update-${pageSlug}`]);
const canDelete = useCheckPermission([`delete-${pageSlug}`]);
const canForceDelete = useCheckPermission([`forceDelete-${pageSlug}`]);
const canRestore = useCheckPermission([`restore-${pageSlug}`]);
const canShow = useCheckPermission([`show-${pageSlug}`]);
// ========== End Permissions ==========

const selectedRows = ref([]);
const sortByList = ref([
    { name: 'Sort By ID', value: 'id' },
    { name: 'Sort By Name', value: 'name' },
    { name: 'Sort By Expo', value: 'expo_id' },
    { name: 'Sort By Network', value: 'network_id' },
]);
const filter = ref({
    name: null,
    countryId: null,
});
const resources = useResourceStore();

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

const resetServerParams = async () => {
    filter.value = {
        name: null,
        countryId: null,
    };
    serverParams.value = {
        filters: {},
        orderBy: 'id',
        orderByDirection: 'desc',
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
    status,
    refresh,
} = await useApiFetch('/api/expo-company/index', {
    method: 'POST',
    body: serverParams,
    lazy: true,
});

const { data: packages } = await useApiFetch('/api/get-package/public', {
    lazy: true,
    transform: (packages) => packages.data,
});

const { data: networks } = await useApiFetch('/api/get-logo-company/public', {
    lazy: true,
    transform: (networks) => networks.data,
});

const { data: expos } = await useApiFetch('/api/get-expo/public', {
    lazy: true,
    transform: (expos) => expos.data,
});

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
    return rows?.value?.data?.every((row) => selectedRows.value.includes(row.id)) || false;
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
    id: null,
    name: null,
    city: null,
    countryId: null,
    image: null,
    email: null,
    cpName: null,
    cpJobTitle: null,
    cpEmail: null,
    cpCellNumber: null,
    cpPhoneNumber: null,
    status: false,
    packageId: null,
    networkId: null,
    expoId: null,
});

const rules = ref({
    name: { required },
    city: { required },
    countryId: { required },
    image: { required },
    email: { required, email },
    cpName: { required },
    cpJobTitle: { required },
    cpEmail: { required, email },
    cpCellNumber: { required },
    cpPhoneNumber: {},
    status: {},
    packageId: { required },
    networkId: { required },
    expoId: { required },
});

const v$ = useVuelidate(rules, item);

const fetchItem = async (id) => {
    const { data, error } = await useApiFetch(`/api/expo-company/${id}`, {
        lazy: true,
    });
    if (data.value) {
        item.value = data.value.data;
    }
    if (error.value) {
        useToast({ title: 'Error', message: error.value.message, type: 'error', duration: 5000 });
    }
};

const resetItemValues = async () => {
    item.value = {
        id: null,
        name: null,
        email: null,
        status: false,
        image: null,
        cpName: null,
        cpJobTitle: null,
        cpEmail: null,
        cpCellNumber: null,
        cpPhoneNumber: null,
        packageId: null,
        networkId: null,
        expoId: null,
        city: null,
        countryId: null,
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
    }
    formLoading.value = false;
    isOpen.value = true;
}

async function updateItem() {
    const { data, error } = await useApiFetch(`/api/expo-company/${item.value?.id}`, {
        method: 'PATCH',
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

async function addItem() {
    const { data, error } = await useApiFetch(`/api/expo-company`, {
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
        const { data, error } = await useApiFetch(`/api/expo-company/delete`, {
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
        const { data, error } = await useApiFetch(`/api/expo-company/force-delete`, {
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
        const { data, error } = await useApiFetch(`/api/expo-company/restore`, {
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
</script>

<template>
    <div class="flex flex-col gap-8">
        <!-- Page Title & Action Buttons -->
        <div class="md:flex md:items-center md:justify-between md:gap-5">
            <div class="flex items-center gap-2">
                <Icon name="solar:buildings-3-outline" class="size-5 opacity-75" />
                <div>{{ serverParams.deleted ? 'Deleted Companies' : 'Companies' }}</div>
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
            <FormSelectField v-model="filter.countryId" :clearable="true" class="xl:col-span-4 lg:col-span-4" imgvalue="imageUrl" labelvalue="name" keyvalue="id" placeholder="Filter by country" :select-data="resources.countries" />
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
            <button class="xl:col-span-4 lg:col-span-4 btn btn-rounded btn-sm btn-primary gap-3 w-full" @click="refresh">
                <Icon name="solar:rounded-magnifer-line-duotone" class="size-5 shrink-0" />
                Filter
            </button>
            <button class="xl:col-span-4 lg:col-span-4 btn btn-rounded btn-sm btn-secondary gap-3 w-full" @click="resetServerParams">
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
                        <th class="text-center">Network / Expo</th>
                        <th class="text-center">Status</th>
                        <th v-if="serverParams.deleted" class="text-center">Deleted At</th>
                        <th class="text-right">Action</th>
                    </tr>
                </thead>
                <tbody>
                    <template v-if="status !== 'pending' && rows">
                        <tr v-for="row in rows.data" :key="row.id" class="border-b hover:bg-slate-50/50">
                            <td>
                                <input :checked="isSelected(row.id)" type="checkbox" class="form-check-input" @change="toggleRowSelection(row.id)" />
                            </td>
                            <td>
                                <div class="flex items-center gap-3">
                                    <NuxtImg v-if="row.image" :src="row.imageUrl" class="h-12 !rounded-md w-20 object-contain p-0.5 shrink-0" />
                                    <div>
                                        <div class="font-medium text-slate-800 truncate">{{ row.name }}</div>
                                        <div class="font-medium text-xs opacity-75 truncate">{{ row.country?.name }}</div>
                                        <div class="font-light text-xs opacity-75 truncate">{{ row.city }}</div>
                                    </div>
                                </div>
                            </td>
                            <td class="text-center">
                                <div class="text-xs">
                                    <div class="font-medium">{{ row.network?.name }}</div>
                                    <div class="opacity-75">{{ row.expo?.name }}</div>
                                </div>
                            </td>
                            <td class="text-center">
                                <FormSwitch :id="'row-status-' + row.id" v-model="row.status" :disabled="serverParams.deleted" @change="useToggleSwitch(row.id, 'status', 'expo-company')" />
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
                            <td colspan="6">
                                <div class="h-12 !opacity-50 animate-pulse" />
                            </td>
                        </tr>
                    </template>
                    <tr v-if="status !== 'pending' && rows?.data?.length === 0">
                        <td colspan="6" class="p-8 text-center text-sm text-slate-500">No companies found.</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Pagination -->
        <TablePagination :pending="status === 'pending'" :rows="rows" :page="serverParams.page" @change-page="changePage" />

        <!-- Modal -->
        <TheModal :open-modal="isOpen" size="5xl" @close-modal="closeModal()">
            <template #header>
                <div class="flex justify-between items-center">
                    <div>
                        <div class="text-lg font-semibold text-slate-800">{{ editMode ? 'Update Company' : 'Add New Company' }}</div>
                        <div class="text-xs text-slate-500">{{ editMode ? 'Edit company details' : 'Create a new company' }}</div>
                    </div>
                    <Icon class="w-8 h-8 opacity-50 cursor-pointer hover:opacity-100 ease-in-out duration-300" name="solar:close-square-outline" @click="closeModal" />
                </div>
            </template>
            <template #content>
                <div class="grid lg:grid-cols-12 gap-5 items-start">
                    <!-- Image -->
                    <div class="lg:col-span-4">
                        <FormUploader v-model="item.image" :errors="v$.image.$errors" :allowed-types="['image']" label="Logo Image" name="image" />
                    </div>

                    <!-- Basic Info -->
                    <div class="lg:col-span-8 grid lg:grid-cols-12 gap-5">
                        <FormInputField v-model="item.name" :errors="v$.name.$errors" class="lg:col-span-12" label="Company Name" name="name" placeholder="Company Name" />
                        <FormSelectField
                            id="country-id"
                            v-model="item.countryId"
                            :errors="v$.countryId.$errors"
                            label="Country"
                            class="lg:col-span-6"
                            placeholder="Please select a country..."
                            :select-data="resources.countries"
                            labelvalue="name"
                            keyvalue="id"
                            imgvalue="imageUrl"
                        />
                        <FormInputField v-model="item.city" :errors="v$.city.$errors" class="lg:col-span-6" label="City" name="city" placeholder="City" />
                        <FormInputField v-model="item.email" :errors="v$.email.$errors" class="lg:col-span-12" label="Company Email" name="email" placeholder="company@email.com" type="email" />
                    </div>

                    <!-- Contact Person -->
                    <div class="lg:col-span-12 grid grid-cols-12 gap-5 p-3 border bg-slate-50/50 rounded-xl">
                        <div class="lg:col-span-12 font-semibold text-slate-800">Contact Person Details</div>
                        <FormInputField v-model="item.cpName" :errors="v$.cpName.$errors" class="lg:col-span-6" label="Full Name" name="cp-name" placeholder="Contact Person Name" />
                        <FormInputField v-model="item.cpJobTitle" :errors="v$.cpJobTitle.$errors" class="lg:col-span-6" label="Job Title" name="cp-job-title" placeholder="Job Title" />
                        <FormInputField v-model="item.cpEmail" :errors="v$.cpEmail.$errors" class="lg:col-span-12" label="Email" name="cp-email" placeholder="contact@email.com" type="email" />
                        <FormInputField v-model="item.cpCellNumber" :errors="v$.cpCellNumber.$errors" class="lg:col-span-6" label="Cell Number" name="cp-cell" placeholder="+1234567890" />
                        <FormInputField v-model="item.cpPhoneNumber" :errors="v$.cpPhoneNumber.$errors" class="lg:col-span-6" label="Phone Number" name="cp-phone" placeholder="+1234567890" />
                    </div>

                    <!-- Relations -->
                    <FormSelectField
                        id="network-id"
                        v-model="item.networkId"
                        :errors="v$.networkId.$errors"
                        label="Network"
                        class="lg:col-span-6"
                        placeholder="Please select a network..."
                        :select-data="networks"
                        labelvalue="name"
                        keyvalue="id"
                        imgvalue="imageUrl"
                    />
                    <FormSelectField
                        id="expo-id"
                        v-model="item.expoId"
                        :errors="v$.expoId.$errors"
                        label="Exhibition"
                        class="lg:col-span-6"
                        placeholder="Please select an Exhibition..."
                        :select-data="expos"
                        labelvalue="name"
                        keyvalue="id"
                        secondlabelvalue="countryName"
                        thirdlabelvalue="city"
                    />
                    <FormSelectField
                        id="package-id"
                        v-model="item.packageId"
                        secondlabelvalue="price"
                        :errors="v$.packageId.$errors"
                        label="Package"
                        class="lg:col-span-6"
                        placeholder="Please select a package..."
                        :select-data="packages"
                        labelvalue="name"
                        keyvalue="id"
                    />
                    <FormSwitch v-model="item.status" :errors="v$.status.$errors" name="status" label="Status" class="lg:col-span-6" />
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
