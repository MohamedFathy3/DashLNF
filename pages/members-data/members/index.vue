<script setup>
import * as XLSX from 'xlsx';
import FileSaver from 'file-saver';

definePageMeta({
    middleware: 'auth',
});

const selectedRows = ref([]);
const sortByList = ref([
    { name: 'Sort By Name', value: 'name' },
    { name: 'Sort By ID', value: 'id' },
]);

const filter = ref({
    name: null,
    countryId: null,
    companyEmail: null,
    email: null,
    phone: null,
    website: null,
    address: null,
    city: null,
    userId: null,
});

const networkFilter = ref({
    status: null,
    typeCompany: null,
});

const membershipTypes = ref([
    { name: 'Member', value: 'member' },
    { name: 'Founder', value: 'founder' },
    { name: 'Vendor', value: 'vendor' },
]);

const membershipStatuses = [
    { name: 'Approved', value: 'approved' },
    { name: 'Suspended', value: 'suspended' },
    { name: 'Blacklisted', value: 'blacklisted' },
];

const serverParams = ref({
    filters: {},
    networkFilter: {
        status: ['approved', 'suspended', 'blacklisted'],
        type: [],
        typeCompany: [],
    },
    orderBy: 'id',
    orderByDirection: 'desc',
    perPage: 25,
    page: 1,
    paginate: true,
    deleted: false,
});

// جلب الـ Users للـ Select
const userSearchParams = ref({
    filters: {},
    orderBy: 'id',
    orderByDirection: 'desc',
    perPage: 1000,
    page: 1,
    paginate: true,
    deleted: false,
});

const { data: usersData, refresh: refreshUsers } = await useApiFetch('/api/user/index', {
    method: 'POST',
    body: userSearchParams,
    lazy: true,
});

const resources = useResourceStore();
const showFilter = ref(false);
const formLoading = ref(false);
const networkModalOpen = ref(false);
const selectedNetwork = ref(null);
const isEditMode = ref(false);
const isOpen = ref(false);

// جلب الإحصائيات من API
const { data: networkStatistics, execute: fetchNetworkStatistics } = await useApiFetch('/api/dashboard/network/statistic', {
    immediate: false,
    lazy: true,
});

const networkInfoBoxes = ref([
    {
        title: 'Total Companies',
        icon: 'solar:users-group-two-rounded-outline',
        value: 0,
        description: 'Companies',
    },
    {
        title: 'Countries',
        icon: 'solar:earth-outline',
        value: 0,
        description: 'With Companies',
    },
    {
        title: 'Approved',
        icon: 'solar:check-circle-line-duotone',
        value: 0,
        description: 'Companies',
    },
    {
        title: 'Pending',
        icon: 'solar:clock-circle-line-duotone',
        value: 0,
        description: 'Companies',
    },
]);

async function prepareInfoBoxes() {
    await fetchNetworkStatistics();
    if (networkStatistics.value?.data) {
        networkInfoBoxes.value = [
            {
                title: 'Total Companies',
                icon: 'solar:users-group-two-rounded-outline',
                value: networkStatistics.value.data.total || 0,
                description: 'Companies',
            },
            {
                title: 'Countries',
                icon: 'solar:earth-outline',
                value: networkStatistics.value.data.totalCountries || 0,
                description: 'With Companies',
            },
            {
                title: 'Approved',
                icon: 'solar:check-circle-line-duotone',
                value: networkStatistics.value.data.totalApproved || 0,
                description: 'Companies',
            },
            {
                title: 'Pending',
                icon: 'solar:clock-circle-line-duotone',
                value: networkStatistics.value.data.totalPending || 0,
                description: 'Companies',
            },
        ];
    }
}

function toggleShowMoreFilterOptions() {
    showFilter.value = !showFilter.value;
}

