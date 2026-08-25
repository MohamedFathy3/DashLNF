<script setup>
definePageMeta({
    middleware: ['auth', 'permission'],
    permissions: ['list-member'],
});
const selectedRows = ref([]);
const sortByList = ref([
    { name: 'Sort By Name', value: 'name' },
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
    networkFilter: {
        status: ['pending'],
        type: [],
        networkIds: [],
    },
    orderBy: 'created_at',
    orderByDirection: 'desc',
    perPage: 10,
    page: 1,
    paginate: true,
    deleted: false,
});
const resources = useResourceStore();
const formLoading = ref(false);
const isOpen = ref(false);

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
        networkFilter: {
            status: ['pending'],
            type: [],
            networkIds: [],
        },
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
async function closeModal() {
    isOpen.value = false;
}
async function openModal() {
    formLoading.value = true;
    isOpen.value = true;
    formLoading.value = false;
}
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
    const confirmed = confirm('Are you sure you want to delete this item?');
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
    const confirmed = confirm('Are you sure you want to delete this item?');
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

const networkInfoBoxes = ref([]);
const { data: networkStatistics, execute: fetchNetworkStatistics } = await useApiFetch('/api/dashboard/network/user-statistic', {
    immediate: false,
    lazy: true,
});
async function prepareInfoBoxes() {
    await fetchNetworkStatistics();
    networkInfoBoxes.value = [
        {
            title: 'Approved',
            icon: 'solar:users-group-two-rounded-outline',
            value: networkStatistics.value.totalApproved,
            description: 'Members',
        },
        {
            title: 'Countries',
            icon: 'solar:earth-outline',
            value: networkStatistics.value.totalCountriesWithMembers,
            description: 'With Members',
        },
        {
            title: 'Suspended',
            icon: 'solar:user-minus-rounded-line-duotone',
            value: networkStatistics.value.totalSuspended,
            description: 'Members',
        },
        {
            title: 'Blacklisted',
            icon: 'solar:user-cross-rounded-line-duotone',
            value: networkStatistics.value.totalBlacklisted,
            description: 'Members',
        },
    ];
}

