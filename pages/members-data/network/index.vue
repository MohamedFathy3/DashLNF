<script setup>
import * as XLSX from 'xlsx';
import FileSaver from 'file-saver';

definePageMeta({
    middleware: ['auth', 'permission'],
    permissions: ['network_member_list'],
});

const selectedRows = ref([]);
const sortByList = ref([
    { name: 'Sort By Name', value: 'name' },
    { name: 'Sort By ID', value: 'id' },
]);

const filter = ref({
    name: null,
    countryId: null,
    email: null,
    phone: null,
    website: null,
    city: null,
    status: null,
});

const serverParams = ref({
    filters: {},
    orderBy: 'id',
    orderByDirection: 'desc',
    perPage: 25,
    page: 1,
    paginate: true,
    deleted: false,
});

const resources = useResourceStore();
const showFilter = ref(false);
const formLoading = ref(false);
const userModalOpen = ref(false);
const selectedUser = ref(null);
const isEditMode = ref(false);

const membershipStatuses = [
    { name: 'Pending', value: 'pending' },
    { name: 'Approved', value: 'approved' },
    { name: 'Suspended', value: 'suspended' },
    { name: 'Blacklisted', value: 'blacklisted' },
];

function toggleShowMoreFilterOptions() {
    showFilter.value = !showFilter.value;
}