const resetServerParams = async () => {
    filter.value = {
        name: null,
        countryId: null,
        companyEmail: null,
        email: null,
        phone: null,
        website: null,
        address: null,
        city: null,
        userId: null,
    };
    networkFilter.value = {
        status: null,
        typeCompany: null,
    };
    serverParams.value = {
        filters: {},
        networkFilter: {
            status: ['approved', 'suspended', 'blacklisted'],
            type: [],
            typeCompany: [],
        },
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
} = await useApiFetch('/api/member-network/index', {
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
    const { data: exportData, error: errorExport } = await useApiFetch('/api/member-network/index', {
        method: 'POST',
        body: exportServerParams,
    });
    if (exportData.value) {
        const worksheet = XLSX.utils.json_to_sheet(exportData.value.data);
        const workbook = XLSX.utils.book_new();
        const fileName = `Companies_${new Date().toLocaleDateString()}_${new Date().getHours()}_${new Date().getMinutes()}.xlsx`;
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

watch(
    networkFilter,
    (newVal) => {
        for (const key in newVal) {
            const value = newVal[key];
            if (value !== null && value !== '') {
                serverParams.value.networkFilter[key] = value;
            } else {
                delete serverParams.value.networkFilter[key];
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
    return rows?.value?.data.every((row) => selectedRows.value.includes(row.id));
});

const selectAllRows = () => {
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
        const { data, error } = await useApiFetch(`/api/member-network/delete`, {
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
        const { data, error } = await useApiFetch(`/api/member-network/force-delete`, {
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
        const { data, error } = await useApiFetch(`/api/member-network/restore`, {
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
    formLoading.value = false;
    selectedNetwork.value = {
        name: '',
        address: '',
        city: '',
        company_email: '',
        email: '',
        phone: '',
        website: '',
        type_company: 'hq',
        country_id: null,
        status: 'pending',
        type: 'member',
        unhashed_password: '',
        user_id: null,
        phone_key_id: 1,
        image: null,
    };
    networkModalOpen.value = true;
}

async function openEditModal(id) {
    isEditMode.value = true;
    formLoading.value = true;
    networkModalOpen.value = true;

    const { data, error } = await useApiFetch(`/api/member-network/${id}`, {
        method: 'GET',
        lazy: true,
    });

    if (data.value) {
        // خد الصورة كاملة زي ما هي (object كامل)
        let imageData = data.value.data.image || null;

        // لو الصورة جاية كـ string (URL) بدل object
        if (typeof imageData === 'string') {
            imageData = {
                id: data.value.data.id,
                fullUrl: imageData,
                name: data.value.data.name || 'image',
            };
        }

        // لو في imageUrl بس ومفيش image object
        if (!imageData && data.value.data.imageUrl) {
            imageData = {
                id: data.value.data.id,
                fullUrl: data.value.data.imageUrl,
                name: data.value.data.name || 'image',
            };
        }

        selectedNetwork.value = {
            ...data.value.data,
            country_id: data.value.data.country?.id || null,
            user_id: data.value.data.user?.id || null,
            image: imageData, // حط الكائن كامل
        };
        formLoading.value = false;
    }
    if (error.value) {
        useToast({ title: 'Error', message: error.value.message || 'Failed to load company', type: 'error', duration: 5000 });
        formLoading.value = false;
        networkModalOpen.value = false;
    }
}

function closeModal() {
    networkModalOpen.value = false;
    setTimeout(() => {
        selectedNetwork.value = null;
        formLoading.value = false;
        isEditMode.value = false;
    }, 300);
}

async function submitNetwork() {
    if (!selectedNetwork.value) return;

    formLoading.value = true;
    const url = isEditMode.value ? `/api/member-network/${selectedNetwork.value.id}` : '/api/member-network/create';

    const method = isEditMode.value ? 'PUT' : 'POST';

    // استخرج الـ ID من الصورة
    let imageId = null;
    if (selectedNetwork.value.image) {
        if (typeof selectedNetwork.value.image === 'number') {
            imageId = selectedNetwork.value.image;
        } else if (selectedNetwork.value.image.id) {
            imageId = selectedNetwork.value.image.id;
        } else if (selectedNetwork.value.image.fullUrl) {
            // لو الصورة object مع fullUrl بس
            imageId = selectedNetwork.value.image.id || null;
        }
    }

    const payload = {
        name: selectedNetwork.value.name,
        address: selectedNetwork.value.address,
        city: selectedNetwork.value.city,
        status: selectedNetwork.value.status,
        company_email: selectedNetwork.value.company_email,
        type: selectedNetwork.value.type,
        email: selectedNetwork.value.email,
        phone: selectedNetwork.value.phone,
        website: selectedNetwork.value.website,
        unhashed_password: selectedNetwork.value.unhashed_password,
        type_company: selectedNetwork.value.type_company,
        phone_key_id: selectedNetwork.value.phone_key_id || 1,
        country_id: selectedNetwork.value.country_id,
        user_id: selectedNetwork.value.user_id,
        image: imageId, // نبعت الـ ID بس
    };

    const { data, error } = await useApiFetch(url, {
        method: method,
        body: payload,
        lazy: true,
    });

    if (data.value) {
        useToast({
            title: 'Success',
            message: isEditMode.value ? 'Company updated successfully' : 'Company created successfully',
            type: 'success',
            duration: 5000,
        });
        closeModal();
        await refresh();
        await prepareInfoBoxes();
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

const appliedCatTypes = ref([]);
const config = useRuntimeConfig();
const categoryTypes = ref([
    { id: 'hq', label: 'Headquarters' },
    { id: 'branch', label: 'Branch' },
    { id: 'sub_agent', label: 'Sub Agent' },
]);

const initDownloadByType = async () => {
    formLoading.value = true;
    const networkUrl = config.public.apiUrl + '/export-excel/report-network-category';
    const categoryParam = '?category=' + encodeURIComponent(JSON.stringify(appliedCatTypes.value));
    if (appliedCatTypes.value.length > 0) {
        navigateTo(networkUrl + categoryParam, {
            external: true,
        });
    } else {
        navigateTo(networkUrl, {
            external: true,
        });
    }
    formLoading.value = false;
};

function closeModalExport() {
    isOpen.value = false;
    appliedCatTypes.value = [];
}

function openModalExport() {
    isOpen.value = true;
    appliedCatTypes.value = [];
}

onMounted(() => {
    prepareInfoBoxes();
});
</script>

<template>
    <div class="flex flex-col gap-8">
        <!-- Page Title & Action Buttons -->
        <div class="lg:flex lg:items-center lg:justify-between md:gap-5">
            <div class="flex items-center gap-2">
                <Icon name="solar:case-minimalistic-linear" class="size-5 opacity-75" />
                <div>{{ serverParams.deleted ? 'Deleted Companies' : 'Companies' }}</div>
            </div>
            <div class="flex lg:flex-row flex-col lg:items-center lg:gap-5 lg:space-y-0 space-y-5">
                <button class="btn btn-primary btn-rounded px-6 btn-sm gap-3 lg:w-fit w-full lg:mt-0 mt-5" type="button" @click="openAddModal">
                    <Icon name="solar:add-circle-linear" class="size-5 opacity-75" />
                    <span>Add Company</span>
                </button>

                <button class="btn btn-dark btn-rounded px-6 btn-sm gap-3 lg:w-fit w-full lg:mt-0 mt-5" type="button" @click="onExport">
                    <Icon name="solar:download-outline" class="size-5 opacity-75" />
                    <span>Export XLSX</span>
                </button>

                <button class="btn btn-dark btn-rounded px-6 btn-sm gap-3 lg:w-fit w-full lg:mt-0 mt-5" type="button" @click="openModalExport">
                    <Icon name="solar:download-outline" class="size-5 opacity-75" />
                    <span>Export By Category</span>
                </button>

                <template v-if="selectedRows.length > 0">
                    <template v-if="serverParams.deleted">
                        <button class="btn btn-danger btn-rounded px-6 btn-sm gap-3 lg:w-fit w-full lg:mt-0 mt-5" @click="forceDeleteItems">
                            <Icon name="solar:trash-bin-minimalistic-line-duotone" class="size-5 opacity-75" />
                            Delete Permanently
                        </button>
                    </template>
                    <template v-else>
                        <button class="btn btn-danger btn-rounded px-6 btn-sm gap-3 lg:w-fit w-full lg:mt-0 mt-5" @click="deleteItems">
                            <Icon name="solar:trash-bin-minimalistic-line-duotone" class="size-5 opacity-75" />
                            Delete Items
                        </button>
                    </template>
                    <template v-if="serverParams.deleted">
                        <button class="btn btn-success btn-rounded px-6 btn-sm gap-3 lg:w-fit w-full lg:mt-0 mt-5" @click="restoreItems">
                            <Icon name="solar:restart-circle-outline" class="size-5 opacity-75" />
                            Restore Items
                        </button>
                    </template>
                </template>
                <button class="btn btn-primary btn-rounded px-6 btn-sm gap-3 lg:w-fit w-full lg:mt-0 mt-5" @click="toggleDeleted">
                    <Icon :name="serverParams.deleted ? 'solar:hamburger-menu-line-duotone' : 'solar:trash-bin-minimalistic-line-duotone'" class="size-5 opacity-75" />
                    {{ serverParams.deleted ? 'Active Companies List' : 'Deleted Companies' }}
                </button>
            </div>
        </div>

        <!-- Company Statistics -->
        <UiInfoBox :data="networkInfoBoxes" />

        <!-- Filter & Search -->
        <div class="grid lg:grid-cols-12 gap-5 items-center p-5 bg-white border rounded-2xl">
            <FormInputField v-model="filter.name" rounded class="xl:col-span-4 lg:col-span-4" placeholder="Company Name" label="Company Name" />
            <FormInputField v-model="filter.email" rounded class="xl:col-span-4 lg:col-span-4" placeholder="Login Email" label="Login Email" />
            <FormSelectField
                id="add-network-country-filter"
                v-model="filter.countryId"
                name="add-network-country-filter"
                class="lg:col-span-4 xl:col-span-4"
                placeholder="Please select a country..."
                label="Country"
                :select-data="resources.countries"
                labelvalue="name"
                keyvalue="id"
                imgvalue="imageUrl"
            />

            <TransitionExpand>
                <div v-if="showFilter" class="lg:col-span-12 grid lg:grid-cols-12 gap-5 items-center">
                    <FormInputField v-model="filter.companyEmail" rounded class="xl:col-span-4 lg:col-span-4" placeholder="Company Email" label="Company Email" />
                    <FormInputField v-model="filter.phone" rounded class="xl:col-span-4 lg:col-span-4" placeholder="Phone Number" label="Phone" />
                    <FormInputField v-model="filter.website" rounded class="xl:col-span-4 lg:col-span-4" placeholder="Website" label="Website" />
                    <FormInputField v-model="filter.address" rounded class="xl:col-span-4 lg:col-span-4" placeholder="Address" label="Address" />
                    <FormInputField v-model="filter.city" rounded class="xl:col-span-4 lg:col-span-4" placeholder="City" label="City" />

                    <FormSelectField
                        id="filter-user"
                        v-model="filter.userId"
                        name="filter-user"
                        class="xl:col-span-4 lg:col-span-4"
                        placeholder="Filter by User"
                        label="User (Network)"
                        :select-data="usersData?.data || []"
                        labelvalue="name"
                        keyvalue="id"
                        imgvalue="imageUrl"
                        secondlabelvalue="email"
                        thirdlabelvalue="country.name"
                    />

                    <div class="lg:col-span-12">
                        <div class="border border-slate-100 bg-slate-50/50 rounded-lg grid grid-cols-12 p-5 gap-5">
                            <div class="sm:col-span-12">
                                <label class="form-label opacity-75 font-light">Member Type</label>
                                <fieldset class="px-5 grid lg:grid-cols-3 sm:grid-cols-2 gap-5 grid-cols-1 duration-300 ease-in-out">
                                    <div v-for="option in membershipTypes" :key="option.value" class="relative flex items-start">
                                        <div class="flex items-center h-6">
                                            <input
                                                :id="'type-' + option.value"
                                                v-model="serverParams.networkFilter.type"
                                                :aria-describedby="option.value + '-description'"
                                                :name="option.value"
                                                :value="option.value"
                                                type="checkbox"
                                                class="focus:ring-primary h-5 w-5 rounded text-primary border-slate-500"
                                            />
                                        </div>
                                        <div class="ml-3 text-sm">
                                            <label :for="'type-' + option.value" :class="[serverParams.networkFilter.type.includes(option.value) ? ' font-medium opacity-75' : 'font-light']" class="font-light font-sm ease-in-out duration-150">
                                                {{ option.name }}
                                            </label>
                                        </div>
                                    </div>
                                </fieldset>
                            </div>
                        </div>
                    </div>

                    <div class="lg:col-span-12">
                        <div class="border border-slate-100 bg-slate-50/50 rounded-lg grid grid-cols-12 p-5 gap-5">
                            <div class="sm:col-span-12">
                                <label class="form-label opacity-75 font-light">Status</label>
                                <fieldset class="px-5 grid lg:grid-cols-3 sm:grid-cols-2 gap-5 grid-cols-1 duration-300 ease-in-out">
                                    <div v-for="option in membershipStatuses" :key="option.value" class="relative flex items-start">
                                        <div class="flex items-center h-6">
                                            <input
                                                :id="'status-' + option.value"
                                                v-model="serverParams.networkFilter.status"
                                                :aria-describedby="option.value + '-description'"
                                                :name="option.value"
                                                :value="option.value"
                                                type="checkbox"
                                                class="focus:ring-primary h-5 w-5 rounded text-primary border-slate-500"
                                            />
                                        </div>
                                        <div class="ml-3 text-sm">
                                            <label :for="'status-' + option.value" :class="[serverParams.networkFilter.status.includes(option.value) ? ' font-medium opacity-75' : 'font-light']" class="font-sm ease-in-out duration-150">
                                                {{ option.name }}
                                            </label>
                                        </div>
                                    </div>
                                </fieldset>
                            </div>
                        </div>
                    </div>

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
                        <th>Type</th>
                        <th v-if="!serverParams.deleted">Status</th>
                        <th v-if="serverParams.deleted">Deleted At</th>
                        <th v-if="!serverParams.deleted" class="text-right">Action</th>
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
                                        </div>
                                        <div class="flex items-center text-xs whitespace-nowrap">
                                            <NuxtImg :src="row.country?.imageUrl" class="h-4 !rounded-sm w-6 object-cover shrink-0 mr-1.5" />
                                            <div class="opacity-75 font-semibold">{{ row.country?.name }}</div>
                                            <span class="capitalize font-light opacity-80">, {{ row.city?.toLowerCase() }}</span>
                                        </div>
                                        <div class="hover:text-warning transition-colors cursor-pointer text-xs opacity-75 mt-0.5 lowercase" @click="useClipboard(row.email?.toLowerCase())">
                                            <span class="truncate 2xl:max-w-64 max-w-44">{{ row.email?.toLowerCase() }}</span>
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div>
                                    <div>
                                        <UiCompanyTypeBadge v-if="row.type_company" :data="row.type_company" />
                                        <span v-else>---</span>
                                    </div>
                                    <div class="mt-2 font-medium flex items-center gap-1">
                                        <icon name="solar:hashtag-bold-duotone" class="size-4 opacity-50" />
                                        <span class="text-sm opacity-75">#{{ row.id }}</span>
                                    </div>
                                </div>
                            </td>
                            <td v-if="!serverParams.deleted">
                                <div class="flex items-center gap-1.5">
                                    <UiNetworkTypeBadge :data="row.type" />
                                    <UiStatusBadge v-if="row.status !== 'approved'" :data="row.status" />
                                </div>
                            </td>
                            <td v-if="serverParams.deleted" class="text-sm">{{ row.deletedAt }}</td>
                            <td v-if="!serverParams.deleted" class="text-right">
                                <div class="flex items-center justify-end gap-2">
                                    <button class="btn btn-secondary btn-rounded btn-sm gap-3" @click="openEditModal(row.id)">
                                        <Icon name="solar:pen-outline" class="size-4" />
                                        Edit
                                    </button>
                                    <NuxtLink :to="'/members-data/members/' + row.id">
                                        <button class="btn btn-secondary btn-rounded btn-sm gap-3">
                                            <Icon name="solar:eye-outline" class="size-4" />
                                            View
                                        </button>
                                    </NuxtLink>
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

        <!-- Add/Edit Company Modal -->
        <TheModal :open-modal="networkModalOpen" size="4xl" @close-modal="closeModal">
            <template #header>
                <div class="flex justify-between items-center">
                    <div class="font-medium text-lg">{{ isEditMode ? 'Edit Company' : 'Add New Company' }}</div>
                    <Icon class="w-8 h-8 opacity-50 cursor-pointer hover:opacity-100 ease-in-out duration-300" name="solar:close-square-outline" @click="closeModal" />
                </div>
            </template>
            <template #content>
                <div v-if="formLoading" class="flex justify-center items-center py-20">
                    <Icon name="svg-spinners:3-dots-fade" class="w-12 h-12 text-primary" />
                </div>
                <div v-else-if="!selectedNetwork" class="flex justify-center items-center py-20 text-slate-400">No data available</div>
                <div v-else class="grid lg:grid-cols-12 gap-6">
                    <!-- Basic Information Section -->
                    <div class="lg:col-span-12">
                        <h4 class="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">Basic Information</h4>
                        <div class="grid lg:grid-cols-12 gap-5">
                            <FormInputField v-model="selectedNetwork.name" class="lg:col-span-6" label="Company Name *" placeholder="Enter company name" required />
                            <FormInputField v-model="selectedNetwork.company_email" class="lg:col-span-6" label="Company Email *" placeholder="Enter company email" type="email" required />
                            <FormInputField v-model="selectedNetwork.email" class="lg:col-span-6" label="Login Email *" placeholder="Enter login email" type="email" required />
                            <FormInputField v-model="selectedNetwork.unhashed_password" class="lg:col-span-6" label="Password" placeholder="Enter password" type="password" />
                        </div>
                    </div>

                    <!-- Location Information -->
                    <div class="lg:col-span-12">
                        <h4 class="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">Location Information</h4>
                        <div class="grid lg:grid-cols-12 gap-5">
                            <FormSelectField
                                id="add-network-country"
                                v-model="selectedNetwork.country_id"
                                name="add-network-country"
                                class="lg:col-span-6"
                                label="Country *"
                                placeholder="Select country"
                                :select-data="resources.countries"
                                labelvalue="name"
                                keyvalue="id"
                                imgvalue="imageUrl"
                                required
                            />
                            <FormInputField v-model="selectedNetwork.city" class="lg:col-span-6" label="City" placeholder="Enter city" />
                            <FormInputField v-model="selectedNetwork.address" class="lg:col-span-12" label="Address" placeholder="Enter address" />
                            <FormInputField v-model="selectedNetwork.phone" class="lg:col-span-6" label="Phone Number" placeholder="Enter phone number" />
                            <FormInputField v-model="selectedNetwork.website" class="lg:col-span-6" label="Website" placeholder="Enter website URL" />
                        </div>
                    </div>

                    <!-- Company Settings -->
                    <div class="lg:col-span-12">
                        <h4 class="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">Company Settings</h4>
                        <div class="grid lg:grid-cols-12 gap-5">
                            <FormSelectField
                                id="add-network-user"
                                v-model="selectedNetwork.user_id"
                                name="add-network-user"
                                class="lg:col-span-6"
                                label="Associated User (Network) *"
                                placeholder="Select user"
                                :select-data="usersData?.data || []"
                                labelvalue="name"
                                keyvalue="id"
                                imgvalue="imageUrl"
                                secondlabelvalue="email"
                                thirdlabelvalue="country.name"
                                required
                                :disabled="isEditMode"
                            />
                            <FormSelectField
                                id="add-network-type-company"
                                v-model="selectedNetwork.type_company"
                                name="add-network-type-company"
                                class="lg:col-span-6"
                                label="Company Type *"
                                placeholder="Select company type"
                                :select-data="[
                                    { name: 'Headquarters', value: 'hq' },
                                    { name: 'Branch', value: 'branch' },
                                ]"
                                labelvalue="name"
                                keyvalue="value"
                                required
                            />
                            <FormSelectField
                                id="add-network-type"
                                v-model="selectedNetwork.type"
                                name="add-network-type"
                                class="lg:col-span-4"
                                label="Member Type *"
                                placeholder="Select member type"
                                :select-data="[
                                    { name: 'Member', value: 'member' },
                                    { name: 'Founder', value: 'founder' },
                                    { name: 'Vendor', value: 'vendor' },
                                    { name: 'Partner', value: 'partner' },
                                ]"
                                labelvalue="name"
                                keyvalue="value"
                                required
                            />
                            <FormSelectField
                                id="add-network-status"
                                v-model="selectedNetwork.status"
                                name="add-network-status"
                                class="lg:col-span-4"
                                label="Status *"
                                placeholder="Select status"
                                :select-data="[
                                    { name: 'Pending', value: 'pending' },
                                    { name: 'Approved', value: 'approved' },
                                    { name: 'Suspended', value: 'suspended' },
                                    { name: 'Blacklisted', value: 'blacklisted' },
                                ]"
                                labelvalue="name"
                                keyvalue="value"
                                required
                            />
                            <FormSelectField
                                id="add-network-phone-key"
                                v-model="selectedNetwork.phone_key_id"
                                name="add-network-phone-key"
                                class="lg:col-span-4"
                                label="Phone Key"
                                placeholder="Select phone key"
                                :select-data="resources.countries"
                                labelvalue="name"
                                keyvalue="id"
                                imgvalue="imageUrl"
                            />
                            <FormUploader v-model="selectedNetwork.image" class="lg:col-span-12" :allowed-types="['image']" label="Image" name="image" />
                        </div>
                    </div>
                </div>
            </template>
            <template #footer>
                <div class="w-full flex items-center justify-end gap-5">
                    <button :disabled="formLoading" class="btn-rounded btn-sm btn btn-danger px-6 py-2.5" type="button" @click="closeModal">
                        <Icon :name="formLoading ? 'svg-spinners:3-dots-fade' : 'solar:close-circle-linear'" class="w-5 h-5 mr-2" />
                        <span>Cancel</span>
                    </button>
                    <button :disabled="formLoading || !selectedNetwork" class="btn-rounded btn-sm btn btn-primary px-6 py-2.5" type="button" @click="submitNetwork">
                        <Icon :name="formLoading ? 'svg-spinners:3-dots-fade' : 'solar:check-circle-broken'" class="w-5 h-5 mr-2" />
                        <span>{{ isEditMode ? 'Update Company' : 'Create Company' }}</span>
                    </button>
                </div>
            </template>
        </TheModal>

        <!-- Export By Category Modal -->
        <TheModal :open-modal="isOpen" size="md" @close-modal="closeModalExport">
            <template #header>
                <div class="flex justify-between items-center">
                    <div class="font-medium text-lg">Export By Category</div>
                    <Icon class="w-8 h-8 opacity-50 cursor-pointer hover:opacity-100 ease-in-out duration-300" name="solar:close-square-outline" @click="closeModalExport" />
                </div>
            </template>
            <template #content>
                <p class="text-sm text-slate-500 mb-6">Please choose the categories you want to download</p>
                <fieldset class="grid lg:grid-cols-3 sm:grid-cols-2 gap-6 grid-cols-1 duration-300 ease-in-out">
                    <div v-for="option in categoryTypes" :key="option.id" class="relative flex items-start">
                        <div class="flex items-center h-6">
                            <input
                                :id="option.id"
                                v-model="appliedCatTypes"
                                :checked="appliedCatTypes.includes(option.id)"
                                :aria-describedby="option.id + '-description'"
                                :name="option.id"
                                :value="option.id"
                                type="checkbox"
                                class="focus:ring-primary h-5 w-5 rounded text-primary border-slate-500"
                            />
                        </div>
                        <div class="ml-3 text-sm">
                            <label :for="option.id" class="font-sm ease-in-out duration-150">
                                {{ option.label }}
                            </label>
                        </div>
                    </div>
                </fieldset>
            </template>
            <template #footer>
                <div class="w-full flex items-center justify-end gap-5">
                    <button :disabled="formLoading" class="btn-rounded btn-sm btn btn-danger px-6 py-2.5" type="button" @click="closeModalExport">
                        <Icon :name="formLoading ? 'svg-spinners:3-dots-fade' : 'solar:close-circle-linear'" class="w-5 h-5 mr-2" />
                        <span>Close</span>
                    </button>
                    <button :disabled="formLoading" class="btn-rounded btn-sm btn btn-primary px-6 py-2.5" type="button" @click="initDownloadByType()">
                        <Icon :name="formLoading ? 'svg-spinners:3-dots-fade' : 'solar:download-outline'" class="w-5 h-5 mr-2" />
                        <span>Download</span>
                    </button>
                </div>
            </template>
        </TheModal>
    </div>
</template>
