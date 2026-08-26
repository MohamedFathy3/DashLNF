<script setup>
import { ColorPicker } from 'vue3-colorpicker';
import { required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';

definePageMeta({
    middleware: ['auth', 'permission'],
    permissions: ['show-settings-update'],
});

// ========== Permissions ==========
const pageSlug = 'settings-update';
const canCreate = useCheckPermission([`create-${pageSlug}`]);
const canUpdate = useCheckPermission([`update-${pageSlug}`]);
const canDelete = useCheckPermission([`delete-${pageSlug}`]);
const canForceDelete = useCheckPermission([`forceDelete-${pageSlug}`]);
const canRestore = useCheckPermission([`restore-${pageSlug}`]);
const canShow = useCheckPermission([`show-${pageSlug}`]);
// ========== End Permissions ==========

const { data, refresh, execute } = await useApiFetch(`/api/setting-section`, {
    lazy: true,
    immediate: false,
    transform: (data) => data.data,
});
const loadingPage = ref(true);
const formLoading = ref(false);
const editMode = ref(false);
const fieldItemId = ref(null);
const selectedSection = ref([]);

// Modal for list items
const isOpen = ref(false);
const listItem = ref({
    title: null,
    url: null,
    target: '_self',
    active: true,
});
const listRules = {
    title: { required },
};
const listV$ = useVuelidate(listRules, listItem);
const currentListFieldId = ref(null);
const currentListIndex = ref(null);

const buttonStyles = [
    { name: 'Primary', id: 'primary' },
    { name: 'Secondary', id: 'secondary' },
    { name: 'Success', id: 'success' },
    { name: 'Yellow', id: 'warning' },
    { name: 'Red', id: 'danger' },
    { name: 'Dark', id: 'dark' },
];
const buttonTargets = [
    { name: 'Self (Same Tab)', id: '_self' },
    { name: 'New Tab', id: '_blank' },
];

const initFetchData = async () => {
    await execute();
};

const setSelectedSection = async (index) => {
    selectedSection.value = data.value[index];
};

onMounted(async () => {
    loadingPage.value = true;
    await initFetchData();
    if (data.value?.length) {
        selectedSection.value = data.value[0];
    }
    loadingPage.value = false;
    await fetchMenus();
    await fetchEmailTemplates();
});

async function openModal(item = null, fieldId = null) {
    formLoading.value = true;
    currentListFieldId.value = fieldId;

    if (item) {
        editMode.value = true;
        listItem.value = { ...item };
        // Find the index of the item in the list
        const field = selectedSection.value.children.find((_) => _.id === fieldId);
        if (field) {
            currentListIndex.value = field.value.findIndex((i) => i === item);
        }
    } else {
        editMode.value = false;
        listItem.value = {
            title: null,
            url: null,
            target: '_self',
            active: true,
        };
        currentListIndex.value = null;
    }
    formLoading.value = false;
    isOpen.value = true;
}

const closeListModal = () => {
    isOpen.value = false;
    listV$.value.$reset();
    listItem.value = {
        title: null,
        url: null,
        target: '_self',
        active: true,
    };
    currentListFieldId.value = null;
    currentListIndex.value = null;
};

const saveListItem = async () => {
    const valid = await listV$.value.$validate();
    if (!valid) {
        useToast({ title: 'Error', message: 'Please fill all required fields.', type: 'error', duration: 5000 });
        return;
    }

    const field = selectedSection.value.children.find((_) => _.id === currentListFieldId.value);
    if (!field) return;

    if (editMode.value && currentListIndex.value !== null) {
        field.value[currentListIndex.value] = { ...listItem.value };
    } else {
        field.value.push({ ...listItem.value });
    }

    closeListModal();
    useToast({ title: 'Success', message: 'Item saved successfully.', type: 'success', duration: 3000 });
};

const removeItem = (index, id) => {
    const confirmed = confirm('Are you sure you want to remove this item?');
    if (!confirmed) return;
    const field = selectedSection.value.children.find((_) => _.id === id);
    if (field) {
        field.value.splice(index, 1);
        useToast({ title: 'Success', message: 'Item removed successfully.', type: 'success', duration: 3000 });
    }
};

const handleModalSubmit = async () => {
    if (!canUpdate) {
        useToast({ title: 'Error', message: 'You do not have permission to update settings.', type: 'error', duration: 5000 });
        return;
    }

    formLoading.value = true;
    const childrenValue = selectedSection.value.children.map((child) => {
        let settingValue = child.value;
        if (child.type === 'uploader') {
            if (typeof child.image === 'object' && child.image !== null) {
                settingValue = child.image.id;
            } else if (typeof child.image === 'number') {
                settingValue = child.image;
            } else {
                settingValue = null;
            }
        }
        return {
            id: child.id,
            type: child.type,
            value: child.type !== 'uploader' ? settingValue : null,
            image: child.type === 'uploader' ? settingValue : null,
        };
    });

    const { data, error } = await useApiFetch(`/api/setting/section-update`, {
        method: 'POST',
        body: {
            children: childrenValue,
        },
        lazy: true,
    });
    if (data.value) {
        useToast({ title: 'Success', message: data.value.message, type: 'success', duration: 5000 });
        await refresh();
        // Update selected section after refresh
        if (data.value?.data) {
            const updatedSection = data.value.data.find((s) => s.id === selectedSection.value.id);
            if (updatedSection) {
                selectedSection.value = updatedSection;
            }
        }
    }
    if (error.value) {
        useToast({ title: 'Error', message: error.value.data?.message ?? error.value.message, type: 'error', duration: 5000 });
    }
    formLoading.value = false;
};

const menus = ref([]);
const emailTemplates = ref([]);

const fetchMenus = async () => {
    const { data, error } = await useApiFetch(`/api/menu/index`, {
        method: 'POST',
        body: {
            orderBy: 'name',
            orderByDirection: 'asc',
            perPage: 25,
            page: 1,
            paginate: false,
            deleted: false,
        },
    });
    if (data.value) {
        menus.value = data.value.data;
    }
    if (error.value) {
        console.error('Error fetching menus:', error.value);
    }
};

const fetchEmailTemplates = async () => {
    const { data, error } = await useApiFetch(`/api/email-template/index`, {
        method: 'POST',
        body: {
            filters: {},
            relation: [],
            orderBy: 'name',
            orderByDirection: 'asc',
            perPage: 25,
            page: 1,
            paginate: false,
            deleted: false,
        },
    });
    if (data.value) {
        emailTemplates.value = data.value.data;
    }
    if (error.value) {
        console.error('Error fetching email templates:', error.value);
    }
};

const getSelectData = (dataType) => {
    if (dataType === 'menus') {
        return menus.value;
    } else if (dataType === 'email_templates') {
        return emailTemplates.value;
    } else {
        return [];
    }
};
</script>

<template>
    <div class="flex flex-col gap-8">
        <!-- Page Title & Action Buttons -->
        <div class="md:flex md:items-center md:justify-between md:gap-5">
            <div class="flex items-center gap-2">
                <Icon name="solar:pen-new-square-outline" class="size-5 opacity-75" />
                <div>Update Settings</div>
            </div>
        </div>

        <!-- Settings Content -->
        <div v-if="!loadingPage" class="grid gap-5 lg:grid-cols-12 text-sm">
            <!-- Sidebar -->
            <div class="lg:col-span-3">
                <ul class="space-y-2 p-5 bg-white rounded-2xl">
                    <template v-for="(section, index) in data" :key="section.id">
                        <li>
                            <button :class="[section.id === selectedSection?.id ? 'btn-primary' : 'btn-secondary', 'btn btn-rounded w-full justify-start hover:gap-6 gap-3 transition-all shadow-none']" @click="setSelectedSection(index)">
                                <Icon name="solar:double-alt-arrow-right-line-duotone" class="size-5 opacity-75" />
                                {{ section.label }}
                            </button>
                        </li>
                    </template>
                </ul>
            </div>

            <!-- Content -->
            <div class="lg:col-span-9 bg-white rounded-2xl p-5 flex flex-col gap-5 h-full justify-between">
                <div class="grow flex flex-col gap-5">
                    <template v-for="field in selectedSection?.children" :key="field.id">
                        <!-- Text / Number / Textarea -->
                        <template v-if="field.type === 'text' || field.type === 'number' || field.type === 'textarea'">
                            <FormInputField v-model="field.value" :label="field.label" class="intro-y" :name="field.name" :type="field.type" :placeholder="field.placeholder" />
                        </template>

                        <!-- Boolean / Switch -->
                        <template v-if="field.type === 'boolean'">
                            <FormSwitch v-model.number="field.value" :des="field.des" :label="field.label" :name="field.name" class="intro-y" />
                        </template>

                        <!-- Select -->
                        <template v-if="field.type === 'select'">
                            <FormSelectField v-model.number="field.value" class="intro-y" labelvalue="name" keyvalue="id" :select-data="getSelectData(field.data)" :label="field.label" :name="field.name" :placeholder="field.placeholder" />
                        </template>

                        <!-- Uploader -->
                        <template v-if="field.type === 'uploader'">
                            <FormUploader v-model="field.image" :label="field.label" class="intro-y" :name="field.name" :max="1" :allowed-types="['image', 'svg']" />
                        </template>

                        <!-- Color Picker -->
                        <template v-if="field.type === 'color-picker'">
                            <div class="flex justify-between gap-6 items-center">
                                <div class="form-label">{{ field.label }}</div>
                                <ColorPicker v-model:pure-color="field.value" picker-type="chrome" format="rgb" shape="square" lang="En" :debounce="1" picker-container="div" />
                            </div>
                        </template>

                        <!-- Button -->
                        <template v-if="field.type === 'button'">
                            <div class="intro-y">
                                <div class="form-label opacity-75">{{ field.label }}</div>
                                <div class="mt-3 rounded-xl p-5 border border-slate-100 grid grid-cols-12 gap-5 bg-slate-50">
                                    <FormInputField v-model="field.value.label" class="col-span-12 lg:col-span-6" label="Label" :name="field.slug + '-button-label-' + field.id" placeholder="Label" />
                                    <FormInputField v-model="field.value.icon" class="col-span-12 lg:col-span-6" label="Icon" :name="field.slug + '-button-icon-' + field.id" placeholder="Icon" />
                                    <FormSelectField
                                        v-model="field.value.style"
                                        labelvalue="name"
                                        keyvalue="id"
                                        :select-data="buttonStyles"
                                        class="col-span-12 lg:col-span-6"
                                        label="Style"
                                        :name="field.slug + '-button-style-' + field.id"
                                        placeholder="Style"
                                    />
                                    <FormSelectField
                                        v-model="field.value.target"
                                        labelvalue="name"
                                        keyvalue="id"
                                        :select-data="buttonTargets"
                                        class="col-span-12 lg:col-span-6"
                                        label="Target"
                                        :name="field.slug + '-button-target-' + field.id"
                                        placeholder="Target"
                                    />
                                    <FormInputField v-model="field.value.url" class="lg:col-span-12" label="Link" :name="field.slug + '-button-url-' + field.id" placeholder="Link" />
                                </div>
                            </div>
                        </template>

                        <!-- List -->
                        <template v-if="field.type === 'list'">
                            <div class="mt-3 intro-y">
                                <div class="flex items-center justify-between gap-5">
                                    <div class="opacity-75 form-label">{{ field.label }}</div>
                                    <div>
                                        <button v-if="canCreate" type="button" class="btn btn-sm btn-primary btn-rounded" @click="openModal(null, field.id)">
                                            <Icon name="solar:add-circle-outline" class="w-4 h-4 mr-2" />
                                            <span>Add New</span>
                                        </button>
                                    </div>
                                </div>
                                <div class="border border-slate-100 p-3 rounded-xl space-y-3 mt-3">
                                    <template v-for="(item, itemIndex) in field.value" :key="itemIndex">
                                        <div class="group bg-slate-50 hover:bg-slate-200/75 hover:scale-[101%] ease-in-out duration-300 rounded-xl p-3 grid lg:grid-cols-12 gap-5 items-center">
                                            <div class="lg:col-span-5">
                                                <div class="line-clamp-1 opacity-75">{{ item.title }}</div>
                                                <div v-if="item.url" class="mt-1 text-xs italic opacity-75 line-clamp-1">{{ item.url }}</div>
                                            </div>
                                            <div class="lg:col-span-3">
                                                <div class="text-xs">{{ buttonTargets.find((_) => _.id === item.target)?.name || '—' }}</div>
                                                <div :class="[item.active ? 'text-success' : 'text-danger', 'mt-1 text-xs font-semibold']">
                                                    {{ item.active ? 'Active' : 'Not Active' }}
                                                </div>
                                            </div>
                                            <div class="lg:col-span-4 flex items-center space-x-4">
                                                <button v-if="canUpdate" type="button" class="btn btn-sm group-hover:btn-dark btn-secondary grow" @click="openModal(item, field.id)">Update</button>
                                                <button v-if="canDelete" type="button" class="btn btn-sm btn-outline-danger" @click="removeItem(itemIndex, field.id)">
                                                    <Icon name="solar:close-circle-outline" class="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </template>
                                    <div v-if="!field.value?.length" class="text-center text-sm text-slate-500 py-4">No items added. Click "Add New" to get started.</div>
                                </div>
                            </div>
                        </template>

                        <!-- Datetime -->
                        <template v-if="field.type === 'datetime'">
                            <div>
                                <div class="form-label">{{ field.label }}</div>
                                <FormDatePicker v-model="field.value" class="mt-3" :auto-apply="true" :teleport="true" :time-picker-inline="true" format="dd-MM-yyyy - HH:mm" />
                            </div>
                        </template>

                        <!-- Datetime Range -->
                        <template v-if="field.type === 'datetime_range'">
                            <div>
                                <div class="form-label">{{ field.label }}</div>
                                <FormDatePicker v-model="field.value" range class="mt-3" :teleport="true" :auto-apply="true" :enable-time-picker="false" format="dd-MM-yyyy" />
                            </div>
                        </template>
                    </template>
                </div>

                <!-- Save Button -->
                <div>
                    <button :disabled="formLoading || !canUpdate" class="btn-rounded btn-sm btn btn-primary px-4 w-full" type="button" @click="handleModalSubmit()">
                        <Icon :name="formLoading ? 'svg-spinners:3-dots-fade' : 'solar:check-circle-broken'" class="w-5 h-5 mr-2" />
                        <span>Update Settings</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Loading State -->
        <div v-else class="flex items-center justify-center p-20">
            <Icon name="svg-spinners:3-dots-fade" class="size-10 text-primary" />
        </div>

        <!-- List Item Modal -->
        <TheModal :open-modal="isOpen" size="5xl" @close-modal="closeListModal">
            <template #header>
                <div class="flex justify-between items-center">
                    <div>
                        <div class="text-lg font-semibold text-slate-800">{{ editMode ? 'Update Item' : 'Add New Item' }}</div>
                        <div class="text-xs text-slate-500">{{ editMode ? 'Edit list item details' : 'Create a new list item' }}</div>
                    </div>
                    <Icon class="w-8 h-8 opacity-50 cursor-pointer hover:opacity-100 ease-in-out duration-300" name="solar:close-square-outline" @click="closeListModal" />
                </div>
            </template>
            <template #content>
                <div class="grid lg:grid-cols-12 gap-5 items-start">
                    <FormInputField v-model="listItem.title" :errors="listV$.title.$errors" class="lg:col-span-12" label="Title" name="list-item-title" placeholder="Enter title" />
                    <FormInputField v-model="listItem.url" class="lg:col-span-12" label="URL" name="list-item-url" placeholder="Enter URL (optional)" />
                    <FormSelectField v-model="listItem.target" labelvalue="name" keyvalue="id" :select-data="buttonTargets" class="lg:col-span-6" label="Target" name="list-item-target" placeholder="Select target" />
                    <FormSwitch v-model="listItem.active" class="lg:col-span-6" label="Active" name="list-item-active" />
                </div>
            </template>
            <template #footer>
                <div class="w-full flex items-center justify-end gap-5">
                    <button :disabled="formLoading" class="btn-rounded btn-sm btn btn-danger px-4" type="button" @click="closeListModal">
                        <Icon :name="formLoading ? 'svg-spinners:3-dots-fade' : 'solar:close-circle-linear'" class="w-5 h-5 mr-2" />
                        <span>Cancel</span>
                    </button>
                    <button :disabled="formLoading || (editMode ? !canUpdate : !canCreate)" class="btn-rounded btn-sm btn btn-primary px-4" type="button" @click="saveListItem">
                        <Icon :name="formLoading ? 'svg-spinners:3-dots-fade' : 'solar:check-circle-broken'" class="w-5 h-5 mr-2" />
                        <span>{{ editMode ? 'Update' : 'Save' }}</span>
                    </button>
                </div>
            </template>
        </TheModal>
    </div>
</template>
