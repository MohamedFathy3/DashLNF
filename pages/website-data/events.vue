<script setup>
import { required, numeric } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';

definePageMeta({
    middleware: 'auth',
});
const selectedRows = ref([]);
const sortByList = ref([
    { name: 'Sort By ID', value: 'id' },
    { name: 'Sort By Title', value: 'title' },
    { name: 'Sort By Date', value: 'start_date' },
]);
const filter = ref({
    title: null,
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
        title: null,
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
} = await useApiFetch('/api/event/index', {
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
const item = ref({
    id: null,
    title: null,
    venue: null,
    slug: null, // Auto Generated
    type: null,
    des: null,
    shortDes: null,
    urlText: null,
    urlPath: null,
    country: null, // ID from Countries
    startDate: null, // Dates
    endDate: null, // Dates
    delegates: null, // Number
    sessions: null, // Number
    companies: null, // Number
    countries: null, // Number
    featured: false,
    active: true,
    orderId: null, // Number
    countryId: null,
    city: null, // ID from Cities
    duration: null, // number
    image: null, // Image ID
    gallery: [], // Image ID
});
const rules = ref({
    title: { required },
    venue: { required },
    type: { required },
    des: {},
    shortDes: {},
    urlText: {},
    urlPath: {},
    startDate: { required },
    endDate: { required },
    delegates: { numeric },
    sessions: { numeric },
    companies: { numeric },
    countries: { numeric },
    featured: { numeric },
    active: {},
    orderId: { numeric },
    countryId: { required },
    city: { required },
    duration: { numeric },
    image: {},
    gallery: {},
});
const v$ = useVuelidate(rules, item);
const fetchItem = async (id) => {
    const { data, error } = await useApiFetch(`/api/event/${id}`, {
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
        id: null,
        title: null,
        venue: null,
        slug: null,
        type: null,
        des: null,
        shortDes: null,
        urlText: null,
        urlPath: null,
        country: null,
        startDate: null,
        endDate: null,
        delegates: null,
        sessions: null,
        companies: null,
        countries: null,
        featured: false,
        active: true,
        orderId: null,
        countryId: null,
        city: null,
        duration: null,
        image: null,
        gallery: [],
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
    const { data, error } = await useApiFetch(`/api/event/${item.value?.id}`, {
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
        useToast({ title: 'Error', message: data.value.message, type: 'error', duration: 5000 });
    }
}

async function addItem() {
    const { data, error } = await useApiFetch(`/api/event`, {
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
        useToast({ title: 'Error', message: data.value.message, type: 'error', duration: 5000 });
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
}

async function deleteItems() {
    const confirmed = confirm('Are you sure you want to delete this item?');
    if (confirmed) {
        const { data, error } = await useApiFetch(`/api/event/delete`, {
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
        const { data, error } = await useApiFetch(`/api/event/force-delete`, {
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
        const { data, error } = await useApiFetch(`/api/event/restore`, {
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
</script>
<template>
    <div class="flex flex-col gap-8">
        <!-- Page Title & Action Buttons -->
        <div class="md:flex md:items-center md:justify-between md:gap-5">
            <div class="flex items-center gap-2">
                <Icon name="solar:asteroid-linear" class="size-5 opacity-75" />
                <div>{{ serverParams.deleted ? 'Deleted News' : 'News' }}</div>
            </div>
            <div class="md:flex md:items-center md:gap-5 md:space-y-0 space-y-5">
                <template v-if="selectedRows.length > 0">
                    <button v-if="serverParams.deleted" class="btn btn-danger btn-rounded px-6 btn-sm gap-3 md:w-fit w-full md:mt-0 mt-5" @click="forceDeleteItems">
                        <Icon name="solar:trash-bin-minimalistic-line-duotone" class="size-5 opacity-75" />
                        Delete Permanently
                    </button>
                    <button v-else class="btn btn-danger btn-rounded px-6 btn-sm gap-3 md:w-fit w-full md:mt-0 mt-5" @click="deleteItems">
                        <Icon name="solar:trash-bin-minimalistic-line-duotone" class="size-5 opacity-75" />
                        Delete Items
                    </button>
                    <button v-if="serverParams.deleted" class="btn btn-success btn-rounded px-6 btn-sm gap-3 md:w-fit w-full md:mt-0 mt-5" @click="restoreItems">
                        <Icon name="solar:restart-circle-outline" class="size-5 opacity-75" />
                        Restore Items
                    </button>
                </template>
                <button :disabled="serverParams.deleted" class="btn btn-primary btn-rounded px-6 btn-sm gap-3 md:w-fit w-full md:mt-0 mt-5" @click="openModal()">
                    <Icon name="solar:add-square-linear" class="size-5 opacity-75" />
                    Add New
                </button>
                <button class="btn btn-primary btn-rounded px-6 btn-sm gap-3 md:w-fit w-full md:mt-0 mt-5" @click="toggleDeleted">
                    <Icon :name="serverParams.deleted ? 'solar:hamburger-menu-line-duotone' : 'solar:trash-bin-minimalistic-line-duotone'" class="size-5 opacity-75" />
                    {{ serverParams.deleted ? 'Items List' : 'Deleted Items' }}
                </button>
            </div>
        </div>
        <!-- Filter & Search -->
        <div class="grid lg:grid-cols-12 gap-5 items-center p-5 bg-white border rounded-2xl">
            <FormInputField v-model="filter.title" rounded class="xl:col-span-4 lg:col-span-4" placeholder="Name" />
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
                    <th>Location</th>
                    <th>Active</th>
                    <th v-if="serverParams.deleted">Deleted At</th>
                    <th class="text-right">Action</th>
                </tr>
            </thead>
            <tbody>
                <template v-if="!pending && rows">
                    <tr v-for="row in rows.data" :key="row.id">
                        <td>
                            <input :checked="isSelected(row.id)" type="checkbox" class="form-check-input" @change="toggleRowSelection(row.id)" />
                        </td>
                        <td>
                            <div class="text-sm flex items-center gap-3">
                                <NuxtImg v-if="row.image" :src="row.imageUrl" class="h-12 !rounded-md w-20 object-cover shrink-0" />
                                <div>
                                    <div class="font-normal">{{ row.title }}</div>
                                    <div class="opacity-75 mt-0.5 flex items-center gap-2 whitespace-nowrap">
                                        <span>{{ row.startDateFormatted }}</span>
                                        <span>-</span>
                                        <span class="py-0.5 px-3 text-xs bg-slate-200 rounded-full font-medium">{{ row.duration }} Days</span>
                                    </div>
                                </div>
                            </div>
                        </td>
                        <td>
                            <div class="flex flex-col items-start gap-1 justify-start">
                                <div class="flex items-center text-xs whitespace-nowrap">
                                    <NuxtImg :src="row.country.imageUrl" class="h-4 !rounded-sm w-6 object-cover shrink-0 mr-1.5" />
                                    <div class="opacity-75 font-semibold">{{ row.country.name }}</div>
                                    <span>, {{ row.city }}</span>
                                </div>
                                <span class="capitalize font-medium py-0.5 mt-0.5 px-3 text-xs bg-slate-200 rounded-full">{{ row.type }}</span>
                            </div>
                        </td>

                        <td>
                            <FormSwitch :id="'row-active-' + row.id" v-model="row.active" :disabled="serverParams.deleted" @change="useToggleSwitch(row.id, 'active', 'event')" />
                        </td>
                        <td v-if="serverParams.deleted" class="text-sm">{{ row.deletedAt }}</td>
                        <td class="text-right">
                            <div>
                                <button :disabled="serverParams.deleted" class="btn btn-secondary btn-rounded btn-sm gap-3" @click="openModal(row.id)">
                                    <Icon name="solar:pen-new-round-outline" class="size-4" />
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
        <!-- Pagination -->
        <TablePagination :pending="pending" :rows="rows" :page="serverParams.page" @change-page="changePage" />

        <TheModal :open-modal="isOpen" size="5xl" @close-modal="closeModal()">
            <template #header>
                <div class="flex justify-between items-center">
                    <div class="font-medium" v-html="editMode ? 'Update Item' : 'Add New Item'"></div>
                    <Icon class="w-8 h-8 opacity-50 cursor-pointer hover:opacity-100 ease-in-out duration-300" name="solar:close-square-outline" @click="closeModal" />
                </div>
            </template>
            <template #content>
                <div class="grid lg:grid-cols-12 gap-5 items-start">
                    <div class="lg:col-span-4">
                        <FormUploader v-model="item.image" :errors="v$.image.$errors" :allowed-types="['image']" label="Image" name="image" />
                    </div>
                    <div class="lg:col-span-8 grid lg:grid-cols-12 gap-5">
                        <FormInputField v-model="item.title" :errors="v$.title.$errors" class="lg:col-span-12" label="Title" name="title" placeholder="Title" />
                        <FormInputField v-model="item.venue" :errors="v$.venue.$errors" class="lg:col-span-6" label="Venue" name="venue" placeholder="Venue" />
                        <FormSelectField
                            id="event-type"
                            v-model="item.type"
                            :errors="v$.type.$errors"
                            label="Type"
                            :clearable="false"
                            class="lg:col-span-6"
                            placeholder="Please select a type..."
                            :select-data="[
                                { id: 'conferences', name: 'Conferences' },
                                { id: 'exhibitions', name: 'Exhibitions' },
                            ]"
                            labelvalue="name"
                            keyvalue="id"
                        />
                        <FormInputField v-model="item.orderId" :errors="v$.orderId.$errors" class="lg:col-span-6" label="Order" name="order-id" placeholder="Order Number" type="number" />
                        <FormSwitch v-model="item.active" :errors="v$.active.$errors" name="'active" label="Active" class="lg:col-span-3" />
                        <FormSwitch v-model="item.featured" :errors="v$.featured.$errors" name="'featured" label="Featured" class="lg:col-span-3" />
                    </div>
                    <FormDatePicker v-model="item.startDate" :time-picker="false" :errors="v$.startDate.$errors" class="lg:col-span-4" label="Start Date" name="start-date" />
                    <FormDatePicker v-model="item.endDate" :time-picker="false" :errors="v$.endDate.$errors" class="lg:col-span-4" label="End Date" name="end-date" />
                    <FormInputField v-model="item.duration" :errors="v$.duration.$errors" class="lg:col-span-4" label="Number of Days" name="duration" placeholder="Number of Days" type="number" />
                    <FormSelectField
                        id="city-country-id"
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
                    <FormInputField v-model="item.urlText" :errors="v$.urlText.$errors" class="lg:col-span-6" label="Url Text" name="url-text" placeholder="Url Text" />
                    <FormInputField v-model="item.urlPath" :errors="v$.urlPath.$errors" class="lg:col-span-6" label="Url Link" name="url-link" placeholder="Url Link" />
                    <FormInputField v-model="item.shortDes" :errors="v$.shortDes.$errors" class="lg:col-span-12" label="Short Description" name="short-description" placeholder="Short Description" type="textarea" />
                    <FormRichTextEditor v-model="item.des" :errors="v$.des.$errors" label="Description" class="lg:col-span-12" />
                    <div class="lg:col-span-12 grid lg:grid-cols-12 gap-5 px-5 pb-5 pt-3 rounded-xl border">
                        <div class="lg:col-span-12 flex flex-col border-b border-dashed pb-3">
                            <div class="flex items-center gap-3">
                                <Icon name="solar:graph-up-linear" class="size-5 opacity-50" />
                                <span class="opacity-75 font-medium">Statistics Details</span>
                            </div>
                            <p class="text-sm opacity-75 mt-0.5 font-light ml-8">This section will be active for passed due events based on End Data</p>
                        </div>
                        <FormInputField
                            v-model="item.delegates"
                            :errors="v$.delegates.$errors"
                            description="Leave empty to disable"
                            class="lg:col-span-6"
                            label="Delegates Count"
                            name="delegates"
                            placeholder="Total or average Delegates Count"
                            type="number"
                        />
                        <FormInputField
                            v-model="item.sessions"
                            :errors="v$.sessions.$errors"
                            description="Leave empty to disable"
                            class="lg:col-span-6"
                            label="Sessions Count"
                            name="sessions"
                            placeholder="Total or average Sessions Count"
                            type="number"
                        />
                        <FormInputField
                            v-model="item.companies"
                            :errors="v$.companies.$errors"
                            description="Leave empty to disable"
                            class="lg:col-span-6"
                            label="Companies Count"
                            name="companies"
                            placeholder="Total or average Companies Count"
                            type="number"
                        />
                        <FormInputField
                            v-model="item.countries"
                            :errors="v$.countries.$errors"
                            description="Leave empty to disable"
                            class="lg:col-span-6"
                            label="Countries Count"
                            name="countries"
                            placeholder="Total or average Countries Count"
                            type="number"
                        />
                    </div>
                    <FormUploader v-model="item.gallery" :errors="v$.gallery.$errors" :allowed-types="['image']" :limit="200" label="Gallery" name="gallery" class="lg:col-span-12" />
                </div>
            </template>
            <template #footer>
                <div class="w-full flex items-center justify-end gap-5">
                    <button :disabled="formLoading" class="btn-rounded btn-sm btn btn-danger px-4" type="button" @click="closeModal">
                        <Icon :name="formLoading ? 'svg-spinners:3-dots-fade' : 'solar:close-circle-linear'" class="w-5 h-5 mr-2" />
                        <span>Close</span>
                    </button>
                    <button :disabled="formLoading" class="btn-rounded btn-sm btn btn-primary px-4" type="button" @click="handleModalSubmit()">
                        <Icon :name="formLoading ? 'svg-spinners:3-dots-fade' : 'solar:check-circle-broken'" class="w-5 h-5 mr-2" />
                        <span v-html="editMode ? 'Update' : 'Save'" />
                    </button>
                </div>
            </template>
        </TheModal>
    </div>
</template>
