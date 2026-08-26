<script setup>
definePageMeta({
    middleware: ['auth', 'permission'],
    permissions: ['list-member'],
});

// ========== STATE ==========
const selectedRows = ref([]);
const isDeleting = ref(false);
const isRestoring = ref(false);
const isForceDeleting = ref(false);
const formLoading = ref(false);
const isOpen = ref(false);
const isViewModalOpen = ref(false);
const selectedRequest = ref(null);

const sortByList = ref([
    { name: 'Sort By ID', value: 'id' },
    { name: 'Sort By Date', value: 'created_at' },
]);

const filter = ref({
    name: null,
    countryId: null,
    wsaId: null,
    companyEmail: null,
    email: null,
});

const serverParams = ref({
    filters: {},
    orderBy: 'created_at',
    orderByDirection: 'desc',
    perPage: 10,
    page: 1,
    paginate: true,
    deleted: false,
});

const resources = useResourceStore();

// ========== API FETCH ==========
const {
    data: rows,
    status,
    refresh,
} = await useApiFetch('/api/make-request/index', {
    method: 'POST',
    body: serverParams,
    lazy: true,
});

// ========== COMPUTED ==========
const isSelected = (id) => {
    return selectedRows.value.some((r) => r === id);
};

const allSelected = computed(() => {
    return rows?.value?.data?.length > 0 && rows.value.data.every((row) => selectedRows.value.includes(row.id));
});

// ========== FILTER WATCHERS ==========
watch(
    filter,
    (newVal) => {
        for (const key in newVal) {
            const value = newVal[key];
            if (value && value !== '') {
                serverParams.value.filters[key] = value;
            } else {
                delete serverParams.value.filters[key];
            }
        }
    },
    { deep: true },
);

// ========== METHODS ==========
const applySearch = async () => {
    serverParams.value.page = 1;
    selectedRows.value = [];
    await refresh();
};

