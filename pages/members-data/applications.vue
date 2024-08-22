<script setup>
// import { numeric, required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';

definePageMeta({
    middleware: 'auth',
});
const years = useYearArray(199);

const selectedRows = ref([]);
const sortByList = ref([
    { name: 'Sort By ID', value: 'id' },
    { name: 'Sort By Name', value: 'name' },
    { name: 'Sort By Country', value: 'country_id' },
    { name: 'Sort By Date', value: 'created_at' },
]);
const filter = ref({
    name: null,
    countryId: null,
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
const editMode = ref(false);
const resetServerParams = async () => {
    filter.value = {
        name: null,
        countryId: null,
    };
    serverParams.value = {
        filters: {},
        orderBy: 'created_at',
        orderByDirection: 'asc',
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
} = await useApiFetch('/api/user/index', {
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
    name: null,
    addressLineOne: null,
    addressLineTwo: null,
    city: null,
    state: null,
    postalCode: null,
    countryId: null,
    website: null,
    phone: null,
    membersCount: null,
    businessEst: null,
    profile: null,
    fpp: null,
    email: null,
    refId: null,
    active: false,
    showHome: false,
    status: 'pending',
    image: null,
    contactPersons: [],
});
const membershipStatues = ref([
    { name: 'Pending', value: 'pending' },
    { name: 'Approved', value: 'approved' },
    { name: 'Suspended', value: 'suspended' },
    { name: 'Blacklisted', value: 'blacklisted' },
]);
const rules = ref({
    id: {},
    name: {},
    addressLineOne: {},
    addressLineTwo: {},
    city: {},
    state: {},
    postalCode: {},
    countryId: {},
    website: {},
    phone: {},
    membersCount: {},
    businessEst: {},
    profile: {},
    fpp: {},
    email: {},
    active: {},
    showHome: {},
    status: {},
    refId: {},
    image: {},
    contactPersons: {},
});
const v$ = useVuelidate(rules, item);
const fetchItem = async (id) => {
    const { data, error } = await useApiFetch(`/api/user/${id}`, {
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
        addressLineOne: null,
        addressLineTwo: null,
        city: null,
        state: null,
        postalCode: null,
        countryId: null,
        website: null,
        phone: null,
        membersCount: null,
        businessEst: null,
        profile: null,
        fpp: null,
        email: null,
        refId: null,
        active: false,
        showHome: false,
        status: 'pending',
        image: null,
        contactPersons: [],
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
    const { data, error } = await useApiFetch(`/api/user/${item.value.id}`, {
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
        useToast({ title: 'Error', message: error.value.data.message ?? error.value.message, type: 'error', duration: 5000 });
    }
}

async function addItem() {
    const { data, error } = await useApiFetch(`/api/user`, {
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
        useToast({ title: 'Error', message: error.value.data.message ?? error.value.message, type: 'error', duration: 5000 });
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
            useToast({ title: 'Error', message: error.value.message, type: 'error', duration: 5000 });
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
            useToast({ title: 'Error', message: error.value.message, type: 'error', duration: 5000 });
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
            useToast({ title: 'Error', message: error.value.message, type: 'error', duration: 5000 });
        }
    }
}

const resources = useResourceStore();
</script>
<template>
    <div v-if="useCheckPermission(['list-member', 'create-member', 'edit-member', 'delete-member', 'restore-member', 'force-delete-member'])" class="flex flex-col gap-8">
        <!-- Page Title & Action Buttons -->
        <div class="md:flex md:items-center md:justify-between md:gap-5">
            <div class="flex items-center gap-2">
                <Icon name="solar:asteroid-linear" class="size-5 opacity-75" />
                <div>{{ serverParams.deleted ? 'Deleted Countries' : 'Countries' }}</div>
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
                <!--                <button :disabled="serverParams.deleted" class="btn btn-primary btn-rounded px-6 btn-sm gap-3 md:w-fit w-full md:mt-0 mt-5" @click="openModal()">-->
                <!--                    <Icon name="solar:add-square-linear" class="size-5 opacity-75" />-->
                <!--                    Add New-->
                <!--                </button>-->
                <button class="btn btn-primary btn-rounded px-6 btn-sm gap-3 md:w-fit w-full md:mt-0 mt-5" @click="toggleDeleted">
                    <Icon :name="serverParams.deleted ? 'solar:hamburger-menu-line-duotone' : 'solar:trash-bin-minimalistic-line-duotone'" class="size-5 opacity-75" />
                    {{ serverParams.deleted ? 'Items List' : 'Deleted Items' }}
                </button>
            </div>
        </div>
        <!-- Filter & Search -->
        <div class="grid lg:grid-cols-12 gap-5 items-center p-5 bg-white border rounded-2xl">
            <FormInputField v-model="filter.name" rounded class="lg:col-span-6" placeholder="Name" />
            <FormSelectField v-model="filter.countryId" labelvalue="name" keyvalue="id" imgvalue="imageUrl" :select-data="resources.countries" rounded class="lg:col-span-6" placeholder="Country" />
            <FormSelectField v-model="serverParams.orderBy" :clearable="false" class="lg:col-span-6 xl:col-span-4" labelvalue="name" keyvalue="value" placeholder="Sort Direction" :select-data="sortByList" />
            <FormSelectField
                v-model="serverParams.orderByDirection"
                class="lg:col-span-6 xl:col-span-4"
                :clearable="false"
                labelvalue="name"
                keyvalue="value"
                placeholder="Sort Direction"
                :select-data="[
                    { name: 'Z : A', value: 'desc' },
                    { name: 'A : Z', value: 'asc' },
                ]"
            />
            <button class="lg:col-span-6 xl:col-span-2 btn btn-rounded btn-sm btn-primary gap-3 w-full" @click="refresh">
                <Icon name="solar:rounded-magnifer-line-duotone" class="size-5 shrink-0" />
                Filter
            </button>
            <button class="lg:col-span-6 xl:col-span-2 btn btn-rounded btn-sm btn-secondary gap-3 w-full" @click="resetServerParams">
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
                    <th class="whitespace-nowrap">Submission Date</th>
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
                            <div class="flex items-center gap-3">
                                <NuxtImg :src="row.imageUrl" class="h-10 !rounded-md w-16 object-cover shrink-0" />
                                <div>
                                    <div>{{ row.name }}</div>
                                    <div class="text-sm opacity-75 mt-0.5 flex items-center whitespace-nowrap">
                                        <NuxtImg :src="row.country?.imageUrl" class="h-4 w-6 mr-1.5 shrink-0" :alt="row.country?.name" :tite="row.country?.name" />
                                        <div class="max-w-32 truncate">{{ row.country?.name }}</div>
                                        <div v-if="row.state" class="max-w-24 truncate">, {{ row.state }}</div>
                                        <div v-if="row.city" class="max-w-24 truncate">, {{ row.city }}</div>
                                    </div>
                                </div>
                            </div>
                        </td>
                        <td>
                            <div class="text-xs whitespace-nowrap">
                                {{ row.createdAt }}
                            </div>
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
                        <td colspan="5">
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
                    <div class="font-medium" v-html="editMode ? 'View Item' : 'Add New Item'"></div>
                    <Icon class="w-8 h-8 opacity-50 cursor-pointer hover:opacity-100 ease-in-out duration-300" name="solar:close-square-outline" @click="closeModal" />
                </div>
            </template>
            <template #content>
                <div class="grid lg:grid-cols-12 gap-5 items-start">
                    <div class="lg:col-span-4">
                        <FormUploader v-model="item.image" :allowed-types="['image', 'svg']" label="Flag" name="image" />
                        <!--                        <NuxtImg v-if="item.image" class="h-36 w-full object-contain" :src="item.imageUrl" :alt="item.name" />-->
                        <!--                        <div class="h-36 bg-slate-50 text-center flex place-content-center items-center">No Logo</div>-->
                    </div>
                    <div class="lg:col-span-8 grid lg:grid-cols-12 gap-5 items-center">
                        <FormInputField v-model="item.name" :errors="v$.name.$errors" class="lg:col-span-12" label="Name" name="name" placeholder="Name" />
                        <FormInputField v-model="item.email" :errors="v$.email.$errors" class="lg:col-span-12" label="Email" name="email" placeholder="Email" />
                        <FormInputField v-model="item.addressLineOne" :errors="v$.addressLineOne.$errors" class="lg:col-span-12" label="Address Line One" name="address-line-one" placeholder="Name" />
                        <FormInputField v-model="item.addressLineTwo" :errors="v$.addressLineTwo.$errors" class="lg:col-span-12" label="Address Line Two" name="address-line-two" placeholder="Name" />
                        <FormInputField v-model="item.city" :errors="v$.city.$errors" class="lg:col-span-4" label="City" name="city" placeholder="City" />
                        <FormInputField v-model="item.state" :errors="v$.state.$errors" class="lg:col-span-4" label="State" name="state" placeholder="State" />
                        <FormInputField v-model="item.postalCode" :errors="v$.postalCode.$errors" class="lg:col-span-4" label="Postal Code" name="postal-code" placeholder="Postal Code" />
                        <FormSelectField v-model="item.countryId" label="Country" labelvalue="name" keyvalue="id" imgvalue="imageUrl" :select-data="resources.countries" rounded class="lg:col-span-6" name="country-id" placeholder="Country" />
                        <FormInputField v-model="item.website" :errors="v$.website.$errors" class="lg:col-span-6" label="Website" name="website" placeholder="Website" />
                        <FormInputField v-model="item.phone" :errors="v$.phone.$errors" class="lg:col-span-6" label="Phone" name="phone" placeholder="Phone" />
                        <FormInputField v-model="item.membersCount" :errors="v$.membersCount.$errors" class="lg:col-span-6" type="number" label="Members Count" name="members-count" placeholder="Members Count" />
                        <FormSelectField
                            v-model="item.businessEst"
                            :errors="v$.businessEst.$errors"
                            labelvalue="name"
                            keyvalue="id"
                            :select-data="years"
                            class="lg:col-span-6"
                            label="Business Establish Year"
                            name="company-business-est"
                            placeholder="Business Establish Year"
                        />
                        <FormInputField v-model="item.fpp" :errors="v$.fpp.$errors" class="lg:col-span-6" label="Has FPP" name="fpp" placeholder="Has FPP" />
                        <FormInputField v-model="item.profile" type="textarea" :errors="v$.profile.$errors" class="lg:col-span-12" label="Profile" name="profile" placeholder="Profile" />
                        <FormSwitch v-model.number="item.active" class="lg:col-span-6" label="Active" name="membership-active" />
                        <FormSwitch v-model.number="item.showHome" class="lg:col-span-6" label="Show Home" name="show-home" />
                        <FormSelectField
                            v-model="item.status"
                            :errors="v$.status.$errors"
                            labelvalue="name"
                            keyvalue="value"
                            :select-data="membershipStatues"
                            class="lg:col-span-12"
                            label="Status"
                            name="network-membership-status"
                            placeholder="Membership Status"
                        />

                        <div class="lg:col-span-12 border-t p-5 bg-slate-50 text-sm">
                            <div class="font-medium">Representatives Details</div>
                            <div v-if="item.contactPersons.length > 0" class="mt-1.5 flex flex-col gap-3">
                                <ul v-for="person in item.contactPersons" :key="person.id" class="divide-y divide-slate-100 divide-dashed grid lg:grid-cols-1 gap-3 bg-white/50 p-2 border border-slate-200 rounded-lg">
                                    <li>
                                        <div class="grid grid-cols-2 items-center gap-5 py-0.5">
                                            <div class="opacity-75">Name</div>
                                            <div class="flex items-center gap-0.5">
                                                <span class="capitalize opacity-75 font-light mr-1">{{ person.title }}</span>
                                                <span>{{ person.firstName }}</span>
                                                <span>{{ person.lastName }}</span>
                                            </div>
                                        </div>
                                    </li>
                                    <li class="grid grid-cols-2 items-center gap-5 py-0.5">
                                        <div class="opacity-75">Job Title</div>
                                        <div class="font-medium">
                                            {{ person.jobTitle }}
                                        </div>
                                    </li>
                                    <li class="grid grid-cols-2 items-center gap-5 py-0.5">
                                        <div class="opacity-75">Email</div>
                                        <div class="font-medium">{{ person.email }}</div>
                                    </li>
                                    <li class="flex items-center justify-between gap-5">
                                        <div class="opacity-75">Phone</div>
                                        <div class="font-medium">{{ person.phoneNumber }}</div>
                                    </li>
                                    <li class="flex items-center justify-between gap-5">
                                        <div class="opacity-75">Cell</div>
                                        <div class="font-medium">{{ person.cellNumber }}</div>
                                    </li>
                                </ul>
                            </div>
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
                    <button :disabled="formLoading" class="btn-rounded btn-sm btn btn-primary px-4" type="button" @click="handleModalSubmit()">
                        <Icon :name="formLoading ? 'svg-spinners:3-dots-fade' : 'solar:check-circle-broken'" class="w-5 h-5 mr-2" />
                        <span v-html="editMode ? 'Update' : 'Save'" />
                    </button>
                </div>
            </template>
        </TheModal>
    </div>
</template>
