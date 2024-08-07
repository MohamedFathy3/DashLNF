<script setup>
import { numeric, required } from '@vuelidate/validators';
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
const formLoading = ref(false);
const isOpen = ref(false);
const isChildOpen = ref(false);
const editMode = ref(false);
const childEditMode = ref(false);
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
} = await useApiFetch('/api/menu/index', {
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
    orderId: null,
    active: true,
    subMenus: [],
});
const children = ref({
    name: null,
    link: null,
    active: true,
    icon: null,
    type: true,
    orderId: null,
    parentId: null,
    menuId: null,
});
const rules = ref({
    name: { required },
    orderId: {},
    active: {},
});
const childrenRules = ref({
    name: { required },
    link: { required },
    active: {},
    type: { required },
    orderId: {},
    icon: {},
    parentId: { numeric },
    menuId: { required },
});
const v$ = useVuelidate(rules, item);
const s$ = useVuelidate(childrenRules, children);
const fetchItem = async (id) => {
    const { data, error } = await useApiFetch(`/api/menu/${id}`, {
        lazy: true,
    });
    if (data.value) {
        item.value = data.value.data;
    }
    if (error.value) {
        useToast({ title: 'Error', message: data.value.message, type: 'error', duration: 5000 });
    }
};
const fetchChildItem = async (id) => {
    const { data, error } = await useApiFetch(`/api/sub-menu/${id}`, {
        lazy: true,
    });
    if (data.value) {
        children.value = data.value.data;
    }
    if (error.value) {
        useToast({ title: 'Error', message: data.value.message, type: 'error', duration: 5000 });
    }
};
const resetItemValues = async () => {
    item.value = {
        name: null,
        subMenus: [],
        orderId: null,
        active: true,
    };
};
const resetChildrenValues = async () => {
    children.value = {
        name: null,
        link: null,
        active: true,
        icon: null,
        type: true,
        orderId: null,
        parentId: null,
        menuId: null,
    };
};
async function closeModal() {
    isOpen.value = false;
    editMode.value = false;
    v$.value.$reset();
    await resetItemValues();
}
async function closeChildModal() {
    isChildOpen.value = false;
    childEditMode.value = false;
    s$.value.$reset();
    await resetChildrenValues();
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
async function updateItem() {
    const { data, error } = await useApiFetch(`/api/menu/${item.value.id}`, {
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
    const { data, error } = await useApiFetch(`/api/menu`, {
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
        const { data, error } = await useApiFetch(`/api/menu/delete`, {
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
        const { data, error } = await useApiFetch(`/api/menu/force-delete`, {
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
        const { data, error } = await useApiFetch(`/api/menu/restore`, {
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
async function deleteChild(id, menuId) {
    const confirmed = confirm('Are you sure you want to delete this item?');
    if (confirmed) {
        const { data, error } = await useApiFetch(`/api/sub-menu/delete/${id}`, {
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
    const { data, error } = await useApiFetch(`/api/sub-menu/${children.value?.id}`, {
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
    const { data, error } = await useApiFetch(`/api/sub-menu`, {
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
</script>
<template>
    <div class="flex flex-col gap-8">
        <!-- Page Title & Action Buttons -->
        <div class="md:flex md:items-center md:justify-between md:gap-5">
            <div class="flex items-center gap-2">
                <Icon name="solar:asteroid-linear" class="size-5 opacity-75" />
                <div>{{ serverParams.deleted ? 'Deleted Menus' : 'Menus' }}</div>
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
                        <td class="font-normal">
                            <div>{{ row.name }}</div>
                            <div class="font-light text-sm opacity-75">{{ row.slug }}</div>
                        </td>
                        <td>
                            <FormSwitch :id="'row-active-' + row.id" v-model="row.active" :disabled="serverParams.deleted" @change="useToggleSwitch(row.id, 'active', 'menu')" />
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
                    <FormInputField v-model="item.name" :errors="v$.name.$errors" class="lg:col-span-6" label="Name" name="name" placeholder="Name" />
                    <FormInputField v-model="item.orderId" :errors="v$.orderId.$errors" class="lg:col-span-6" label="Order" name="order-id" placeholder="Order Number" />
                    <template v-if="editMode">
                        <div class="border-t col-span-12 py-5">
                            <div class="flex items-center justify-between gap-5 py-2 px-5 rounded-l-full bg-gradient-to-r from-slate-50 via-transparent to-transparent">
                                <div class="flex items-center gap-3">
                                    <Icon name="solar:hamburger-menu-line-duotone" class="w-6 h-6 opacity-75" />
                                    <div class="uppercase opacity-75">menu Items</div>
                                </div>
                                <button class="btn btn-primary btn-rounded btn-sm gap-3" type="button" @click="openChildModal()">
                                    <Icon name="solar:add-circle-outline" class="w-5 h-5" />
                                    <span>Add Menu Item</span>
                                </button>
                            </div>
                            <div class="mt-5 lg:px-6 space-y-1.5">
                                <template v-for="subItem in item.subMenus" :key="subItem.orderId">
                                    <div v-if="!subItem.parentId" class="py-2 px-6 border grid grid-cols-5 bg-slate-50 rounded-full items-center">
                                        <div class="font-semibold text-xs whitespace-nowrap col-span-2">
                                            <div class="flex items-center">
                                                <Icon v-if="subItem.icon" :name="subItem.icon" class="w-4 h-4 mr-2" />
                                                <div>{{ subItem.name }}</div>
                                            </div>
                                            <div class="mt-1">
                                                <span v-if="subItem.type" class="text-xs font-light text-success">Internal Page</span>
                                                <span v-if="!subItem.type" class="text-xs font-light text-danger">External Page</span>
                                            </div>
                                        </div>
                                        <div>
                                            <FormSwitch :id="'child-active-' + subItem.id" v-model="subItem.active" @change="useToggleSwitch(subItem.id, 'active', 'sub-menu')" />
                                        </div>
                                        <div class="text-sm">{{ subItem.orderId }}</div>
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
                                    <template v-if="subItem.children">
                                        <div v-for="child in subItem.children" :key="child.id">
                                            <div class="ml-12 py-2 px-6 border border-dashed grid grid-cols-5 rounded-full items-center">
                                                <div class="font-semibold text-xs whitespace-nowrap col-span-2">
                                                    <div class="flex items-center">
                                                        <Icon v-if="child.icon" :name="child.icon" class="w-4 h-4 mr-2" />
                                                        <div>{{ child.name }}</div>
                                                    </div>
                                                    <div class="mt-1">
                                                        <span v-if="child.type" class="text-xs font-light text-success">Internal Page</span>
                                                        <span v-else class="text-xs font-light text-danger">External Page</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <FormSwitch :id="'child-active-' + child.id" v-model="child.active" @change="useToggleSwitch(child.id, 'active', 'sub-menu')" />
                                                </div>
                                                <div class="text-sm">{{ child.orderId }}</div>
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
                                <FormInputField v-model="children.name" :errors="s$.name.$errors" class="col-span-12 sm:col-span-6" label="Name" name="name" placeholder="Name" />
                                <FormInputField v-model="children.link" :errors="s$.link.$errors" class="col-span-12 sm:col-span-6" label="Link" name="name" placeholder="Link" />
                                <FormSelectField
                                    v-model="children.parentId"
                                    :errors="s$.parentId.$errors"
                                    labelvalue="name"
                                    keyvalue="id"
                                    :select-data="item.subMenus"
                                    class="col-span-12 sm:col-span-4"
                                    label="Parent Menu Item"
                                    name="menu-items-list"
                                    placeholder="Parent Menu Item"
                                />
                                <FormInputField v-model="children.orderId" :errors="s$.orderId.$errors" type="number" class="col-span-12 sm:col-span-4" label="Order" name="order-id" placeholder="Order" />
                                <FormInputField v-model="children.icon" :errors="s$.icon.$errors" class="col-span-12 sm:col-span-4" label="Icon" name="icon" placeholder="Icon" />
                                <FormSwitch v-model="children.type" :errors="s$.type.$errors" class="col-span-12 sm:col-span-6" :label="children.type ? 'Internal' : 'External'" name="type-input" />
                                <FormSwitch v-model="children.active" :errors="s$.active.$errors" class="col-span-12 sm:col-span-6" label="Active" name="active-input" />
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
