<script setup>
import { required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';

definePageMeta({
    middleware: ['auth', 'permission'],
    permissions: ['show-website-data-articles'],
});

// ========== Permissions ==========
const pageSlug = 'website-data-articles';
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
    { name: 'Sort By Title', value: 'title' },
    { name: 'Sort By Date', value: 'created_at' },
]);
const filter = ref({
    title: null,
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
        title: null,
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
    status,
    refresh,
} = await useApiFetch('/api/article/index', {
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

const item = ref({
    title: null,
    slug: null,
    content: null,
    excerpt: null,
    image: null,
    active: true,
});

const rules = ref({
    title: { required },
    slug: { required },
    content: {},
    excerpt: {},
    image: {},
    active: {},
});

const v$ = useVuelidate(rules, item);

const fetchItem = async (id) => {
    const { data, error } = await useApiFetch(`/api/article/${id}`, {
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
        title: null,
        slug: null,
        content: null,
        excerpt: null,
        image: null,
        active: true,
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
    const { data, error } = await useApiFetch(`/api/article/${item.value.id}`, {
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
        useToast({ title: 'Error', message: error.value.data?.message ?? error.value.message, type: 'error', duration: 5000 });
    }
}

async function addItem() {
    const { data, error } = await useApiFetch(`/api/article`, {
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
        useToast({ title: 'Error', message: error.value.data?.message ?? error.value.message, type: 'error', duration: 5000 });
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
    const confirmed = confirm('Are you sure you want to delete the selected items?');
    if (confirmed) {
        const { data, error } = await useApiFetch(`/api/article/delete`, {
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
    const confirmed = confirm('Are you sure you want to permanently delete the selected items?');
    if (confirmed) {
        const { data, error } = await useApiFetch(`/api/article/force-delete`, {
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
    const confirmed = confirm('Are you sure you want to restore the selected items?');
    if (confirmed) {
        const { data, error } = await useApiFetch(`/api/article/restore`, {
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
                <Icon name="solar:document-text-linear" class="size-5 opacity-75" />
                <div>{{ serverParams.deleted ? 'Deleted Articles' : 'Articles' }}</div>
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
                <button v-if="canCreate" :disabled="serverParams.deleted" class="btn btn-primary btn-rounded px-6 btn-sm gap-3 md:w-fit w-full md:mt-0 mt-5" @click="openModal()">
                    <Icon name="solar:add-square-linear" class="size-5 opacity-75" />
                    Add New
                </button>
                <button class="btn btn-secondary btn-rounded px-6 btn-sm gap-3 md:w-fit w-full md:mt-0 mt-5" @click="toggleDeleted">
                    <Icon :name="serverParams.deleted ? 'solar:hamburger-menu-line-duotone' : 'solar:trash-bin-minimalistic-line-duotone'" class="size-5 opacity-75" />
                    {{ serverParams.deleted ? 'Items List' : 'Deleted Items' }}
                </button>
            </div>
        </div>

        <!-- Filter & Search -->
        <div class="grid lg:grid-cols-12 gap-5 items-center p-5 bg-white border rounded-2xl">
            <FormInputField v-model="filter.title" rounded class="xl:col-span-4 lg:col-span-4" placeholder="Search by title" />
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
                        <th class="text-left">Title</th>
                        <th class="text-center">Active</th>
                        <th v-if="serverParams.deleted" class="text-center">Deleted At</th>
                        <th class="text-right">Action</th>
                    </tr>
                </thead>
                <tbody>
                    <template v-if="status !== 'pending' && rows">
                        <tr v-for="row in rows.data" :key="row.id" class="border-b hover:bg-slate-50/50">
                            <td>
                                <input :checked="isSelected(row.id)" type="checkbox" class="form-check-input" @change="toggleRowSelection(row.id)" />
                            </td>
                            <td class="font-normal">
                                <div class="flex items-center gap-3">
                                    <NuxtImg v-if="row.image" :src="row.imageUrl" class="h-10 !rounded-md w-16 object-cover shrink-0" />
                                    <div>
                                        <div class="font-medium text-slate-800">{{ row.title }}</div>
                                        <div class="font-light text-sm opacity-75">{{ row.slug }}</div>
                                    </div>
                                </div>
                            </td>
                            <td class="text-center">
                                <FormSwitch :id="'row-active-' + row.id" v-model="row.active" :disabled="serverParams.deleted" @change="useToggleSwitch(row.id, 'active', 'article')" />
                            </td>
                            <td v-if="serverParams.deleted" class="text-center text-sm">{{ row.deletedAt }}</td>
                            <td class="text-right">
                                <button v-if="canUpdate" :disabled="serverParams.deleted" class="btn btn-secondary btn-rounded btn-sm gap-2" @click="openModal(row.id)">
                                    <Icon name="solar:pen-new-round-outline" class="size-4" />
                                    Edit
                                </button>
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
                    <tr v-if="status !== 'pending' && rows?.data?.length === 0">
                        <td colspan="5" class="p-8 text-center text-sm text-slate-500">No articles found.</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Pagination -->
        <TablePagination :pending="status === 'pending'" :rows="rows" :page="serverParams.page" @change-page="changePage" />

        <!-- Modal -->
        <TheModal :open-modal="isOpen" size="5xl" @close-modal="closeModal()">
            <template #header>
                <div class="flex justify-between items-center">
                    <div>
                        <div class="text-lg font-semibold text-slate-800">{{ editMode ? 'Update Article' : 'Add New Article' }}</div>
                        <div class="text-xs text-slate-500">{{ editMode ? 'Edit article details' : 'Create a new article' }}</div>
                    </div>
                    <Icon class="w-8 h-8 opacity-50 cursor-pointer hover:opacity-100 ease-in-out duration-300" name="solar:close-square-outline" @click="closeModal" />
                </div>
            </template>
            <template #content>
                <div class="grid lg:grid-cols-12 gap-5 items-start">
                    <FormInputField v-model="item.title" :errors="v$.title.$errors" class="lg:col-span-6" label="Title" name="title" placeholder="Article Title" />
                    <FormInputField v-model="item.slug" :errors="v$.slug.$errors" class="lg:col-span-6" label="Slug" name="slug" placeholder="article-slug" />
                    <FormUploader v-model="item.image" :allowed-types="['image']" label="Image" name="image" class="lg:col-span-12" />
                    <FormInputField v-model="item.excerpt" :errors="v$.excerpt.$errors" class="lg:col-span-12" label="Excerpt" name="excerpt" placeholder="Short description of the article" type="textarea" rows="3" />
                    <FormRichTextEditor v-model="item.content" :errors="v$.content.$errors" label="Content" name="content" class="lg:col-span-12" />
                    <FormSwitch v-model="item.active" label="Active" class="lg:col-span-12" name="active-input" />
                </div>
            </template>
            <template #footer>
                <div class="w-full flex items-center justify-end gap-5">
                    <button :disabled="formLoading" class="btn-rounded btn-sm btn btn-danger px-4" type="button" @click="closeModal">
                        <Icon :name="formLoading ? 'svg-spinners:3-dots-fade' : 'solar:close-circle-linear'" class="w-5 h-5 mr-2" />
                        <span>Cancel</span>
                    </button>
                    <button :disabled="formLoading || (editMode ? !canUpdate : !canCreate)" class="btn-rounded btn-sm btn btn-primary px-4" type="button" @click="handleModalSubmit()">
                        <Icon :name="formLoading ? 'svg-spinners:3-dots-fade' : 'solar:check-circle-broken'" class="w-5 h-5 mr-2" />
                        <span>{{ editMode ? 'Update' : 'Save' }}</span>
                    </button>
                </div>
            </template>
        </TheModal>
    </div>
</template>