const resetServerParams = async () => {
    filter.value = {
        name: null,
        countryId: null,
        email: null,
        phone: null,
        website: null,
        city: null,
        status: null,
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
} = await useApiFetch('/api/user/index', {
    method: 'POST',
    body: serverParams,
    lazy: true,
});

const applySearch = async () => {
    serverParams.value.page = 1;
    await refresh();
};

const onExport = async () => {
    const exportServerParams = { ...serverParams.value };
    exportServerParams.perPage = rows.value?.meta?.total || 25;
    const { data: exportData, error: errorExport } = await useApiFetch('/api/user/index', {
        method: 'POST',
        body: exportServerParams,
    });
    if (exportData.value) {
        const worksheet = XLSX.utils.json_to_sheet(exportData.value.data);
        const workbook = XLSX.utils.book_new();
        const fileName = `Users_${new Date().toLocaleDateString()}_${new Date().getHours()}_${new Date().getMinutes()}.xlsx`;
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
        const data = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        FileSaver.saveAs(blob, fileName);
    }
    if (errorExport.value) {
        console.error('Error exporting data:', errorExport.value);
    }
};

watch(
    filter,
    (newVal) => {
        for (const key in newVal) {
            const value = newVal[key];
            if (value !== null && value !== '') {
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

async function deleteItems() {
    const confirmed = confirm('Are you sure you want to delete this item?');
    if (confirmed) {
        const { data, error } = await useApiFetch(`/api/user/delete`, {
            body: { items: selectedRows.value },
            method: 'DELETE',
            lazy: true,
        });
        if (data.value) {
            useToast({ title: 'Success', message: data.value.message, type: 'success', duration: 5000 });
            await refresh();
        }
        if (error.value) {
            useToast({ title: 'Error', message: data.value.message, type: 'error', duration: 5000 });
        }
    }
}

async function forceDeleteItems() {
    const confirmed = confirm('Are you sure you want to permanently delete this item?');
    if (confirmed) {
        const { data, error } = await useApiFetch(`/api/user/force-delete`, {
            body: { items: selectedRows.value },
            method: 'DELETE',
            lazy: true,
        });
        if (data.value) {
            useToast({ title: 'Success', message: data.value.message, type: 'success', duration: 5000 });
            await refresh();
        }
        if (error.value) {
            useToast({ title: 'Error', message: data.value.message, type: 'error', duration: 5000 });
        }
    }
}

async function restoreItems() {
    const confirmed = confirm('Are you sure you want to restore this item?');
    if (confirmed) {
        const { data, error } = await useApiFetch(`/api/user/restore`, {
            body: { items: selectedRows.value },
            method: 'POST',
            lazy: true,
        });
        if (data.value) {
            useToast({ title: 'Success', message: data.value.message, type: 'success', duration: 5000 });
            await refresh();
        }
        if (error.value) {
            useToast({ title: 'Error', message: data.value.message, type: 'error', duration: 5000 });
        }
    }
}

function openAddModal() {
    isEditMode.value = false;
    selectedUser.value = {
        name: '',
        addressLineOne: '',
        addressLineTwo: '',
        city: '',
        state: '',
        postalCode: '',
        countryId: null,
        website: '',
        phone: '',
        membersCount: null,
        businessEst: null,
        profile: '',
        fpp: 'no',
        email: '',
        status: 'pending',
        active: false,
        show_home: false,
        image: null,
    };
    userModalOpen.value = true;
}

async function openEditModal(id) {
    isEditMode.value = true;
    formLoading.value = true;
    userModalOpen.value = true;

    const { data, error } = await useApiFetch(`/api/user/${id}`, {
        method: 'GET',
        lazy: true,
    });

    if (data.value) {
        let imageData = data.value.data.image || null;
        if (typeof imageData === 'string') {
            imageData = {
                id: data.value.data.id,
                fullUrl: imageData,
                name: data.value.data.name || 'image',
            };
        }
        if (!imageData && data.value.data.imageUrl) {
            imageData = {
                id: data.value.data.id,
                fullUrl: data.value.data.imageUrl,
                name: data.value.data.name || 'image',
            };
        }

        selectedUser.value = {
            ...data.value.data,
            image: imageData,
        };
        formLoading.value = false;
    }
    if (error.value) {
        useToast({ title: 'Error', message: error.value.message || 'Failed to load user', type: 'error', duration: 5000 });
        formLoading.value = false;
        userModalOpen.value = false;
    }
}

function closeModal() {
    userModalOpen.value = false;
    setTimeout(() => {
        selectedUser.value = null;
        formLoading.value = false;
        isEditMode.value = false;
    }, 300);
}

async function submitUser() {
    if (!selectedUser.value) return;

    formLoading.value = true;
    const url = isEditMode.value ? `/api/user/${selectedUser.value.id}` : '/api/user/create';

    const method = isEditMode.value ? 'PUT' : 'POST';

    let imageId = null;
    if (selectedUser.value.image) {
        if (typeof selectedUser.value.image === 'number') {
            imageId = selectedUser.value.image;
        } else if (selectedUser.value.image.id) {
            imageId = selectedUser.value.image.id;
        }
    }

    const payload = {
        name: selectedUser.value.name,
        addressLineOne: selectedUser.value.addressLineOne,
        addressLineTwo: selectedUser.value.addressLineTwo,
        city: selectedUser.value.city,
        state: selectedUser.value.state,
        postalCode: selectedUser.value.postalCode,
        countryId: selectedUser.value.countryId,
        website: selectedUser.value.website,
        phone: selectedUser.value.phone,
        membersCount: selectedUser.value.membersCount,
        businessEst: selectedUser.value.businessEst,
        profile: selectedUser.value.profile,
        fpp: selectedUser.value.fpp || 'no',
        email: selectedUser.value.email,
        status: selectedUser.value.status || 'pending',
        active: selectedUser.value.active || false,
        show_home: selectedUser.value.show_home || false,
        image: imageId,
    };

    const { data, error } = await useApiFetch(url, {
        method: method,
        body: payload,
        lazy: true,
    });

    if (data.value) {
        useToast({
            title: 'Success',
            message: isEditMode.value ? 'User updated successfully' : 'User created successfully',
            type: 'success',
            duration: 5000,
        });
        closeModal();
        await refresh();
    }
    if (error.value) {
        useToast({
            title: 'Error',
            message: error.value.message || 'Something went wrong',
            type: 'error',
            duration: 5000,
        });
        formLoading.value = false;
    }
}

// User Statistics
const userInfoBoxes = computed(() => {
    if (!rows.value?.data || rows.value.data.length === 0) {
        return [
            { title: 'Total Users', icon: 'solar:users-group-two-rounded-outline', value: 0, description: 'Users' },
            { title: 'Countries', icon: 'solar:earth-outline', value: 0, description: 'With Users' },
            { title: 'Active', icon: 'solar:check-circle-line-duotone', value: 0, description: 'Users' },
            { title: 'Pending', icon: 'solar:clock-circle-line-duotone', value: 0, description: 'Users' },
        ];
    }

    const data = rows.value.data;
    const total = data.length;
    const active = data.filter((u) => u.active === true).length;
    const pending = data.filter((u) => u.status === 'pending').length;
    const countries = new Set(data.map((u) => u.country?.id).filter((id) => id !== undefined && id !== null)).size;

    return [
        { title: 'Total Users', icon: 'solar:users-group-two-rounded-outline', value: total, description: 'Users' },
        { title: 'Countries', icon: 'solar:earth-outline', value: countries, description: 'With Users' },
        { title: 'Active', icon: 'solar:check-circle-line-duotone', value: active, description: 'Users' },
        { title: 'Pending', icon: 'solar:clock-circle-line-duotone', value: pending, description: 'Users' },
    ];
});
</script>

<template>
    <div class="flex flex-col gap-8">
        <!-- Page Title & Action Buttons -->
        <div class="lg:flex lg:items-center lg:justify-between md:gap-5">
            <div class="flex items-center gap-2">
                <Icon name="solar:users-group-two-rounded-outline" class="size-5 opacity-75" />
                <div>{{ serverParams.deleted ? 'Deleted Users' : 'Users' }}</div>
            </div>
            <div class="flex lg:flex-row flex-col lg:items-center lg:gap-5 lg:space-y-0 space-y-5">
                <button v-if="useCheckPermission(['create-members-data-network'])" class="btn btn-primary btn-rounded px-6 btn-sm gap-3 lg:w-fit w-full lg:mt-0 mt-5" type="button" @click="openAddModal">
                    <Icon name="solar:add-circle-linear" class="size-5 opacity-75" />
                    <span>Add User</span>
                </button>

                <button class="btn btn-dark btn-rounded px-6 btn-sm gap-3 lg:w-fit w-full lg:mt-0 mt-5" type="button" @click="onExport">
                    <Icon name="solar:download-outline" class="size-5 opacity-75" />
                    <span>Export XLSX</span>
                </button>

                <template v-if="selectedRows.length > 0">
                    <template v-if="serverParams.deleted && useCheckPermission(['forceDelete-members-data-network'])">
                        <button class="btn btn-danger btn-rounded px-6 btn-sm gap-3 lg:w-fit w-full lg:mt-0 mt-5" @click="forceDeleteItems">
                            <Icon name="solar:trash-bin-minimalistic-line-duotone" class="size-5 opacity-75" />
                            Delete Permanently
                        </button>
                    </template>
                    <template v-else-if="useCheckPermission(['delete-members-data-network'])">
                        <button class="btn btn-danger btn-rounded px-6 btn-sm gap-3 lg:w-fit w-full lg:mt-0 mt-5" @click="deleteItems">
                            <Icon name="solar:trash-bin-minimalistic-line-duotone" class="size-5 opacity-75" />
                            Delete Items
                        </button>
                    </template>
                    <template v-if="serverParams.deleted && useCheckPermission(['network_member_restore'])">
                        <button class="btn btn-success btn-rounded px-6 btn-sm gap-3 lg:w-fit w-full lg:mt-0 mt-5" @click="restoreItems">
                            <Icon name="solar:restart-circle-outline" class="size-5 opacity-75" />
                            Restore Items
                        </button>
                    </template>
                </template>
                <button class="btn btn-primary btn-rounded px-6 btn-sm gap-3 lg:w-fit w-full lg:mt-0 mt-5" @click="toggleDeleted">
                    <Icon :name="serverParams.deleted ? 'solar:hamburger-menu-line-duotone' : 'solar:trash-bin-minimalistic-line-duotone'" class="size-5 opacity-75" />
                    {{ serverParams.deleted ? 'Active Users List' : 'Deleted Users' }}
                </button>
            </div>
        </div>

        <!-- User Statistics -->
        <UiInfoBox :data="userInfoBoxes" />

        <!-- Filter & Search -->
        <div class="grid lg:grid-cols-12 gap-5 items-center p-5 bg-white border rounded-2xl">
            <FormInputField v-model="filter.name" rounded class="xl:col-span-3 lg:col-span-3" placeholder="Name" label="Name" />
            <FormInputField v-model="filter.email" rounded class="xl:col-span-3 lg:col-span-3" placeholder="Email" label="Email" />
            <FormInputField v-model="filter.phone" rounded class="xl:col-span-3 lg:col-span-3" placeholder="Phone" label="Phone" />
            <FormSelectField
                id="filter-country"
                v-model="filter.countryId"
                name="filter-country"
                class="lg:col-span-3 xl:col-span-3"
                placeholder="Country"
                label="Country"
                :select-data="resources.countries"
                labelvalue="name"
                keyvalue="id"
                imgvalue="imageUrl"
            />

            <TransitionExpand>
                <div v-if="showFilter" class="lg:col-span-12 grid lg:grid-cols-12 gap-5 items-center">
                    <FormInputField v-model="filter.website" rounded class="xl:col-span-4 lg:col-span-4" placeholder="Website" label="Website" />
                    <FormInputField v-model="filter.city" rounded class="xl:col-span-4 lg:col-span-4" placeholder="City" label="City" />
                    <FormSelectField v-model="filter.status" :clearable="true" class="xl:col-span-4 lg:col-span-4" label="Status" labelvalue="name" keyvalue="value" placeholder="Status" :select-data="membershipStatuses" />

                    <FormSelectField v-model="serverParams.orderBy" :clearable="false" class="xl:col-span-6 lg:col-span-6" label="Sort By" labelvalue="name" keyvalue="value" placeholder="Sort By" :select-data="sortByList" />
                    <FormSelectField
                        v-model="serverParams.orderByDirection"
                        class="xl:col-span-6 lg:col-span-6"
                        :clearable="false"
                        label="Sort Direction"
                        labelvalue="name"
                        keyvalue="value"
                        placeholder="Sort Direction"
                        :select-data="[
                            { name: 'Z : A', value: 'desc' },
                            { name: 'A : Z', value: 'asc' },
                        ]"
                    />
                </div>
            </TransitionExpand>

            <button class="xl:col-span-4 lg:col-span-4 btn btn-rounded btn-sm btn-primary gap-3 w-full" @click="applySearch">
                <Icon name="solar:rounded-magnifer-line-duotone" class="size-5 shrink-0" />
                Filter
            </button>
            <button class="xl:col-span-4 lg:col-span-4 btn btn-rounded btn-sm btn-secondary gap-3 w-full" @click="resetServerParams">
                <Icon name="solar:restart-circle-outline" class="size-5 shrink-0" />
                Reset
            </button>
            <button class="xl:col-span-4 lg:col-span-4 btn btn-rounded btn-sm btn-secondary gap-3 w-full" @click="toggleShowMoreFilterOptions">
                <Icon name="solar:filter-linear" class="size-5 shrink-0" />
                More Filter Options
            </button>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
            <table class="table table-report font-light">
                <thead>
                    <tr class="uppercase text-sm">
                        <th class="text-left">
                            <input v-model="allSelected" type="checkbox" class="form-check-input" @change="selectAllRows" />
                        </th>
                        <th>Name</th>
                        <th>Contact</th>
                        <th>Status</th>
                        <th v-if="serverParams.deleted">Deleted At</th>
                        <th class="text-right">Action</th>
                    </tr>
                </thead>
                <tbody>
                    <template v-if="status !== 'pending' && rows">
                        <tr v-for="row in rows.data" :key="row.id">
                            <td>
                                <input :checked="isSelected(row.id)" type="checkbox" class="form-check-input" @change="toggleRowSelection(row.id)" />
                            </td>
                            <td class="text-sm font-normal whitespace-nowrap">
                                <div class="flex items-center gap-3">
                                    <NuxtImg :src="row.imageUrl" class="h-14 !rounded-md w-24 object-contain p-1 shrink-0" />
                                    <div class="flex flex-col gap-0.5">
                                        <div class="flex items-center gap-1.5">
                                            <span class="truncate 2xl:max-w-64 max-w-44">{{ row.name }}</span>
                                            <Icon v-if="row.fpp === 'yes'" name="solar:shield-star-bold" class="size-5 text-success" />
                                        </div>
                                        <div class="flex items-center text-xs whitespace-nowrap">
                                            <NuxtImg :src="row.country?.imageUrl" class="h-4 !rounded-sm w-6 object-cover shrink-0 mr-1.5" />
                                            <div class="opacity-75 font-semibold">{{ row.country?.name }}</div>
                                            <span class="capitalize font-light opacity-80">, {{ row.city?.toLowerCase() }}</span>
                                        </div>
                                        <div class="text-xs opacity-50 flex items-center gap-2">
                                            <span>👥 {{ row.membersCount || 0 }}</span>
                                            <span>📅 {{ row.businessEst || 'N/A' }}</span>
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div class="text-xs">
                                    <div class="hover:text-warning transition-colors cursor-pointer" @click="useClipboard(row.email?.toLowerCase())">
                                        <Icon name="solar:letter-outline" class="size-3 inline mr-1" />
                                        {{ row.email?.toLowerCase() }}
                                    </div>
                                    <div class="opacity-75">
                                        <Icon name="solar:phone-outline" class="size-3 inline mr-1" />
                                        {{ row.phone || 'N/A' }}
                                    </div>
                                    <div v-if="row.website" class="opacity-50 truncate max-w-[120px]">
                                        <a :href="useCheckUrl(row.website)" target="_blank" class="hover:text-primary flex items-center gap-1 group">
                                            <span class="truncate group-hover:underline" :title="row.website">
                                                {{ row.website.replace(/^https?:\/\//, '').replace(/^www\./, '') }}
                                            </span>
                                            <Icon name="solar:arrow-right-up-outline" class="size-2.5 opacity-50 group-hover:opacity-100" />
                                        </a>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div class="flex flex-col gap-1">
                                    <UiStatusBadge v-if="row.status" :data="row.status" />
                                    <div class="text-xs">
                                        <span v-if="row.active" class="text-success">● Active</span>
                                        <span v-else class="text-danger">● Inactive</span>
                                    </div>
                                    <div v-if="row.show_home" class="text-xs text-primary">🏠 Show on Home</div>
                                </div>
                            </td>
                            <td v-if="serverParams.deleted" class="text-sm">{{ row.deletedAt }}</td>
                            <td class="text-right">
                                <div class="flex items-center justify-end gap-2">
                                    <button v-if="useCheckPermission(['update-members-data-network'])" class="btn btn-secondary btn-rounded btn-sm gap-3" @click="openEditModal(row.id)">
                                        <Icon name="solar:pen-outline" class="size-4" />
                                        Edit
                                    </button>
                                </div>
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
                </tbody>
            </table>
        </div>

        <!-- Pagination -->
        <TablePagination :pending="status === 'pending'" :rows="rows" :page="serverParams.page" @change-page="changePage" />

        <!-- Add/Edit User Modal -->
        <TheModal :open-modal="userModalOpen" size="4xl" @close-modal="closeModal">
            <template #header>
                <div class="flex justify-between items-center">
                    <div class="font-medium text-lg">{{ isEditMode ? 'Edit User' : 'Add New User' }}</div>
                    <Icon class="w-8 h-8 opacity-50 cursor-pointer hover:opacity-100 ease-in-out duration-300" name="solar:close-square-outline" @click="closeModal" />
                </div>
            </template>
            <template #content>
                <div v-if="formLoading" class="flex justify-center items-center py-20">
                    <Icon name="svg-spinners:3-dots-fade" class="w-12 h-12 text-primary" />
                </div>
                <div v-else-if="!selectedUser" class="flex justify-center items-center py-20 text-slate-400">No data available</div>
                <div v-else class="grid lg:grid-cols-12 gap-6">
                    <!-- Basic Information -->
                    <div class="lg:col-span-12">
                        <h4 class="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">Basic Information</h4>
                        <div class="grid lg:grid-cols-12 gap-5">
                            <FormInputField v-model="selectedUser.name" class="lg:col-span-6" label="Name *" placeholder="Enter name" required />
                            <FormInputField v-model="selectedUser.email" class="lg:col-span-6" label="Email *" placeholder="Enter email" type="email" required />
                            <FormInputField v-model="selectedUser.phone" class="lg:col-span-6" label="Phone" placeholder="Enter phone" />
                            <FormInputField v-model="selectedUser.website" class="lg:col-span-6" label="Website" placeholder="Enter website" />
                        </div>
                    </div>

                    <!-- Address Information -->
                    <div class="lg:col-span-12">
                        <h4 class="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">Address Information</h4>
                        <div class="grid lg:grid-cols-12 gap-5">
                            <FormInputField v-model="selectedUser.addressLineOne" class="lg:col-span-6" label="Address Line 1" placeholder="Enter address" />
                            <FormInputField v-model="selectedUser.addressLineTwo" class="lg:col-span-6" label="Address Line 2" placeholder="Enter address" />
                            <FormInputField v-model="selectedUser.city" class="lg:col-span-4" label="City" placeholder="Enter city" />
                            <FormInputField v-model="selectedUser.state" class="lg:col-span-4" label="State" placeholder="Enter state" />
                            <FormInputField v-model="selectedUser.postalCode" class="lg:col-span-4" label="Postal Code" placeholder="Enter postal code" />
                            <FormSelectField
                                id="add-user-country"
                                v-model="selectedUser.countryId"
                                name="add-user-country"
                                class="lg:col-span-6"
                                label="Country *"
                                placeholder="Select country"
                                :select-data="resources.countries"
                                labelvalue="name"
                                keyvalue="id"
                                imgvalue="imageUrl"
                                required
                            />
                        </div>
                    </div>

                    <!-- Business Details -->
                    <div class="lg:col-span-12">
                        <h4 class="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">Business Details</h4>
                        <div class="grid lg:grid-cols-12 gap-5">
                            <FormInputField v-model="selectedUser.membersCount" class="lg:col-span-4" label="Members Count" placeholder="Enter members count" type="number" />
                            <FormInputField v-model="selectedUser.businessEst" class="lg:col-span-4" label="Business Established Year" placeholder="Enter year" type="number" />
                            <FormSelectField
                                v-model="selectedUser.fpp"
                                class="lg:col-span-4"
                                label="FPP Status"
                                placeholder="Select FPP status"
                                :select-data="[
                                    { name: 'Yes', value: 'yes' },
                                    { name: 'No', value: 'no' },
                                ]"
                                labelvalue="name"
                                keyvalue="value"
                            />
                            <FormInputField v-model="selectedUser.profile" class="lg:col-span-12" label="Profile" type="textarea" placeholder="Enter profile description" rows="4" />
                        </div>
                    </div>

                    <!-- Settings -->
                    <div class="lg:col-span-12">
                        <h4 class="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">Settings</h4>
                        <div class="grid lg:grid-cols-12 gap-5">
                            <FormSelectField v-model="selectedUser.status" class="lg:col-span-4" label="Status *" placeholder="Select status" :select-data="membershipStatuses" labelvalue="name" keyvalue="value" required />
                            <div class="lg:col-span-4 flex items-center gap-5 pt-2">
                                <FormSwitch v-model="selectedUser.active" label="Active" name="active-toggle" />
                                <FormSwitch v-model="selectedUser.show_home" label="Show on Home" name="show-home-toggle" />
                            </div>
                        </div>
                    </div>

                    <!-- Image -->
                    <div class="lg:col-span-12">
                        <FormUploader v-model="selectedUser.image" class="lg:col-span-12" :allowed-types="['image']" label="Image" name="image" />
                    </div>
                </div>
            </template>
            <template #footer>
                <div class="w-full flex items-center justify-end gap-5">
                    <button :disabled="formLoading" class="btn-rounded btn-sm btn btn-danger px-6 py-2.5" type="button" @click="closeModal">
                        <Icon :name="formLoading ? 'svg-spinners:3-dots-fade' : 'solar:close-circle-linear'" class="w-5 h-5 mr-2" />
                        <span>Cancel</span>
                    </button>
                    <button :disabled="formLoading || !selectedUser" class="btn-rounded btn-sm btn btn-primary px-6 py-2.5" type="button" @click="submitUser">
                        <Icon :name="formLoading ? 'svg-spinners:3-dots-fade' : 'solar:check-circle-broken'" class="w-5 h-5 mr-2" />
                        <span>{{ isEditMode ? 'Update' : 'Create' }}</span>
                    </button>
                </div>
            </template>
        </TheModal>
    </div>
</template>
