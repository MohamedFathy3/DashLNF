<script setup>
definePageMeta({
    middleware: 'auth',
});
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

const item = ref();

const fetchItem = async (id) => {
    const { data, error } = await useApiFetch(`/api/contactus/${id}`, {
        lazy: true,
    });
    if (data.value) {
        item.value = data.value.data;
    }
    if (error.value) {
        useToast({ title: 'Error', message: data.value.message, type: 'error', duration: 5000 });
    }
};
const resetItemValues = async () => {
    item.value = {
        title: null,
        code: null,
        des: null,
        active: true,
        orderId: null,
        image: null,
    };
};
async function closeModal() {
    isOpen.value = false;
    v$.value.$reset();
    await resetItemValues();
}
async function openModal(id = null) {
    formLoading.value = true;
    await fetchItem(id);
    formLoading.value = false;
    isOpen.value = true;
}

async function deleteItems() {
    const confirmed = confirm('Are you sure you want to delete this item?');
    if (confirmed) {
        const { data, error } = await useApiFetch(`/api/contactus/delete`, {
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
</script>
<template>
    <div class="flex flex-col gap-8">
        <!-- Page Title & Action Buttons -->
        <div class="md:flex md:items-center md:justify-between md:gap-5">
            <div class="flex items-center gap-2">
                <Icon name="solar:asteroid-linear" class="size-5 opacity-75" />
                <div>Contact Messages</div>
            </div>
            <div class="md:flex md:items-center md:gap-5 md:space-y-0 space-y-5">
                <template v-if="selectedRows.length > 0">
                    <button class="btn btn-danger btn-rounded px-6 btn-sm gap-3 md:w-fit w-full md:mt-0 mt-5" @click="deleteItems">
                        <Icon name="solar:trash-bin-minimalistic-line-duotone" class="size-5 opacity-75" />
                        Delete Items Permanently
                    </button>
                </template>
            </div>
        </div>
        <!-- Filter & Search -->
        <div class="grid lg:grid-cols-12 gap-5 items-center p-5 bg-white border rounded-2xl">
            <FormInputField v-model="filter.name" rounded class="xl:col-span-4 lg:col-span-4" placeholder="Name" />
            <FormSelectField v-model="serverParams.orderBy" :clearable="false" class="xl:col-span-4 lg:col-span-4" labelvalue="name" keyvalue="value" placeholder="Sort Direction" :select-data="sortByList" />
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
                    <th class="text-center">Network</th>
                    <th class="text-center">Date</th>
                    <th class="text-right">Action</th>
                </tr>
            </thead>
            <tbody>
                <template v-if="!pending && rows">
                    <tr v-for="row in rows.data" :key="row.id" class="text-sm">
                        <td>
                            <input :checked="isSelected(row.id)" type="checkbox" class="form-check-input" @change="toggleRowSelection(row.id)" />
                        </td>
                        <td>
                            <div>
                                <div class="opacity-75 font-medium">{{ row.name }}</div>
                                <div class="mt-1">
                                    <span class="lowercase py-1 whitespace-nowrap px-3 text-xs bg-slate-200 rounded-full">{{ row.email }}</span>
                                </div>
                            </div>
                        </td>
                        <td class="text-center">
                            {{ row.network?.name }}
                        </td>
                        <td>
                            <div>
                                <div class="opacity-75 font-medium">{{ row.sentSince }}</div>
                                <div class="mt-1">
                                    <span class="lowercase py-1 whitespace-nowrap px-3 text-xs bg-slate-200 rounded-full">{{ row.createdAt }}</span>
                                </div>
                            </div>
                        </td>
                        <td class="text-right">
                            <div>
                                <button :disabled="serverParams.deleted" class="btn btn-secondary btn-rounded btn-sm gap-3" @click="openModal(row.id)">
                                    <Icon name="solar:pen-new-round-outline" class="size-4" />
                                    View
                                </button>
                            </div>
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
                <template v-if="!pending && rows && rows.data.length === 0">
                    <tr>
                        <td colspan="7">
                            <div class="text-center">
                                <Icon name="solar:cloud-check-line-duotone" class="size-20 opacity-50" />
                                <div class="text-sm mt-5 opacity-75">No Data found</div>
                            </div>
                        </td>
                    </tr>
                </template>
            </tbody>
        </table>
        <!-- Pagination -->
        <TablePagination :pending="pending" :rows="rows" :page="serverParams.page" @change-page="changePage" />

        <TheModal :open-modal="isOpen" size="5xl" @close-modal="closeModal()">
            <template #header>
                <div class="flex justify-between items-center">
                    <div class="font-medium" v-html="'View Message'"></div>
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
                                <Icon name="solar:streets-navigation-linear" class="size-5 text-slate-500 mr-2" />
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
                    <div class="bg-white px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 odd:bg-slate-100">
                        <dt class="text-sm font-light opacity-75">Subject</dt>
                        <dd class="mt-1 text-sm sm:mt-0 sm:col-span-2">
                            <div class="flex items-center">
                                <div>{{ item?.subject }}</div>
                            </div>
                        </dd>
                    </div>
                    <div class="bg-white px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 odd:bg-slate-100">
                        <dt class="text-sm font-light opacity-75">Message</dt>
                        <dd class="mt-1 text-sm sm:mt-0 sm:col-span-2">
                            {{ item?.message }}
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