const resetServerParams = async () => {
    filter.value = {
        name: null,
        countryId: null,
        wsaId: null,
        companyEmail: null,
        email: null,
    };
    serverParams.value = {
        filters: {},
        orderBy: 'created_at',
        orderByDirection: 'desc',
        perPage: 10,
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

const selectAllRows = () => {
    if (!rows.value?.data?.length) return;

    const allSelectedNow = rows.value.data.every((row) => isSelected(row.id));
    if (allSelectedNow) {
        selectedRows.value = [];
    } else {
        selectedRows.value = rows.value.data.map((row) => row.id);
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

const changePage = async (value) => {
    const pageNumber = parseInt(value);
    if (!isNaN(pageNumber)) {
        serverParams.value.page = pageNumber;
        selectedRows.value = [];
        await refresh();
    }
};

// ========== CRUD OPERATIONS ==========
async function deleteItems() {
    if (isDeleting.value || selectedRows.value.length === 0) return;

    const confirmed = confirm(`Are you sure you want to delete ${selectedRows.value.length} item(s)?`);
    if (!confirmed) return;

    isDeleting.value = true;
    try {
        const { data, error } = await useApiFetch(`/api/make-request/delete`, {
            body: { items: selectedRows.value },
            method: 'DELETE',
        });

        if (data.value) {
            useToast({
                title: 'Success',
                message: data.value.message || 'Items deleted successfully',
                type: 'success',
                duration: 5000,
            });
            selectedRows.value = [];
            await refresh();
        }

        if (error.value) {
            useToast({
                title: 'Error',
                message: error.value.data?.message || 'Failed to delete items',
                type: 'error',
                duration: 5000,
            });
        }
    } catch (error) {
        useToast({
            title: 'Error',
            message: 'An unexpected error occurred',
            type: 'error',
            duration: 5000,
        });
    } finally {
        isDeleting.value = false;
    }
}

async function forceDeleteItems() {
    if (isForceDeleting.value || selectedRows.value.length === 0) return;

    const confirmed = confirm(`WARNING: This action is permanent!\n\nAre you sure you want to permanently delete ${selectedRows.value.length} item(s)?`);
    if (!confirmed) return;

    isForceDeleting.value = true;
    try {
        const { data, error } = await useApiFetch(`/api/make-request/force-delete`, {
            body: { items: selectedRows.value },
            method: 'DELETE',
        });

        if (data.value) {
            useToast({
                title: 'Success',
                message: data.value.message || 'Items permanently deleted',
                type: 'success',
                duration: 5000,
            });
            selectedRows.value = [];
            await refresh();
        }

        if (error.value) {
            useToast({
                title: 'Error',
                message: error.value.data?.message || 'Failed to delete items',
                type: 'error',
                duration: 5000,
            });
        }
    } catch (error) {
        useToast({
            title: 'Error',
            message: 'An unexpected error occurred',
            type: 'error',
            duration: 5000,
        });
    } finally {
        isForceDeleting.value = false;
    }
}

async function restoreItems() {
    if (isRestoring.value || selectedRows.value.length === 0) return;

    const confirmed = confirm(`Are you sure you want to restore ${selectedRows.value.length} item(s)?`);
    if (!confirmed) return;

    isRestoring.value = true;
    try {
        const { data, error } = await useApiFetch(`/api/make-request/restore`, {
            body: { items: selectedRows.value },
            method: 'POST',
        });

        if (data.value) {
            useToast({
                title: 'Success',
                message: data.value.message || 'Items restored successfully',
                type: 'success',
                duration: 5000,
            });
            selectedRows.value = [];
            await refresh();
        }

        if (error.value) {
            useToast({
                title: 'Error',
                message: error.value.data?.message || 'Failed to restore items',
                type: 'error',
                duration: 5000,
            });
        }
    } catch (error) {
        useToast({
            title: 'Error',
            message: 'An unexpected error occurred',
            type: 'error',
            duration: 5000,
        });
    } finally {
        isRestoring.value = false;
    }
}

// ========== MODAL HANDLERS ==========
const closeModal = () => {
    isOpen.value = false;
    formLoading.value = false;
};

const openModal = () => {
    formLoading.value = true;
    isOpen.value = true;
    formLoading.value = false;
};

const openViewModal = (request) => {
    selectedRequest.value = request;
    isViewModalOpen.value = true;
};

const closeViewModal = () => {
    isViewModalOpen.value = false;
    selectedRequest.value = null;
};

const viewRequest = (id) => {
    navigateTo(`/make-request/${id}`);
};

// ========== HELPER FUNCTIONS ==========
const formatDate = (date) => {
    if (!date) return '---';
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

const formatDateTime = (date) => {
    if (!date) return '---';
    return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const getMovementTypeText = (type) => {
    const types = {
        door_to_door: 'Door to Door',
        port_to_port: 'Port to Port',
        door_to_port: 'Door to Port',
        port_to_door: 'Port to Door',
    };
    return types[type] || type || '---';
};

const getFreightTermsText = (term) => {
    const terms = {
        prepaid: 'Prepaid',
        collect: 'Collect',
    };
    return terms[term] || term || '---';
};
</script>

<template>
    <div v-if="useCheckPermission(['show-members-data-member-requests'])" class="flex flex-col gap-8">
        <!-- Page Title & Action Buttons -->
        <div class="md:flex md:items-center md:justify-between md:gap-5">
            <div class="flex items-center gap-2">
                <Icon name="solar:clipboard-text-outline" class="size-5 opacity-75" />
                <div class="text-lg font-semibold">
                    {{ serverParams.deleted ? 'Deleted Shipment Requests' : 'Shipment Requests' }}
                    <span v-if="rows?.meta?.total" class="text-sm font-normal opacity-60 ml-2"> ({{ rows.meta.total }} total) </span>
                </div>
            </div>

            <div class="md:flex md:items-center md:gap-5 md:space-y-0 space-y-5">
                <template v-if="selectedRows.length > 0">
                    <div class="text-sm bg-primary/10 px-3 py-1.5 rounded-full">{{ selectedRows.length }} selected</div>

                    <template v-if="serverParams.deleted">
                        <button v-if="useCheckPermission(['forceDelete-members-data-member-requests'])" class="btn btn-danger btn-rounded px-6 btn-sm gap-3 md:w-fit w-full" :disabled="isForceDeleting" @click="forceDeleteItems">
                            <Icon :name="isForceDeleting ? 'svg-spinners:3-dots-fade' : 'solar:trash-bin-minimalistic-line-duotone'" class="size-5" />
                            {{ isForceDeleting ? 'Deleting...' : 'Delete Permanently' }}
                        </button>

                        <button v-if="useCheckPermission(['network_application_restore'])" class="btn btn-success btn-rounded px-6 btn-sm gap-3 md:w-fit w-full" :disabled="isRestoring" @click="restoreItems">
                            <Icon :name="isRestoring ? 'svg-spinners:3-dots-fade' : 'solar:restart-circle-outline'" class="size-5" />
                            {{ isRestoring ? 'Restoring...' : 'Restore Items' }}
                        </button>
                    </template>

                    <template v-else>
                        <button v-if="useCheckPermission(['delete-members-data-member-requests'])" class="btn btn-danger btn-rounded px-6 btn-sm gap-3 md:w-fit w-full" :disabled="isDeleting" @click="deleteItems">
                            <Icon :name="isDeleting ? 'svg-spinners:3-dots-fade' : 'solar:trash-bin-minimalistic-line-duotone'" class="size-5" />
                            {{ isDeleting ? 'Deleting...' : 'Delete Items' }}
                        </button>
                    </template>
                </template>

                <button v-if="useCheckPermission(['network_application_create'])" :disabled="serverParams.deleted" class="btn btn-primary btn-rounded px-6 btn-sm gap-3 md:w-fit w-full" @click="openModal()">
                    <Icon name="solar:add-square-linear" class="size-5" />
                    Add New Request
                </button>

                <button v-if="useCheckPermission(['delete-members-data-member-requests', 'forceDelete-members-data-member-requests', 'network_application_restore'])" class="btn btn-secondary btn-rounded px-6 btn-sm gap-3 md:w-fit w-full" @click="toggleDeleted">
                    <Icon :name="serverParams.deleted ? 'solar:hamburger-menu-line-duotone' : 'solar:trash-bin-minimalistic-line-duotone'" class="size-5" />
                    {{ serverParams.deleted ? 'Active Members List' : 'Deleted Members' }}
                </button>
            </div>
        </div>

        <!-- Filter & Search -->
        <div class="grid lg:grid-cols-12 gap-5 items-center p-5 bg-white border rounded-2xl">
            <FormInputField v-model="filter.name" rounded class="xl:col-span-4 lg:col-span-4" placeholder="Company Name" />
            <FormInputField v-model="filter.email" rounded class="xl:col-span-4 lg:col-span-4" placeholder="Email" />
            <FormSelectField
                id="add-member-country-filter"
                v-model="filter.countryId"
                name="add-member-country-filter"
                class="xl:col-span-4 lg:col-span-4"
                placeholder="Please select a country..."
                :select-data="resources.countries"
                labelvalue="name"
                keyvalue="id"
                imgvalue="imageUrl"
            />
            <FormSelectField v-model="serverParams.orderBy" :clearable="false" class="xl:col-span-6 lg:col-span-6" labelvalue="name" keyvalue="value" placeholder="Sort Direction" :select-data="sortByList" />
            <FormSelectField
                v-model="serverParams.orderByDirection"
                class="xl:col-span-6 lg:col-span-6"
                :clearable="false"
                labelvalue="name"
                keyvalue="value"
                placeholder="Sort Direction"
                :select-data="[
                    { name: 'Z : A', value: 'desc' },
                    { name: 'A : Z', value: 'asc' },
                ]"
            />
            <button class="xl:col-span-6 lg:col-span-6 btn btn-rounded btn-sm btn-primary gap-3 w-full" @click="applySearch">
                <Icon name="solar:magnifer-linear" class="size-5 shrink-0" />
                Filter
            </button>
            <button class="xl:col-span-6 lg:col-span-6 btn btn-rounded btn-sm btn-secondary gap-3 w-full" @click="resetServerParams">
                <Icon name="solar:restart-circle-outline" class="size-5 shrink-0" />
                Reset
            </button>
        </div>

        <!-- Table -->
        <!-- Table -->
        <div class="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table class="w-full">
                <thead>
                    <tr class="border-b border-gray-200 bg-gray-50">
                        <th class="px-4 py-4 text-left w-10">
                            <input v-model="allSelected" type="checkbox" class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" @change="selectAllRows" />
                        </th>
                        <th class="px-4 py-4 text-left">
                            <span class="text-xs font-semibold uppercase tracking-wider text-gray-500">Request Info</span>
                        </th>
                        <th class="px-4 py-4 text-left">
                            <span class="text-xs font-semibold uppercase tracking-wider text-gray-500">Route</span>
                        </th>
                        <th class="px-4 py-4 text-left">
                            <span class="text-xs font-semibold uppercase tracking-wider text-gray-500">Cargo Details</span>
                        </th>
                        <th class="px-4 py-4 text-left">
                            <span class="text-xs font-semibold uppercase tracking-wider text-gray-500">Dates</span>
                        </th>
                        <th v-if="serverParams.deleted" class="px-4 py-4 text-left">
                            <span class="text-xs font-semibold uppercase tracking-wider text-gray-500">Deleted At</span>
                        </th>
                        <th v-if="!serverParams.deleted" class="px-4 py-4 text-right">
                            <span class="text-xs font-semibold uppercase tracking-wider text-gray-500">Action</span>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <template v-if="status !== 'pending' && rows?.data?.length">
                        <tr v-for="row in rows.data" :key="row.id" class="border-b border-gray-100 hover:bg-gray-50/80 transition-colors duration-200">
                            <!-- Checkbox -->
                            <td class="px-4 py-4">
                                <input :checked="isSelected(row.id)" type="checkbox" class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" @change="toggleRowSelection(row.id)" />
                            </td>

                            <!-- Request Info Column -->
                            <td class="px-4 py-4">
                                <div class="space-y-2">
                                    <div class="flex items-center gap-2">
                                        <div class="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5 text-gray-500">
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.95 18.95 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"
                                                />
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <span class="text-xs text-gray-400">ID</span>
                                            <p class="text-sm font-semibold text-gray-800">#{{ row.id }}</p>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <div class="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5 text-blue-500">
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z"
                                                />
                                            </svg>
                                        </div>
                                        <div>
                                            <span class="text-xs text-gray-400">Shipper</span>
                                            <p class="text-sm font-medium text-gray-700 truncate max-w-[160px]" :title="row.shipper_company_name">{{ row.shipper_company_name || '---' }}</p>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <div class="w-6 h-6 rounded-lg bg-purple-50 flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5 text-purple-500">
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                                                />
                                            </svg>
                                        </div>
                                        <div>
                                            <span class="text-xs text-gray-400">Contact</span>
                                            <p class="text-sm font-medium text-gray-700">{{ row.contact_person_name || '---' }}</p>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <div class="w-6 h-6 rounded-lg bg-green-50 flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5 text-green-500">
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                                                />
                                            </svg>
                                        </div>
                                        <div>
                                            <span class="text-xs text-gray-400">Email</span>
                                            <p class="text-xs text-blue-600 truncate max-w-[160px] cursor-pointer hover:underline" @click="useClipboard(row.contact_person_email?.toLowerCase())">
                                                {{ row.contact_person_email?.toLowerCase() || '---' }}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </td>

                            <!-- Route Column -->
                            <td class="px-4 py-4">
                                <div class="space-y-3">
                                    <!-- Origin -->
                                    <div class="flex items-start gap-2">
                                        <div class="w-6 h-6 rounded-lg bg-cyan-50 flex items-center justify-center mt-0.5">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5 text-cyan-600">
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253"
                                                />
                                            </svg>
                                        </div>
                                        <div>
                                            <span class="text-xs text-gray-400">Origin</span>
                                            <p class="text-sm font-semibold text-gray-800">{{ row.pol_city || '---' }}</p>
                                            <p class="text-xs text-gray-500">{{ row.pol_country || '---' }}</p>
                                        </div>
                                    </div>
                                    <!-- Arrow -->
                                    <div class="flex justify-center -my-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-gray-300">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
                                        </svg>
                                    </div>
                                    <!-- Destination -->
                                    <div class="flex items-start gap-2">
                                        <div class="w-6 h-6 rounded-lg bg-orange-50 flex items-center justify-center mt-0.5">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5 text-orange-500">
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z"
                                                />
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z"
                                                />
                                            </svg>
                                        </div>
                                        <div>
                                            <span class="text-xs text-gray-400">Destination</span>
                                            <p class="text-sm font-semibold text-gray-800">{{ row.pod_city || '---' }}</p>
                                            <p class="text-xs text-gray-500">{{ row.pod_country || '---' }}</p>
                                        </div>
                                    </div>
                                    <!-- Badges -->
                                    <div class="flex flex-wrap gap-1.5 pt-2">
                                        <span class="px-2 py-0.5 text-[10px] font-medium rounded-full bg-blue-50 text-blue-600">{{ getMovementTypeText(row.movement_type) }}</span>
                                        <span class="px-2 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 text-gray-600">{{ row.incoterms || '---' }}</span>
                                    </div>
                                </div>
                            </td>

                            <!-- Cargo Details Column -->
                            <td class="px-4 py-4">
                                <div class="space-y-2">
                                    <div class="flex items-center gap-2">
                                        <div class="w-6 h-6 rounded-lg bg-yellow-50 flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5 text-yellow-600">
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
                                                />
                                            </svg>
                                        </div>
                                        <div>
                                            <span class="text-xs text-gray-400">Commodity</span>
                                            <p class="text-sm font-medium text-gray-700 truncate max-w-[150px]" :title="row.commodity">{{ row.commodity || '---' }}</p>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <div class="w-6 h-6 rounded-lg bg-teal-50 flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5 text-teal-600">
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.95 18.95 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"
                                                />
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <span class="text-xs text-gray-400">HS Code</span>
                                            <p class="text-sm font-mono text-gray-700">{{ row.hs_code || '---' }}</p>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <div class="w-6 h-6 rounded-lg bg-red-50 flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5 text-red-500">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <span class="text-xs text-gray-400">Weight</span>
                                            <p class="text-sm font-medium text-gray-700">
                                                {{ row.gross_weight || '0' }} <span class="text-xs text-gray-400">{{ row.weight_unit || 'KG' }}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <div class="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5 text-emerald-600">
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
                                                />
                                            </svg>
                                        </div>
                                        <div>
                                            <span class="text-xs text-gray-400">Volume</span>
                                            <p class="text-sm font-medium text-gray-700">
                                                {{ row.volume || '0' }} <span class="text-xs text-gray-400">{{ row.volume_unit || 'CBM' }}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <div class="w-6 h-6 rounded-lg bg-pink-50 flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5 text-pink-500">
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.22-1.113-.62-1.53a15.792 15.792 0 0 0-2.853-2.045M12.75 7.5h-1.5"
                                                />
                                            </svg>
                                        </div>
                                        <div>
                                            <span class="text-xs text-gray-400">Packages</span>
                                            <p class="text-sm font-medium text-gray-700">
                                                {{ row.package_number || '0' }} <span class="text-xs text-gray-400">{{ row.packing_type || 'pcs' }}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </td>

                            <!-- Dates Column -->
                            <td class="px-4 py-4">
                                <div class="space-y-2">
                                    <div class="flex items-center gap-2">
                                        <div class="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5 text-gray-500">
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                                                />
                                            </svg>
                                        </div>
                                        <div>
                                            <span class="text-xs text-gray-400">Created</span>
                                            <p class="text-sm font-medium text-gray-700">{{ formatDate(row.created_at) }}</p>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <div class="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5 text-blue-500">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <span class="text-xs text-gray-400">ETD</span>
                                            <p class="text-sm font-medium text-gray-700">{{ formatDate(row.rtd_pol) || '---' }}</p>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <div class="w-6 h-6 rounded-lg bg-green-50 flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5 text-green-500">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
                                            </svg>
                                        </div>
                                        <div>
                                            <span class="text-xs text-gray-400">ETA</span>
                                            <p class="text-sm font-semibold text-green-600">{{ formatDate(row.eta_pod) || '---' }}</p>
                                        </div>
                                    </div>
                                </div>
                            </td>

                            <!-- Deleted At Column -->
                            <td v-if="serverParams.deleted" class="px-4 py-4">
                                <div class="flex items-center gap-2">
                                    <div class="w-6 h-6 rounded-lg bg-red-50 flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5 text-red-500">
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <span class="text-xs text-gray-400">Deleted</span>
                                        <p class="text-sm font-medium text-gray-700">{{ formatDate(row.deleted_at) }}</p>
                                    </div>
                                </div>
                            </td>

                            <!-- Action Column -->
                            <td v-if="!serverParams.deleted" class="px-4 py-4 text-right">
                                <button
                                    @click="openViewModal(row)"
                                    class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                                        />
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                    </svg>
                                    View
                                </button>
                            </td>
                        </tr>
                    </template>

                    <!-- Empty State -->
                    <template v-else-if="status !== 'pending' && !rows?.data?.length">
                        <tr>
                            <td :colspan="serverParams.deleted ? 6 : 7" class="px-4 py-16 text-center">
                                <div class="flex flex-col items-center justify-center gap-3">
                                    <div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 text-gray-400">
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
                                            />
                                        </svg>
                                    </div>
                                    <p class="text-gray-500 font-medium">No shipment requests found</p>
                                    <p class="text-sm text-gray-400">Try adjusting your filters or create a new request</p>
                                    <button
                                        v-if="!serverParams.deleted && useCheckPermission(['create-members-data-member-requests'])"
                                        class="mt-2 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                                        @click="openModal"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                        </svg>
                                        Create New Request
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </template>

                    <!-- Loading State -->
                    <template v-else>
                        <tr v-for="i in serverParams.perPage" :key="i">
                            <td :colspan="serverParams.deleted ? 6 : 7" class="px-4 py-3">
                                <div class="h-12 bg-gray-100 animate-pulse rounded-lg" />
                            </td>
                        </tr>
                    </template>
                </tbody>
            </table>
        </div>

        <!-- Pagination -->
        <TablePagination :pending="status === 'pending'" :rows="rows" :page="serverParams.page" @change-page="changePage" />

        <!-- Add Request Modal -->
        <MemberAddModal v-if="isOpen" :open="isOpen" @close="closeModal" @success="viewRequest" />

        <!-- View Request Modal -->
        <TheModal :open-modal="isViewModalOpen" size="4xl" @close-modal="closeViewModal">
            <template #header>
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-3">
                        <Icon name="solar:clipboard-text-linear" class="size-6 text-primary" />
                        <div>
                            <div class="font-semibold text-lg">Shipment Request Details</div>
                            <div class="text-xs text-gray-500">Request ID: #{{ selectedRequest?.id }}</div>
                        </div>
                    </div>
                    <Icon class="w-8 h-8 opacity-50 cursor-pointer hover:opacity-100 ease-in-out duration-300" name="solar:close-square-outline" @click="closeViewModal" />
                </div>
            </template>
            <template #content>
                <div v-if="selectedRequest" class="space-y-6">
                    <!-- Shipper & Consignee Info -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="bg-gray-50 rounded-xl p-4">
                            <div class="flex items-center gap-2 mb-3 pb-2 border-b">
                                <Icon name="solar:shop-linear" class="size-5 text-primary" />
                                <h3 class="font-semibold">Shipper Information</h3>
                            </div>
                            <div class="space-y-2">
                                <div class="flex justify-between">
                                    <span class="text-sm text-gray-500">Company:</span>
                                    <span class="text-sm font-medium">{{ selectedRequest.shipper_company_name || '---' }}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-sm text-gray-500">Contact Person:</span>
                                    <span class="text-sm">{{ selectedRequest.shipper_name || '---' }}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-sm text-gray-500">Phone:</span>
                                    <span class="text-sm">{{ selectedRequest.shipper_number || '---' }}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-sm text-gray-500">Email:</span>
                                    <span class="text-sm text-primary-600">{{ selectedRequest.shipper_email || '---' }}</span>
                                </div>
                            </div>
                        </div>
                        <div class="bg-gray-50 rounded-xl p-4">
                            <div class="flex items-center gap-2 mb-3 pb-2 border-b">
                                <Icon name="solar:user-check-linear" class="size-5 text-primary" />
                                <h3 class="font-semibold">Consignee Information</h3>
                            </div>
                            <div class="space-y-2">
                                <div class="flex justify-between">
                                    <span class="text-sm text-gray-500">Company:</span>
                                    <span class="text-sm font-medium">{{ selectedRequest.consignee_name || '---' }}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-sm text-gray-500">Contact Person:</span>
                                    <span class="text-sm">{{ selectedRequest.contact_person_name || '---' }}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-sm text-gray-500">Phone:</span>
                                    <span class="text-sm">{{ selectedRequest.contact_person_number || '---' }}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-sm text-gray-500">Email:</span>
                                    <span class="text-sm text-primary-600">{{ selectedRequest.contact_person_email || '---' }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Route Details -->
                    <div class="bg-gray-50 rounded-xl p-4">
                        <div class="flex items-center gap-2 mb-3 pb-2 border-b">
                            <Icon name="solar:map-point-linear" class="size-5 text-primary" />
                            <h3 class="font-semibold">Route Details</h3>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <div class="text-sm text-gray-500 mb-1">Place of Loading (POL)</div>
                                <div class="font-medium">{{ selectedRequest.pol || '---' }}</div>
                                <div class="text-sm">{{ selectedRequest.pol_city }}, {{ selectedRequest.pol_country }}</div>
                            </div>
                            <div>
                                <div class="text-sm text-gray-500 mb-1">Place of Discharge (POD)</div>
                                <div class="font-medium">{{ selectedRequest.pod || '---' }}</div>
                                <div class="text-sm">{{ selectedRequest.pod_city }}, {{ selectedRequest.pod_country }}</div>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4 mt-3 pt-3 border-t">
                            <div>
                                <div class="text-sm text-gray-500">Movement Type</div>
                                <div class="font-medium">{{ getMovementTypeText(selectedRequest.movement_type) }}</div>
                            </div>
                            <div>
                                <div class="text-sm text-gray-500">Incoterms</div>
                                <div class="font-medium">{{ selectedRequest.incoterms || '---' }}</div>
                            </div>
                            <div>
                                <div class="text-sm text-gray-500">Freight Terms</div>
                                <div class="font-medium">{{ getFreightTermsText(selectedRequest.freight_terms) }}</div>
                            </div>
                            <div>
                                <div class="text-sm text-gray-500">Insurance</div>
                                <div class="font-medium">{{ selectedRequest.insurance ? 'Included' : 'Not Included' }}</div>
                            </div>
                        </div>
                    </div>

                    <!-- Cargo Details -->
                    <div class="bg-gray-50 rounded-xl p-4">
                        <div class="flex items-center gap-2 mb-3 pb-2 border-b">
                            <Icon name="solar:box-linear" class="size-5 text-primary" />
                            <h3 class="font-semibold">Cargo Details</h3>
                        </div>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <div class="text-sm text-gray-500">Commodity</div>
                                <div class="font-medium">{{ selectedRequest.commodity || '---' }}</div>
                            </div>
                            <div>
                                <div class="text-sm text-gray-500">HS Code</div>
                                <div class="font-mono">{{ selectedRequest.hs_code || '---' }}</div>
                            </div>
                            <div>
                                <div class="text-sm text-gray-500">Packages</div>
                                <div>{{ selectedRequest.package_number || '0' }} {{ selectedRequest.packing_type || 'pcs' }}</div>
                            </div>
                            <div>
                                <div class="text-sm text-gray-500">Packing Type</div>
                                <div>{{ selectedRequest.packing_type || '---' }}</div>
                            </div>
                            <div>
                                <div class="text-sm text-gray-500">Gross Weight</div>
                                <div>{{ selectedRequest.gross_weight || '0' }} {{ selectedRequest.weight_unit }}</div>
                            </div>
                            <div>
                                <div class="text-sm text-gray-500">Net Weight</div>
                                <div>{{ selectedRequest.net_weight || '0' }} {{ selectedRequest.weight_unit }}</div>
                            </div>
                            <div>
                                <div class="text-sm text-gray-500">Volume</div>
                                <div>{{ selectedRequest.volume || '0' }} {{ selectedRequest.volume_unit }}</div>
                            </div>
                            <div>
                                <div class="text-sm text-gray-500">Dimensions</div>
                                <div>{{ selectedRequest.goods_Length || '0' }} x {{ selectedRequest.goods_width || '0' }} x {{ selectedRequest.goods_height || '0' }} {{ selectedRequest.dimensions_unit }}</div>
                            </div>
                        </div>
                        <div class="mt-3 pt-3 border-t">
                            <div class="text-sm text-gray-500 mb-1">Goods Description</div>
                            <div class="text-sm">{{ selectedRequest.goods_description || '---' }}</div>
                        </div>
                    </div>

                    <!-- Container Details -->
                    <div v-if="selectedRequest.container_number_one || selectedRequest.container_number_two" class="bg-gray-50 rounded-xl p-4">
                        <div class="flex items-center gap-2 mb-3 pb-2 border-b">
                            <Icon name="solar:inbox-linear" class="size-5 text-primary" />
                            <h3 class="font-semibold">Container Details</h3>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <div class="text-sm text-gray-500">Container 1</div>
                                <div class="font-medium">{{ selectedRequest.container_type_one || '---' }}</div>
                                <div class="text-sm">{{ selectedRequest.container_number_one || '---' }}</div>
                            </div>
                            <div>
                                <div class="text-sm text-gray-500">Container 2</div>
                                <div class="font-medium">{{ selectedRequest.container_type_two || '---' }}</div>
                                <div class="text-sm">{{ selectedRequest.container_number_two || '---' }}</div>
                            </div>
                        </div>
                    </div>

                    <!-- Dates -->
                    <div class="bg-gray-50 rounded-xl p-4">
                        <div class="flex items-center gap-2 mb-3 pb-2 border-b">
                            <Icon name="solar:calendar-linear" class="size-5 text-primary" />
                            <h3 class="font-semibold">Important Dates</h3>
                        </div>
                        <div class="grid grid-cols-3 gap-4">
                            <div>
                                <div class="text-sm text-gray-500">Request Created</div>
                                <div class="font-medium">{{ formatDateTime(selectedRequest.created_at) }}</div>
                            </div>
                            <div>
                                <div class="text-sm text-gray-500">Ready to Depart (ETD)</div>
                                <div class="font-medium">{{ formatDate(selectedRequest.rtd_pol) }}</div>
                            </div>
                            <div>
                                <div class="text-sm text-gray-500">Estimated Arrival (ETA)</div>
                                <div class="font-medium text-primary">{{ formatDate(selectedRequest.eta_pod) }}</div>
                            </div>
                        </div>
                    </div>

                    <!-- Documents -->
                    <div v-if="selectedRequest.document" class="bg-gray-50 rounded-xl p-4">
                        <div class="flex items-center gap-2 mb-3 pb-2 border-b">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5 text-blue-600">
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                                />
                            </svg>
                            <h3 class="font-semibold text-gray-800">Attached Documents</h3>
                        </div>
                        <a :href="selectedRequest.document" download class="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                            Download Document
                        </a>
                    </div>
                </div>
            </template>
            <template #footer>
                <div class="w-full flex items-center justify-end gap-3">
                    <button class="btn-rounded btn-sm btn btn-secondary px-4" type="button" @click="closeViewModal">
                        <Icon name="solar:close-circle-linear" class="w-5 h-5" />
                        <span>Close</span>
                    </button>
                </div>
            </template>
        </TheModal>
    </div>
</template>

<style scoped>
.badge {
    @apply px-2 py-0.5 text-xs rounded-full font-medium;
}
.badge-sm {
    @apply px-1.5 py-0.5 text-[11px];
}
.badge-primary {
    @apply bg-blue-100 text-blue-700;
}
.badge-secondary {
    @apply bg-gray-100 text-gray-700;
}
</style>
