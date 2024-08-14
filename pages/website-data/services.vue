<script setup>
import { numeric, required, requiredIf } from '@vuelidate/validators';
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
const serverParams = ref({
    filters: {},
    orderBy: 'id',
    orderByDirection: 'desc',
    perPage: 25,
    page: 1,
    paginate: true,
    deleted: false,
});
const settingStore = useSettingsStore();
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
} = await useApiFetch('/api/service/index', {
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
    name: null,
    shortDes: null,
    icon: null,
    networks: [],
    contents: [],
    position: null,
    image: null,
});
const rules = ref({
    name: { required },
    shortDes: { required },
    icon: { required: requiredIf(() => item.value.image === null) },
    image: { required: requiredIf(() => item.value.icon === null) },
    networks: {},
    contents: {},
    position: { numeric },
});
const v$ = useVuelidate(rules, item);
const fetchItem = async (id) => {
    const { data, error } = await useApiFetch(`/api/service/${id}`, {
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
        name: null,
        shortDes: null,
        icon: null,
        networks: [],
        contents: [],
        position: null,
        image: null,
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
    await networkStatus();
    formLoading.value = false;
    isOpen.value = true;
}
async function updateItem() {
    const { data, error } = await useApiFetch(`/api/service/${item.value?.id}`, {
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
    const { data, error } = await useApiFetch(`/api/service`, {
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
        const { data, error } = await useApiFetch(`/api/service/delete`, {
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
        const { data, error } = await useApiFetch(`/api/service/force-delete`, {
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
        const { data, error } = await useApiFetch(`/api/service/restore`, {
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
async function networkStatus() {
    const itemNetworks = item.value.networks.map((n) => n.networkId);
    settingStore.networks.forEach((network) => {
        const networkExist = itemNetworks.includes(network.id);
        if (!networkExist) {
            const newNetworkStatus = {
                networkId: network.id,
                active: false,
            };
            item.value.networks.push(newNetworkStatus);
        }
    });
}

// Child Methods
const isChildOpen = ref(false);
const childEditMode = ref(false);
const children = ref({
    name: null,
    type: null,
    detail: null,
    parentId: null,
    active: true,
    image: null,
    position: null,
});
const childrenRules = ref({
    name: { required },
    type: { required },
    detail: { required: requiredIf(() => children.value.type !== 'divider') },
    parentId: { required: requiredIf(() => children.value.type === 'list-item') },
    image: { required: requiredIf(() => children.value.type === 'image') },
    position: {},
});
const s$ = useVuelidate(childrenRules, children);
const fetchChildItem = async (id) => {
    const { data, error } = await useApiFetch(`/api/content/${id}`, {
        lazy: true,
    });
    if (data.value) {
        children.value = data.value.data;
    }
    if (error.value) {
        useToast({ title: 'Error', message: data.value.message, type: 'error', duration: 5000 });
    }
};
const resetChildrenValues = async () => {
    children.value = {
        name: null,
        type: null,
        detail: null,
        active: true,
        parentId: null,
        image: null,
        position: null,
    };
};
async function closeChildModal() {
    isChildOpen.value = false;
    childEditMode.value = false;
    s$.value.$reset();
    await resetChildrenValues();
}
async function openChildModal(id = null) {
    formLoading.value = true;
    if (id !== null) {
        childEditMode.value = true;
        await fetchChildItem(id);
    } else {
        children.value.menuId = item.value?.id;
        childEditMode.value = false;
    }
    formLoading.value = false;
    isChildOpen.value = true;
}
async function deleteChild(id, menuId) {
    const confirmed = confirm('Are you sure you want to delete this item?');
    if (confirmed) {
        const { data, error } = await useApiFetch(`/api/content/delete/${id}`, {
            method: 'DELETE',
            lazy: true,
        });
        if (data.value) {
            useToast({ title: 'Success', message: data.value.message, type: 'success', duration: 5000 });
            await fetchItem(menuId);
        }
        if (error.value) {
            useToast({ title: 'Error', message: data.value.message, type: 'error', duration: 5000 });
        }
    }
}
async function updateChildItem() {
    const { data, error } = await useApiFetch(`/api/content/${children.value?.id}`, {
        method: 'PATCH',
        body: children,
        lazy: true,
    });
    if (data.value) {
        useToast({ title: 'Success', message: data.value.message, type: 'success', duration: 5000 });
        await closeChildModal();
        await fetchItem(item.value?.id);
    }
    if (error.value) {
        useToast({ title: 'Error', message: data.value.message, type: 'error', duration: 5000 });
    }
}
async function addChildItem() {
    const { data, error } = await useApiFetch(`/api/content`, {
        method: 'POST',
        body: children,
        lazy: true,
    });
    if (data.value) {
        useToast({ title: 'Success', message: data.value.message, type: 'success', duration: 5000 });
        await closeChildModal();
        await fetchItem(item.value?.id);
    }
    if (error.value) {
        useToast({ title: 'Error', message: data.value.message, type: 'error', duration: 5000 });
    }
}
async function handleChildModalSubmit() {
    formLoading.value = true;
    const result = await s$.value.$validate();
    if (!result) {
        formLoading.value = false;
        return false;
    }
    if (childEditMode.value === true) {
        await updateChildItem();
    } else {
        await addChildItem();
    }
    formLoading.value = false;
}
const contentTypes = ref([
    { name: 'Heading', value: 'heading' },
    { name: 'Paragraph', value: 'paragraph' },
    { name: 'Section With Image', value: 'section-with-image' },
    { name: 'Image', value: 'image' },
    { name: 'List', value: 'list' },
    { name: 'List Item', value: 'list-item' },
    { name: 'Divider', value: 'divider' },
]);
</script>
<template>
    <div class="flex flex-col gap-8">
        <!-- Page Title & Action Buttons -->
        <div class="md:flex md:items-center md:justify-between md:gap-5">
            <div class="flex items-center gap-2">
                <Icon name="solar:asteroid-linear" class="size-5 opacity-75" />
                <div>{{ serverParams.deleted ? 'Deleted Services' : 'Services' }}</div>
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
                    <th class="text-center">Position</th>
                    <th v-if="serverParams.deleted">Deleted At</th>
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
                            <div class="opacity-75 font-medium line-clamp-1">{{ row.name }}</div>
                            <div class="opacity-75 font-light text-xs mt-0.5">{{ row.slug }}</div>
                        </td>
                        <td class="text-center">
                            {{ row.position }}
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
                    <div class="font-medium" v-html="editMode ? 'Update Item' : 'Add New Item'"></div>
                    <Icon class="w-8 h-8 opacity-50 cursor-pointer hover:opacity-100 ease-in-out duration-300" name="solar:close-square-outline" @click="closeModal" />
                </div>
            </template>
            <template #content>
                <div class="grid lg:grid-cols-12 gap-5 items-start">
                    <div class="lg:col-span-4">
                        <FormUploader v-model="item.image" :errors="v$.image.$errors" :allowed-types="['image']" label="Image" name="image" />
                    </div>
                    <div class="lg:col-span-8 grid grid-cols-12 gap-5">
                        <FormInputField v-model="item.name" :errors="v$.name.$errors" class="lg:col-span-12" label="Name" name="name" placeholder="Name" />
                        <FormInputField v-model="item.icon" :errors="v$.icon.$errors" class="lg:col-span-12" label="Icon Name" name="icon" placeholder="Icon Name" />
                        <FormInputField v-model="item.position" :errors="v$.position.$errors" class="lg:col-span-12" label="Position" name="order-id" placeholder="Position Number" type="number" />
                    </div>
                    <FormInputField v-model="item.shortDes" :errors="v$.shortDes.$errors" class="lg:col-span-12" label="Short Description" name="shortDes" placeholder="Short Description" type="textarea" />
                    <div class="p-5 border lg:col-span-12 rounded-xl">
                        <div class="form-label opacity-75 font-light px-4 bg-gradient-to-r from-slate-100 to-transparent w-full rounded-lg py-2">Network Active Status</div>
                        <div class="mt-3 flex items-center justify-between gap-5">
                            <template v-for="activeNetwork in item.networks" :key="activeNetwork.networkId">
                                <FormSwitch
                                    v-model="activeNetwork.active"
                                    class="col-span-12 sm:col-span-4"
                                    flex-title
                                    :label="settingStore.networks.find((n) => n.id === activeNetwork.networkId)?.name"
                                    :name="settingStore.networks.find((n) => n.id === activeNetwork.networkId)?.slug + 'active-switch'"
                                />
                            </template>
                        </div>
                    </div>
                    <template v-if="editMode">
                        <div class="border-t col-span-12 py-5">
                            <div class="flex items-center justify-between gap-5 py-2 px-5 rounded-l-full bg-gradient-to-r from-slate-50 via-transparent to-transparent">
                                <div class="flex items-center gap-3">
                                    <Icon name="solar:hamburger-menu-line-duotone" class="w-6 h-6 opacity-75" />
                                    <div class="uppercase opacity-75">Content Items</div>
                                </div>
                                <button class="btn btn-primary btn-rounded btn-sm gap-3" @click="openChildModal()">
                                    <Icon name="solar:add-circle-outline" class="w-5 h-5" />
                                    <span>Add Content Item</span>
                                </button>
                            </div>
                            <div class="mt-5 lg:px-6 space-y-1.5">
                                <template v-for="subItem in item.contents" :key="subItem.position">
                                    <div v-if="!subItem.parentId" class="py-2 px-6 border grid grid-cols-5 gap-5 bg-slate-50 rounded-full items-center">
                                        <div class="font-semibold text-xs whitespace-nowrap col-span-2">
                                            <div class="flex items-center">
                                                <div>{{ subItem.name }}</div>
                                            </div>
                                            <div class="mt-1">
                                                <span v-if="subItem.type" class="text-xs font-light text-success">{{ contentTypes.find((t) => t.value === subItem.type).name }}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <FormSwitch :id="'child-active-' + subItem.id" v-model="subItem.active" @change="useToggleSwitch(subItem.id, 'active', 'content')" />
                                        </div>
                                        <div class="text-sm">{{ subItem.position }}</div>
                                        <div class="flex items-center space-x-2 text-xs justify-end">
                                            <div class="flex justify-center items-center gap-3">
                                                <button :disabled="formLoading" class="gap-1.5 btn btn-sm btn-secondary btn-rounded" @click="openChildModal(subItem.id)">
                                                    <Icon name="solar:pen-new-round-outline" class="w-4 h-4" />
                                                    <span>Edit</span>
                                                </button>
                                                <button :disabled="formLoading" class="gap-1.5 btn btn-sm btn-outline-danger btn-rounded" @click="deleteChild(subItem.id, subItem.menuId)">
                                                    <Icon name="solar:close-circle-outline" class="w-4 h-4" />
                                                    <span>Remove</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <template v-if="subItem.items && subItem.items.length > 0">
                                        <div v-for="child in subItem.items" :key="child.id">
                                            <div class="ml-12 py-2 px-6 border border-dashed grid grid-cols-5 gap-5 rounded-full items-center">
                                                <div class="font-semibold text-xs whitespace-nowrap col-span-2">
                                                    <div class="flex items-center">
                                                        <div class="truncate">{{ child.name }}</div>
                                                    </div>
                                                    <div class="mt-1">
                                                        <span class="text-xs font-light text-success">{{ contentTypes.find((t) => t.value === child.type).name }}</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <FormSwitch :id="'child-active-' + child.id" v-model="child.active" @change="useToggleSwitch(child.id, 'active', 'content')" />
                                                </div>
                                                <div class="text-sm">{{ child.position }}</div>
                                                <div class="flex items-center space-x-2 text-xs justify-end">
                                                    <div class="flex justify-center items-center gap-3">
                                                        <button :disabled="formLoading" class="gap-1.5 btn btn-sm btn-secondary btn-rounded" @click="openChildModal(child.id)">
                                                            <Icon name="solar:pen-new-round-outline" class="w-4 h-4" />
                                                            <span>Edit</span>
                                                        </button>
                                                        <button :disabled="formLoading" class="gap-1.5 btn btn-sm btn-outline-danger btn-rounded" @click="deleteChild(child.id, child.menuId)">
                                                            <Icon name="solar:close-circle-outline" class="w-4 h-4" />
                                                            <span>Remove</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </template>
                                </template>
                            </div>
                        </div>
                    </template>
                    <!-- Start Child Modal-->
                    <TheModal :open-modal="isChildOpen" size="5xl" @close-modal="closeChildModal()">
                        <template #header>
                            <div class="flex justify-between items-center">
                                <div class="font-medium" v-html="editMode ? 'Update Item' : 'Add New Item'"></div>
                                <Icon class="w-8 h-8 opacity-50 cursor-pointer hover:opacity-100 ease-in-out duration-300" name="solar:close-square-outline" @click="closeChildModal" />
                            </div>
                        </template>
                        <template #content>
                            <div class="grid lg:grid-cols-12 gap-5 items-start">
                                <FormInputField v-model="children.name" :errors="s$.name.$errors" class="lg:col-span-6" label="Name" name="name" placeholder="Name" description="This will be used to Dashboard Display only" />
                                <FormSelectField
                                    v-model="children.type"
                                    :errors="s$.type.$errors"
                                    labelvalue="name"
                                    keyvalue="value"
                                    :clearable="false"
                                    :select-data="contentTypes"
                                    class="lg:col-span-6"
                                    label="Content Item Type"
                                    name="menu-items-list"
                                    placeholder="Select Type..."
                                />
                                <FormSelectField
                                    v-if="children.type === 'list-item'"
                                    v-model="children.parentId"
                                    :errors="s$.parentId.$errors"
                                    labelvalue="name"
                                    keyvalue="id"
                                    :select-data="item.contents.filter((content) => content.type === 'list')"
                                    class="lg:col-span-12"
                                    label="Parent List"
                                    name="menu-items-list"
                                    placeholder="Select Parent List Item"
                                />
                                <FormUploader v-if="['image', 'section-with-image'].includes(children?.type)" v-model="children.image" :errors="s$.image.$errors" :allowed-types="['image']" class="lg:col-span-12" label="Image" name="image" />
                                <FormInputField v-model="children.detail" :errors="s$.detail.$errors" class="lg:col-span-12" label="Detail" name="detail" placeholder="Detail" :type="children.type === 'paragraph' ? 'textarea' : 'text'" />
                                <FormInputField v-model="children.position" :errors="s$.position.$errors" type="number" class="lg:col-span-9" label="Position" name="order-id" placeholder="Position" />
                                <FormSwitch v-model="children.active" class="lg:col-span-3" label="Active" name="active-input" />
                            </div>
                        </template>
                        <template #footer>
                            <div class="w-full flex items-center justify-end gap-5">
                                <button :disabled="formLoading" class="btn-rounded btn-sm btn btn-danger px-4" type="button" @click="closeChildModal">
                                    <Icon :name="formLoading ? 'svg-spinners:3-dots-fade' : 'solar:close-circle-linear'" class="w-5 h-5 mr-2" />
                                    <span>Close</span>
                                </button>
                                <button :disabled="formLoading" class="btn-rounded btn-sm btn btn-primary px-4" type="button" @click="handleChildModalSubmit()">
                                    <Icon :name="formLoading ? 'svg-spinners:3-dots-fade' : 'solar:check-circle-broken'" class="w-5 h-5 mr-2" />
                                    <span v-html="childEditMode ? 'Update' : 'Save'" />
                                </button>
                            </div>
                        </template>
                    </TheModal>
                    <!-- Start Child Modal-->
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
