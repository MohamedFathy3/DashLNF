<script setup>
definePageMeta({
    middleware: ['auth', 'permission'],
    permissions: ['show-website-data-messages'],
});

// ========== Permissions ==========
const pageSlug = 'website-data-messages';
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
    { name: 'Sort By Date', value: 'created_at' },
]);
const filter = ref({
    name: null,
});

const serverParams = ref({
    filters: {},
    orderBy: 'created_at',
    orderByDirection: 'desc',
    perPage: 25,
    page: 1,
    paginate: true,
    deleted: false,
});
const formLoading = ref(false);
const isOpen = ref(false);

const resetServerParams = async () => {
    filter.value = {
        name: null,
    };
    serverParams.value = {
        filters: {},
        orderBy: 'created_at',
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
    pending,
    refresh,
} = await useApiFetch('/api/contactus/index', {
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

const item = ref();

const fetchItem = async (id) => {
    const { data, error } = await useApiFetch(`/api/contactus/${id}`, {
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
    item.value = null;
};

async function closeModal() {
    isOpen.value = false;
    await resetItemValues();
}

async function openModal(id) {
    formLoading.value = true;
    await fetchItem(id);
    formLoading.value = false;
    isOpen.value = true;
}

async function deleteItems() {
    const confirmed = confirm('Are you sure you want to delete the selected messages?');
    if (confirmed) {
        const { data, error } = await useApiFetch(`/api/contactus/delete`, {
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
    const confirmed = confirm('Are you sure you want to permanently delete the selected messages?');
    if (confirmed) {
        const { data, error } = await useApiFetch(`/api/contactus/force-delete`, {
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
    const confirmed = confirm('Are you sure you want to restore the selected messages?');
    if (confirmed) {
        const { data, error } = await useApiFetch(`/api/contactus/restore`, {
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
                <Icon name="solar:chat-line-line-duotone" class="size-5 opacity-75" />
                <div>{{ serverParams.deleted ? 'Deleted Messages' : 'Contact Messages' }}</div>
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
                        <th class="text-center">Network</th>
                        <th class="text-center">Date</th>
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
                                    <div class="mt-1">
                                        <span class="lowercase py-1 whitespace-nowrap px-3 text-xs bg-slate-200 rounded-full">{{ row.email }}</span>
                                    </div>
                                </div>
                            </td>
                            <td class="text-center">
                                {{ row.network?.name || '—' }}
                            </td>
                            <td>
                                <div>
                                    <div class="font-medium text-slate-800">{{ row.sentSince }}</div>
                                    <div class="mt-1">
                                        <span class="lowercase py-1 whitespace-nowrap px-3 text-xs bg-slate-200 rounded-full">{{ row.createdAt }}</span>
                                    </div>
                                </div>
                            </td>
                            <td v-if="serverParams.deleted" class="text-center text-sm">{{ row.deletedAt }}</td>
                            <td class="text-right">
                                <button v-if="canUpdate" class="btn btn-secondary btn-rounded btn-sm gap-2" @click="openModal(row.id)">
                                    <Icon name="solar:eye-outline" class="size-4" />
                                    View
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
                    <tr v-if="!pending && rows?.data?.length === 0">
                        <td colspan="6" class="p-8 text-center text-sm text-slate-500">No messages found.</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Pagination -->
        <TablePagination :pending="pending" :rows="rows" :page="serverParams.page" @change-page="changePage" />

        <!-- View Modal -->
        <TheModal :open-modal="isOpen" size="5xl" @close-modal="closeModal()">
            <template #header>
                <div class="flex justify-between items-center">
                    <div>
                        <div class="text-lg font-semibold text-slate-800">View Message</div>
                        <div class="text-xs text-slate-500">Message details from {{ item?.name }}</div>
                    </div>
                    <Icon class="w-8 h-8 opacity-50 cursor-pointer hover:opacity-100 ease-in-out duration-300" name="solar:close-square-outline" @click="closeModal" />
                </div>
            </template>
            <template #content>
                <dl>
                    <div class="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 odd:bg-slate-100">
                        <dt class="text-sm font-light opacity-75">Name</dt>
                        <dd class="mt-1 text-sm sm:mt-0 sm:col-span-2">
                            <div class="flex items-center">
                                <Icon name="solar:user-circle-line-duotone" class="size-5 text-slate-500 mr-2" />
                                <div>{{ item?.name }}</div>
                            </div>
                        </dd>
                    </div>
                    <div class="bg-white px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 odd:bg-slate-100">
                        <dt class="text-sm font-light opacity-75">Email</dt>
                        <dd class="mt-1 text-sm sm:mt-0 sm:col-span-2">
                            <div class="flex items-center">
                                <Icon name="solar:letter-linear" class="size-5 text-slate-500 mr-2" />
                                <div>{{ item?.email }}</div>
                            </div>
                        </dd>
                    </div>
                    <div class="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 odd:bg-slate-100">
                        <dt class="text-sm font-light opacity-75">Phone</dt>
                        <dd class="mt-1 text-sm sm:mt-0 sm:col-span-2">
                            <div class="flex items-center">
                                <Icon name="solar:phone-calling-linear" class="size-5 text-slate-500 mr-2" />
                                <div>{{ item?.phone }}</div>
                            </div>
                        </dd>
                    </div>
                    <div class="bg-white px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 odd:bg-slate-100">
                        <dt class="text-sm font-light opacity-75">Address</dt>
                        <dd class="mt-1 text-sm sm:mt-0 sm:col-span-2">
                            <div class="flex items-center">
                                <Icon name="solar:streets-map-point-linear" class="size-5 text-slate-500 mr-2" />
                                <div>{{ item?.address }}</div>
                            </div>
                        </dd>
                    </div>
                    <div class="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 odd:bg-slate-100">
                        <dt class="text-sm font-light opacity-75">Network</dt>
                        <dd class="mt-1 text-sm sm:mt-0 sm:col-span-2">
                            <div class="flex items-center">
                                <Icon name="solar:buildings-2-linear" class="size-5 text-slate-500 mr-2" />
                                <div>{{ item?.network?.name || '—' }}</div>
                            </div>
                        </dd>
                    </div>
                    <div class="bg-white px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 odd:bg-slate-100">
                        <dt class="text-sm font-light opacity-75">Subject</dt>
                        <dd class="mt-1 text-sm sm:mt-0 sm:col-span-2">
                            <div class="flex items-center">
                                <Icon name="solar:document-text-linear" class="size-5 text-slate-500 mr-2" />
                                <div>{{ item?.subject || '—' }}</div>
                            </div>
                        </dd>
                    </div>
                    <div class="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 odd:bg-slate-100">
                        <dt class="text-sm font-light opacity-75">Message</dt>
                        <dd class="mt-1 text-sm sm:mt-0 sm:col-span-2">
                            <div class="p-3 bg-slate-50 rounded-lg border">
                                {{ item?.message || '—' }}
                            </div>
                        </dd>
                    </div>
                    <div class="bg-white px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 odd:bg-slate-100">
                        <dt class="text-sm font-light opacity-75">Submitting Date</dt>
                        <dd class="mt-1 text-sm sm:mt-0 sm:col-span-2">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center">
                                    <Icon name="solar:calendar-line-duotone" class="size-5 text-slate-500 mr-2" />
                                    {{ item?.createdAt }}
                                </div>
                                <div class="flex items-center">
                                    <Icon name="solar:watch-round-line-duotone" class="size-5 text-slate-500 mr-2" />
                                    {{ item?.sentSince }}
                                </div>
                            </div>
                        </dd>
                    </div>
                </dl>
            </template>
            <template #footer>
                <div class="w-full flex items-center justify-end gap-5">
                    <button :disabled="formLoading" class="btn-rounded btn-sm btn btn-danger px-4" type="button" @click="closeModal">
                        <Icon :name="formLoading ? 'svg-spinners:3-dots-fade' : 'solar:close-circle-linear'" class="w-5 h-5 mr-2" />
                        <span>Close</span>
                    </button>
                </div>
            </template>
        </TheModal>
    </div>
</template>