onMounted(() => {
    prepareInfoBoxes();
});
const viewMember = async (value) => {
    console.log(value);
    navigateTo('/members-data/members/' + value);
};
</script>
<template>
    <div v-if="useCheckPermission(['network_application_list'])" class="flex flex-col gap-8">
        <!-- Page Title & Action Buttons -->
        <div class="md:flex md:items-center md:justify-between md:gap-5">
            <div class="flex items-center gap-2">
                <Icon name="solar:clipboard-text-outline" class="size-5 opacity-75" />
                <div>{{ serverParams.deleted ? 'Deleted Members' : 'Members' }}</div>
            </div>
            <div class="md:flex md:items-center md:gap-5 md:space-y-0 space-y-5">
                <template v-if="selectedRows.length > 0">
                    <template v-if="serverParams.deleted">
                        <button v-if="useCheckPermission(['network_application_force_delete'])" class="btn btn-danger btn-rounded px-6 btn-sm gap-3 md:w-fit w-full md:mt-0 mt-5" @click="forceDeleteItems">
                            <Icon name="solar:trash-bin-minimalistic-line-duotone" class="size-5 opacity-75" />
                            Delete Permanently
                        </button>
                    </template>
                    <template v-else>
                        <button v-if="useCheckPermission(['network_application_delete'])" class="btn btn-danger btn-rounded px-6 btn-sm gap-3 md:w-fit w-full md:mt-0 mt-5" @click="deleteItems">
                            <Icon name="solar:trash-bin-minimalistic-line-duotone" class="size-5 opacity-75" />
                            Delete Items
                        </button>
                    </template>
                    <template v-if="serverParams.deleted">
                        <button v-if="useCheckPermission(['network_application_restore'])" class="btn btn-success btn-rounded px-6 btn-sm gap-3 md:w-fit w-full md:mt-0 mt-5" @click="restoreItems">
                            <Icon name="solar:restart-circle-outline" class="size-5 opacity-75" />
                            Restore Items
                        </button>
                    </template>
                </template>
                <button v-if="useCheckPermission(['network_application_create'])" :disabled="serverParams.deleted" class="btn btn-primary btn-rounded px-6 btn-sm gap-3 md:w-fit w-full md:mt-0 mt-5" @click="openModal()">
                    <Icon name="solar:add-square-linear" class="size-5 opacity-75" />
                    Add New
                </button>
                <button
                    v-if="useCheckPermission(['network_application_delete', 'network_application_force_delete', 'network_application_restore'])"
                    class="btn btn-primary btn-rounded px-6 btn-sm gap-3 md:w-fit w-full md:mt-0 mt-5"
                    @click="toggleDeleted"
                >
                    <Icon :name="serverParams.deleted ? 'solar:hamburger-menu-line-duotone' : 'solar:trash-bin-minimalistic-line-duotone'" class="size-5 opacity-75" />
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
                <Icon name="solar:rounded-magnifer-line-duotone" class="size-5 shrink-0" />
                Filter
            </button>
            <button class="xl:col-span-6 lg:col-span-6 btn btn-rounded btn-sm btn-secondary gap-3 w-full" @click="resetServerParams">
                <Icon name="solar:restart-circle-outline" class="size-5 shrink-0" />
                Reset
            </button>
        </div>
        <!-- Table -->
        <div>
            <table class="table table-report font-light">
                <thead>
                    <tr class="uppercase text-sm">
                        <th class="text-left">
                            <input v-model="allSelected" type="checkbox" class="form-check-input" @change="selectAllRows" />
                        </th>
                        <th>Name</th>
                        <th>Details</th>
                        <th v-if="serverParams.deleted">Deleted At</th>
                        <th v-if="!serverParams.deleted" class="text-right">Action</th>
                    </tr>
                </thead>
                <tbody>
                    <template v-if="status !== 'pending' && rows">
                        <tr v-for="row in rows.data" :key="row.id" class="text-sm">
                            <td>
                                <input :checked="isSelected(row.id)" type="checkbox" class="form-check-input" @change="toggleRowSelection(row.id)" />
                            </td>
                            <td class="text-sm font-normal whitespace-nowrap">
                                <div class="flex items-center gap-3">
                                    <NuxtImg :src="row.imageUrl" class="h-14 !rounded-md w-24 object-contain p-1 shrink-0" />
                                    <div class="flex flex-col gap-0.5">
                                        <div class="flex items-center gap-1.5">
                                            <span class="truncate 2xl:max-w-64 max-w-44">{{ row.name }}</span>
                                            <Icon v-if="row.currentNetworkStatus?.fpp" name="solar:shield-star-bold" class="size-5 text-success" />
                                        </div>
                                        <div class="flex items-center text-xs whitespace-nowrap">
                                            <NuxtImg :src="row.country.imageUrl" class="h-4 !rounded-sm w-6 object-cover shrink-0 mr-1.5" />
                                            <div class="opacity-75 font-semibold">{{ row.country.name }}</div>
                                            <span class="capitalize font-light opacity-80 w-20 overflow-hidden">, {{ row.city?.toLowerCase() }}</span>
                                        </div>
                                        <div class="hover:text-warning transition-colors cursor-pointer text-xs opacity-75 mt-0.5 lowercase" @click="useClipboard(row.email.toLowerCase())">
                                            <span class="truncate 2xl:max-w-64 max-w-44">{{ row.email.toLowerCase() }}</span>
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div class="whitespace-nowrap">
                                    <template v-for="application in row.pendingNetworkStatus" :key="application.id">
                                        <div class="flex items-center text-xs opacity-75">
                                            <Icon name="solar:calendar-linear" class="size-4 mr-2" />
                                            <span class="font-semibold mr-2">{{ application.name }}</span>
                                            <span>{{ application.createdAtFormatted }}</span>
                                            <span class="font-semibold ml-1.5">- {{ application.createdSince }}</span>
                                        </div>
                                    </template>
                                </div>
                            </td>
                            <td v-if="serverParams.deleted" class="text-sm">{{ row.deletedAt }}</td>
                            <td v-if="!serverParams.deleted" class="text-right">
                                <div>
                                    <NuxtLink :to="'/members-data/members/' + row.id">
                                        <button :disabled="serverParams.deleted" class="btn btn-secondary btn-rounded btn-sm gap-3">
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
                            <td colspan="5">
                                <div class="h-12 !opacity-50 animate-pulse" />
                            </td>
                        </tr>
                    </template>
                </tbody>
            </table>
        </div>
        <!-- Pagination -->
        <TablePagination :pending="status === 'pending'" :rows="rows" :page="serverParams.page" @change-page="changePage" />
        <MemberAddModal v-if="isOpen" :open="isOpen" @close="closeModal" @success="viewMember" />
    </div>
</template>
