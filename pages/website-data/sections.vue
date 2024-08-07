<script setup>
import { required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';

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
});
const sectionTypes = ref([
    { value: 'intro', name: 'Intro' },
    { value: 'about-left-image', name: 'About - Left Image' },
    { value: 'about-right-image', name: 'About - Right Image' },
    { value: 'about-no-image', name: 'About - No Image' },
    { value: 'benefits-grid', name: 'Benefits Grid' },
    { value: 'benefits-list', name: 'Benefits List' },
    { value: 'faqs-list', name: 'FAQs List' },
    { value: 'intro-with-list', name: 'Intro with List' },
    { value: 'cta', name: 'Call To Action' },
    { value: 'contact-form', name: 'Contact Form' },
    { value: 'application-form', name: 'Application Form' },
    { value: 'network-directory', name: 'Network Directory' },
    { value: 'blacklisted-directory', name: 'Blacklisted Directory' },
    { value: 'grid-home-section', name: 'Grid Home Section' },
    { value: 'grid-box', name: 'Grid Box' },
    { value: 'news-grid', name: 'News Home Section' },
    { value: 'news-list', name: 'News Page Section' },
    { value: 'incoterms-list', name: 'Incoterms Section' },
    { value: 'events-list', name: 'Events Page Section' },
    { value: 'privacy-policy', name: 'Privacy Policy Page Section' },
    { value: 'freight-tools', name: 'Freight Tools' },
    { value: 'news-bar', name: 'News Slide Bar' },
    { value: 'testimonials-slider', name: 'Testimonials slider' },
    { value: 'partners-slider', name: 'Partners slide' },
    { value: 'image-banner-section', name: 'Image Banner section' },
    { value: 'testimonials-list', name: 'Testimonials List' },
    { value: 'site-states', name: 'Network States Counter' },
    { value: 'team-grid', name: 'Our Team Grid' },
]);
const buttonTypes = ref([
    { value: 'primary', name: 'Primary' },
    { value: 'secondary', name: 'Light Gray' },
    { value: 'dark', name: 'Dark' },
    { value: 'success', name: 'Green' },
    { value: 'warning', name: 'Orange' },
    { value: 'danger', name: 'Red' },
]);
const linkType = ref([
    { value: 0, name: 'Use Normal Link (External)' },
    { value: 1, name: 'Use Router Link (Internal)' },
]);
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
} = await useApiFetch('/api/page-section/index', {
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
    return rows?.value?.data?.every((row) => selectedRows.value.includes(row.id));
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
    title: null,
    subTitle: null,
    des: null,
    type: null,
    active: true,

    //Section Meta Data
    image: null,
    parentId: null,

    //Button One Data
    buttonLinkTypeOne: 1,
    buttonOneActive: false,
    buttonTextOne: null,
    buttonStyleOne: 'primary',
    buttonRouteOne: null,
    buttonIconOne: null,

    //Button Two Data
    buttonLinkTypeTwo: 1,
    buttonTwoActive: false,
    buttonTextTwo: null,
    buttonStyleTwo: 'primary',
    buttonRouteTwo: null,
    buttonIconTwo: null,
});
const rules = ref({
    title: { required: item.value.type !== 'benefits-grid' && item.value.type !== 'benefits-list' ? required : {} },
    subTitle: {},
    des: {},
    type: { required },
    active: {},

    image: {},
    parentId: { required: item.value.type === 'grid-box' ? required : {} },

    buttonOneActive: {},
    buttonTextOne: { required: item.value.buttonOneActive ? required : {} },
    buttonStyleOne: { required: item.value.buttonOneActive ? required : {} },
    buttonRouteOne: { required: item.value.buttonOneActive ? required : {} },
    buttonIconOne: {},
    buttonLinkTypeOne: { required: item.value.buttonOneActive ? required : {} },

    buttonTwoActive: {},
    buttonTextTwo: { required: item.value.buttonTwoActive ? required : {} },
    buttonStyleTwo: { required: item.value.buttonTwoActive ? required : {} },
    buttonRouteTwo: { required: item.value.buttonTwoActive ? required : {} },
    buttonIconTwo: {},
    buttonLinkTypeTwo: { required: item.value.buttonTwoActive ? required : {} },
});
const v$ = useVuelidate(rules, item);
const fetchItem = async (id) => {
    const { data, error } = await useApiFetch(`/api/page-section/${id}`, {
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
        subTitle: null,
        des: null,
        type: null,
        active: true,

        //Section Meta Data
        image: null,
        parentId: null,

        //Button One Data
        buttonLinkTypeOne: 1,
        buttonOneActive: false,
        buttonTextOne: null,
        buttonStyleOne: 'primary',
        buttonRouteOne: null,
        buttonIconOne: null,

        //Button Two Data
        buttonLinkTypeTwo: 1,
        buttonTwoActive: false,
        buttonTextTwo: null,
        buttonStyleTwo: 'primary',
        buttonRouteTwo: null,
        buttonIconTwo: null,
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
    const { data, error } = await useApiFetch(`/api/page-section/${item.value?.id}`, {
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
    const { data, error } = await useApiFetch(`/api/page-section`, {
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
        const { data, error } = await useApiFetch(`/api/page-section/delete`, {
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
        const { data, error } = await useApiFetch(`/api/page-section/force-delete`, {
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
        const { data, error } = await useApiFetch(`/api/page-section/restore`, {
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
                <div>{{ serverParams.deleted ? 'Deleted Sections' : 'Sections' }}</div>
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
                    <th class="text-center">Active</th>
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
                                <NuxtImg v-if="row.image" :src="row.imageUrl" class="h-10 !rounded-md w-20 object-cover shrink-0" />
                                <div>
                                    <div class="font-normal">{{ useStripHtml(row.title) }}</div>
                                    <div class="text-sm opacity-75 mt-0.5">{{ sectionTypes.find((t) => t.value === row.type).name }}</div>
                                </div>
                            </div>
                        </td>
                        <td>
                            <FormSwitch :id="'row-active-' + row.id" v-model="row.active" :disabled="serverParams.deleted" @change="useToggleSwitch(row.id, 'active', 'page-section')" />
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
                    <div class="font-medium" v-html="editMode ? 'Update Item' : 'Add New Item'"></div>
                    <Icon class="w-8 h-8 opacity-50 cursor-pointer hover:opacity-100 ease-in-out duration-300" name="solar:close-square-outline" @click="closeModal" />
                </div>
            </template>
            <template #content>
                <div class="grid lg:grid-cols-12 gap-5 items-start">
                    <FormSelectField v-model="item.type" :errors="v$.type.$errors" labelvalue="name" keyvalue="value" :select-data="sectionTypes" class="lg:col-span-9" label="Type" name="section-type" placeholder="Select Section Type" />
                    <FormSwitch v-model="item.active" label="Active" class="lg:col-span-3" name="active-input" />
                    <template v-if="item.type">
                        <template v-if="item.type === 'network-directory' || item.type === 'about-left-image' || item.type === 'about-right-image' || item.type === 'image-banner-section' || item.type === 'grid-home-section' || item.type === 'intro'">
                            <FormUploader v-model="item.image" :allowed-types="['image', 'svg']" label="Image" name="image" class="lg:col-span-12" />
                        </template>

                        <FormInputField v-model="item.title" :errors="v$.title.$errors" class="col-span-12 sm:col-span-6" label="Title" name="title" placeholder="Title" />

                        <FormSelectField
                            v-if="item.type === 'grid-box'"
                            v-model="item.parentId"
                            :errors="v$.$errors"
                            labelvalue="title"
                            keyvalue="id"
                            :select-data="rows"
                            class="col-span-12 sm:col-span-6"
                            label="Parent Section"
                            name="section-parent"
                            placeholder="Select Parent Section"
                        />

                        <FormInputField
                            v-if="
                                item.type !== 'benefits-grid' &&
                                item.type !== 'benefits-list' &&
                                item.type !== 'team-grid' &&
                                item.type !== 'grid-home-section' &&
                                item.type !== 'network-directory' &&
                                item.type !== 'testimonials-slider' &&
                                item.type !== 'partners-slider' &&
                                item.type !== 'privacy-policy' &&
                                item.type !== 'freight-tools' &&
                                item.type !== 'site-states' &&
                                item.type !== 'events-list' &&
                                item.type !== 'grid-box' &&
                                item.type !== 'contact-form'
                            "
                            v-model="item.subTitle"
                            :errors="v$.subTitle.$errors"
                            class="col-span-12 sm:col-span-6"
                            label="Sub Title"
                            name="sub-title"
                            placeholder="Sub Title"
                        />

                        <FormInputField
                            v-if="
                                item.type !== 'contact-form' &&
                                item.type !== 'network-directory' &&
                                item.type !== 'testimonials-list' &&
                                item.type !== 'team-grid' &&
                                item.type !== 'site-states' &&
                                item.type !== 'privacy-policy' &&
                                item.type !== 'testimonials-slider' &&
                                item.type !== 'partners-slider' &&
                                item.type !== 'freight-tools' &&
                                item.type !== 'news-bar' &&
                                item.type !== 'events-list' &&
                                item.type !== 'faqs-list'
                            "
                            v-model="item.des"
                            :errors="v$.des.$errors"
                            class="col-span-12"
                            label="Description"
                            type="textarea"
                            name="des"
                            placeholder="Description"
                        />

                        <FormSwitch
                            v-if="item.type === 'intro' || item.type === 'cta' || item.type === 'image-banner-section'"
                            v-model="item.buttonOneActive"
                            label="Button One Active"
                            class="col-span-12 sm:col-span-6"
                            name="button-one-active-switch"
                        />
                        <FormSwitch
                            v-if="item.type === 'intro' || item.type === 'cta' || item.type === 'image-banner-section'"
                            v-model="item.buttonTwoActive"
                            label="Button Two Active"
                            class="col-span-12 sm:col-span-6"
                            name="button-two-active-switch"
                        />
                        <!-- Button #1 -->
                        <template v-if="item.buttonOneActive && (item.type === 'intro' || item.type === 'cta' || item.type === 'image-banner-section')">
                            <div class="col-span-12 mt-2 py-2 bg-slate-100 rounded-md pl-4">
                                <h1 class="font-semibold">Button One</h1>
                                <p class="text-xs">Leave all fields empty to disable</p>
                            </div>
                            <FormInputField v-model="item.buttonTextOne" :errors="v$.buttonTextOne.$errors" label="Button text" placeholder="Button text" class="col-span-12" name="button-text-one" />
                            <FormInputField v-model="item.buttonRouteOne" :errors="v$.buttonRouteOne.$errors" label="Link" placeholder="Link" class="col-span-12 sm:col-span-6" name="button-style-one" />
                            <FormSelectField v-model="item.buttonLinkTypeOne" :errors="v$.buttonLinkTypeOne.$errors" class="lg:col-span-6" label="Link Type" :select-data="linkType" name="button-link-type-one" labelvalue="name" keyvalue="value" />
                            <FormInputField v-model="item.buttonIconOne" :errors="v$.buttonIconOne.$errors" label="Icon" placeholder="Icon" class="col-span-12 sm:col-span-6" name="button-icon-one" />
                            <FormSelectField v-model="item.buttonStyleOne" :errors="v$.buttonStyleOne.$errors" class="lg:col-span-6" label="Style" :select-data="buttonTypes" name="button-style-one" labelvalue="name" keyvalue="value" />
                        </template>
                        <!-- Button #2 -->
                        <template v-if="item.buttonTwoActive && (item.type === 'intro' || item.type === 'cta' || item.type === 'image-banner-section')">
                            <div class="col-span-12 mt-2 py-2 bg-slate-100 rounded-md pl-4">
                                <h1 class="font-semibold">Button Two</h1>
                                <p class="text-xs">Leave all fields empty to disable</p>
                            </div>
                            <FormInputField v-model="item.buttonTextTwo" :errors="v$.buttonTextTwo.$errors" label="Button text" placeholder="Button text" class="col-span-12" name="button-text-two" />
                            <FormInputField v-model="item.buttonRouteTwo" :errors="v$.buttonRouteTwo.$errors" label="Link" placeholder="Link" class="col-span-12 sm:col-span-6" name="button-style-two" />
                            <FormSelectField v-model="item.buttonLinkTypeTwo" :errors="v$.buttonLinkTypeTwo.$errors" class="lg:col-span-6" label="Link Type" :select-data="linkType" name="button-link-type-two" labelvalue="name" keyvalue="value" />
                            <FormInputField v-model="item.buttonIconTwo" :errors="v$.buttonIconTwo.$errors" label="Icon" placeholder="Icon" class="col-span-12 sm:col-span-6" name="button-icon-two" />
                            <FormSelectField v-model="item.buttonStyleTwo" :errors="v$.buttonStyleTwo.$errors" class="lg:col-span-6" label="Style" :select-data="buttonTypes" name="button-style-two" labelvalue="name" keyvalue="value" />
                        </template>
                    </template>
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
