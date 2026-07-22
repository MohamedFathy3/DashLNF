<script setup>
import * as XLSX from 'xlsx';
import FileSaver from 'file-saver';

definePageMeta({
    middleware: 'auth',
});

const selectedRows = ref([]);
const sortByList = ref([
    { name: 'Sort By ID', value: 'id' },
    { name: 'Sort By Name', value: 'name' },
]);

const filter = ref({
    name: null,
    email: null,
    companyName: null,
    job_title: null,
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

const formLoading = ref(false);
const isOpen = ref(false);
const selectedId = ref(null);
const isEditMode = ref(false);
const showFilter = ref(false);

const resources = useResourceStore();

const resetServerParams = async () => {
    filter.value = {
        name: null,
        email: null,
        companyName: null,
        job_title: null,
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
} = await useApiFetch('/api/contact-person-network/index', {
    method: 'POST',
    body: serverParams,
    lazy: true,
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

async function closeModal() {
    isOpen.value = false;
    selectedId.value = null;
    isEditMode.value = false;
}

async function openAddModal() {
    isEditMode.value = false;
    selectedId.value = null;
    isOpen.value = true;
}

async function openEditModal(id) {
    isEditMode.value = true;
    selectedId.value = id;
    isOpen.value = true;
}

async function deleteItems() {
    const confirmed = confirm('Are you sure you want to delete this item?');
    if (confirmed) {
        const { data, error } = await useApiFetch(`/api/contact-person-network/delete`, {
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
        const { data, error } = await useApiFetch(`/api/contact-person-network/force-delete`, {
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
        const { data, error } = await useApiFetch(`/api/contact-person-network/restore`, {
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

// Statistics
const contactPersonInfoBoxes = computed(() => {
    if (!rows.value?.data || rows.value.data.length === 0) {
        return [
            { title: 'Total Persons', icon: 'solar:users-group-two-rounded-outline', value: 0, description: 'Contact Persons' },
            { title: 'Active', icon: 'solar:check-circle-line-duotone', value: 0, description: 'Active' },
            { title: 'Deleted', icon: 'solar:trash-bin-minimalistic-line-duotone', value: 0, description: 'Deleted' },
        ];
    }

    const data = rows.value.data;
    const total = data.length;
    const active = data.filter((p) => p.deleted === false).length;
    const deleted = data.filter((p) => p.deleted === true).length;

    return [
        { title: 'Total Persons', icon: 'solar:users-group-two-rounded-outline', value: total, description: 'Contact Persons' },
        { title: 'Active', icon: 'solar:check-circle-line-duotone', value: active, description: 'Active' },
        { title: 'Deleted', icon: 'solar:trash-bin-minimalistic-line-duotone', value: deleted, description: 'Deleted' },
    ];
});

// Export function
const onExport = async () => {
    const exportServerParams = { ...serverParams.value };
    exportServerParams.perPage = rows.value?.meta?.total || 25;
    const { data: exportData, error: errorExport } = await useApiFetch('/api/contact-person-network/index', {
        method: 'POST',
        body: exportServerParams,
    });
    if (exportData.value) {
        const worksheet = XLSX.utils.json_to_sheet(exportData.value.data);
        const workbook = XLSX.utils.book_new();
        const fileName = `ContactPersons_${new Date().toLocaleDateString()}_${new Date().getHours()}_${new Date().getMinutes()}.xlsx`;
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
        const data = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        FileSaver.saveAs(blob, fileName);
    }
    if (errorExport.value) {
        console.error('Error exporting data:', errorExport.value);
    }
};
</script>

<template>
    <div class="flex flex-col gap-8">
        <!-- Page Title & Action Buttons -->
        <div class="md:flex md:items-center md:justify-between md:gap-5">
            <div class="flex items-center gap-2">
                <Icon name="solar:users-group-two-rounded-line-duotone" class="size-5 opacity-75" />
                <div>{{ serverParams.deleted ? 'Deleted Contact Persons' : 'Contact Persons (Network)' }}</div>
            </div>
            <div class="md:flex md:items-center md:gap-5 md:space-y-0 space-y-5">
                <button class="btn btn-primary btn-rounded px-6 btn-sm gap-3 md:w-fit w-full md:mt-0 mt-5" type="button" @click="openAddModal">
                    <Icon name="solar:add-square-linear" class="size-5 opacity-75" />
                    Add New
                </button>

                <button class="btn btn-dark btn-rounded px-6 btn-sm gap-3 md:w-fit w-full md:mt-0 mt-5" type="button" @click="onExport">
                    <Icon name="solar:download-outline" class="size-5 opacity-75" />
                    Export XLSX
                </button>

                <template v-if="selectedRows.length > 0">
                    <template v-if="serverParams.deleted">
                        <button class="btn btn-danger btn-rounded px-6 btn-sm gap-3 md:w-fit w-full md:mt-0 mt-5" @click="forceDeleteItems">
                            <Icon name="solar:trash-bin-minimalistic-line-duotone" class="size-5 opacity-75" />
                            Delete Permanently
                        </button>
                    </template>
                    <template v-else>
                        <button class="btn btn-danger btn-rounded px-6 btn-sm gap-3 md:w-fit w-full md:mt-0 mt-5" @click="deleteItems">
                            <Icon name="solar:trash-bin-minimalistic-line-duotone" class="size-5 opacity-75" />
                            Delete Items
                        </button>
                    </template>
                    <template v-if="serverParams.deleted">
                        <button class="btn btn-success btn-rounded px-6 btn-sm gap-3 md:w-fit w-full md:mt-0 mt-5" @click="restoreItems">
                            <Icon name="solar:restart-circle-outline" class="size-5 opacity-75" />
                            Restore Items
                        </button>
                    </template>
                </template>
                <button class="btn btn-primary btn-rounded px-6 btn-sm gap-3 md:w-fit w-full md:mt-0 mt-5" @click="toggleDeleted">
                    <Icon :name="serverParams.deleted ? 'solar:hamburger-menu-line-duotone' : 'solar:trash-bin-minimalistic-line-duotone'" class="size-5 opacity-75" />
                    {{ serverParams.deleted ? 'Active List' : 'Deleted Items' }}
                </button>
            </div>
        </div>

        <!-- Statistics -->
        <UiInfoBox :data="contactPersonInfoBoxes" />

        <!-- Filter & Search -->
        <div class="grid lg:grid-cols-12 gap-5 items-center p-5 bg-white border rounded-2xl">
            <FormInputField v-model="filter.name" rounded class="xl:col-span-3 lg:col-span-3" placeholder="Name" label="Name" />
            <FormInputField v-model="filter.email" rounded class="xl:col-span-3 lg:col-span-3" placeholder="Email" label="Email" />
            <FormInputField v-model="filter.companyName" rounded class="xl:col-span-3 lg:col-span-3" placeholder="Company Name" label="Company" />
            <FormInputField v-model="filter.job_title" rounded class="xl:col-span-3 lg:col-span-3" placeholder="Job Title" label="Job Title" />

            <TransitionExpand>
                <div v-if="showFilter" class="lg:col-span-12 grid lg:grid-cols-12 gap-5 items-center">
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

            <button class="xl:col-span-4 lg:col-span-4 btn btn-rounded btn-sm btn-primary gap-3 w-full" @click="refresh">
                <Icon name="solar:rounded-magnifer-line-duotone" class="size-5 shrink-0" />
                Filter
            </button>
            <button class="xl:col-span-4 lg:col-span-4 btn btn-rounded btn-sm btn-secondary gap-3 w-full" @click="resetServerParams">
                <Icon name="solar:restart-circle-outline" class="size-5 shrink-0" />
                Reset
            </button>
            <button class="xl:col-span-4 lg:col-span-4 btn btn-rounded btn-sm btn-secondary gap-3 w-full" @click="showFilter = !showFilter">
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
                        <th>Name / Contact</th>
                        <th>Company</th>
                        <th>Details</th>
                        <th v-if="serverParams.deleted">Deleted At</th>
                        <th class="text-right">Action</th>
                    </tr>
                </thead>
                <tbody>
                    <template v-if="status !== 'pending' && rows">
                        <tr v-for="row in rows.data" :key="row.id" class="text-sm hover:bg-slate-50 transition-colors">
                            <td>
                                <input :checked="isSelected(row.id)" type="checkbox" class="form-check-input" @change="toggleRowSelection(row.id)" />
                            </td>
                            <td class="font-normal">
                                <div class="flex items-center gap-3">
                                    <NuxtImg :src="row.imageUrl || '/default-avatar.png'" :alt="row.name" :title="row.name" class="w-10 h-10 !rounded-full object-cover ring-2 ring-slate-100 shrink-0" />
                                    <div>
                                        <div class="font-medium text-sm">{{ row.name }}</div>
                                        <div class="font-light text-xs opacity-75 truncate max-w-[15rem]">{{ row.job_title }}</div>
                                        <div class="flex items-center gap-1 mt-0.5">
                                            <span class="text-[10px] bg-primary/5 text-primary px-1.5 py-0.5 rounded-full">{{ row.title || 'N/A' }}</span>
                                            <span v-if="row.birth_date" class="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-full">🎂 {{ row.birth_date }}</span>
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td class="text-sm font-normal whitespace-nowrap">
                                <div class="flex flex-col gap-0.5">
                                    <div class="flex items-center gap-1.5">
                                        <span class="truncate 2xl:max-w-64 max-w-44 font-medium">{{ row.member_network?.name || 'N/A' }}</span>
                                    </div>
                                    <div class="flex items-center text-xs">
                                        <span class="opacity-50">ID: #{{ row.member_network_id }}</span>
                                        <span v-if="row.member_network?.status" class="ml-2">
                                            <UiStatusBadge :data="row.member_network.status" size="sm" />
                                        </span>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div class="text-xs space-y-1">
                                    <div class="hover:text-warning transition-colors cursor-pointer flex items-center gap-1" @click="useClipboard(row.email?.toLowerCase())">
                                        <Icon name="solar:letter-outline" class="size-3" />
                                        <span class="truncate max-w-[120px]">{{ row.email?.toLowerCase() }}</span>
                                    </div>
                                    <div v-if="row.phone" class="opacity-75 flex items-center gap-1">
                                        <Icon name="solar:phone-outline" class="size-3" />
                                        <span>{{ row.phone }}</span>
                                    </div>
                                    <div v-if="row.cell_number" class="opacity-75 flex items-center gap-1">
                                        <Icon name="solar:phone-outline" class="size-3" />
                                        <span>{{ row.cell_number }}</span>
                                    </div>
                                    <div v-if="row.phoneKeyId" class="text-[10px] opacity-50">Key ID: {{ row.phoneKeyId }}</div>
                                </div>
                            </td>
                            <td v-if="serverParams.deleted" class="text-sm">{{ row.deletedAt }}</td>
                            <td class="text-right">
                                <div class="flex items-center justify-end gap-2">
                                    <button class="btn btn-secondary btn-rounded btn-sm gap-2" @click="openEditModal(row.id)">
                                        <Icon name="solar:pen-new-round-outline" class="size-3.5" />
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
                    <template v-if="status !== 'pending' && rows && rows.data.length === 0">
                        <tr>
                            <td colspan="6">
                                <div class="text-center py-10">
                                    <Icon name="solar:users-group-two-rounded-line-duotone" class="size-12 mx-auto opacity-30" />
                                    <div class="text-sm mt-3 opacity-50">No contact persons found</div>
                                </div>
                            </td>
                        </tr>
                    </template>
                </tbody>
            </table>
        </div>

        <!-- Pagination -->
        <TablePagination :pending="status === 'pending'" :rows="rows" :page="serverParams.page" @change-page="changePage" />

        <!-- Add/Edit Modal -->
        <MemberContactPersonModal v-if="isOpen" :open="isOpen" :person-id="selectedId" :edit-mode="isEditMode" :member-id="selectedId ? null : null" @close="closeModal" @refresh="refresh" />
    </div>
</template>
