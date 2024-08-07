<script setup>
import { ColorPicker } from 'vue3-colorpicker';

definePageMeta({
    middleware: 'auth',
});
const { data, refresh, execute } = await useApiFetch(`/api/setting/sections`, {
    lazy: true,
    immediate: false,
    transform: (data) => data.data,
});
const loadingPage = ref(true);
const formLoading = ref(false);
const editMode = ref(false);
const fieldItemId = ref(null);
const selectedSection = ref([]);

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
    selectedSection.value = data.value[0];
    loadingPage.value = false;
});
const isOpen = ref(false);

async function openModal(item, fieldId) {
    formLoading.value = true;
    if (item) {
        fieldItemId.value = fieldId;
        editMode.value = true;
        item.value = item;
    } else {
        editMode.value = false;
    }
    formLoading.value = false;
    isOpen.value = true;
}
const removeItem = (index, id) => {
    selectedSection.value.children.find((_) => _.id === id).value.splice(index, 1);
};

const handleModalSubmit = async () => {
    const childrenValue = selectedSection.value.children.map((child) => {
        let settingValue = child.value;
        if (child.type === 'uploader') {
            if (typeof child.image === 'object') {
                settingValue = child.image.id;
            } else if (typeof child.image === 'number') {
                settingValue = child.image;
            }
        }
        return {
            id: child.id,
            type: child.type,
            value: child.type !== 'uploader' ? settingValue : null,
            image: child.type === 'uploader' ? settingValue : null,
        };
    });
    console.log(childrenValue);

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
    }
    if (error.value) {
        useToast({ title: 'Error', message: data.value.message, type: 'error', duration: 5000 });
    }
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
        useToast({ title: 'Error', message: data.value.message, type: 'error', duration: 5000 });
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
        useToast({ title: 'Error', message: data.value.message, type: 'error', duration: 5000 });
    }
};
onMounted(async () => {
    await fetchMenus();
    await fetchEmailTemplates();
});
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
                <Icon name="solar:settings-outline" class="size-5 opacity-75" />
                <div>Update Settings</div>
            </div>
        </div>
        <div v-if="!loadingPage" class="grid gap-5 lg:grid-cols-12 text-sm">
            <div class="lg:col-span-4">
                <ul class="space-y-2 p-5 bg-white rounded-2xl">
                    <template v-for="(section, index) in data" :key="section.id">
                        <li>
                            <button :class="[section.id === selectedSection.id ? 'btn-primary' : 'btn-secondary', 'btn  btn-rounded w-full justify-start hover:gap-6 gap-3 transition-all shadow-none']" @click="setSelectedSection(index)">
                                <Icon name="solar:double-alt-arrow-right-line-duotone" class="size-5 opacity-75" />
                                {{ section.label }}
                            </button>
                        </li>
                    </template>
                </ul>
            </div>

            <div class="lg:col-span-8 bg-white rounded-2xl p-5 flex flex-col gap-5 h-full justify-between">
                <div class="grow flex flex-col gap-5">
                    <template v-for="field in selectedSection.children" :key="field.id">
                        <template v-if="field.type === 'text' || field.type === 'number' || field.type === 'textarea'">
                            <FormInputField v-model="field.value" :label="field.label" class="intro-y" :name="field.name" :type="field.type" :placeholder="field.placeholder" />
                        </template>
                        <template v-if="field.type === 'boolean'">
                            <FormSwitch v-model.number="field.value" :des="field.des" :label="field.label" :name="field.name" class="intro-y" />
                        </template>
                        <template v-if="field.type === 'select'">
                            <FormSelectField v-model.number="field.value" class="intro-y" labelvalue="name" keyvalue="id" :select-data="getSelectData(field.data)" :label="field.label" :name="field.name" :placeholder="field.placeholder" />
                        </template>
                        <template v-if="field.type === 'uploader'">
                            <FormUploader v-model="field.image" :label="field.label" class="intro-y" :name="field.name" :max="1" :allowed-types="['image', 'svg']" />
                        </template>
                        <template v-if="field.type === 'color-picker'">
                            <div class="flex justify-between gap-6">
                                <div class="form-label">{{ field.label }}</div>
                                <ColorPicker v-model:pureColor="field.value" picker-type="chrome" format="rgb" shape="square" lang="En" :debounce="1" picker-container="div" />
                            </div>
                        </template>
                        <template v-if="field.type === 'button'">
                            <div class="intro-y">
                                <div class="form-label opacity-75">{{ field.label }}</div>
                                <div class="mt-3 rounded-xl p-5 border border-slate-100 grid grid-cols-12 gap-5 bg-slate-50">
                                    <FormInputField v-model="field.value.label" class="col-span-12 lg:col-span-6" label="label" :name="field.slug + '-button-label-' + field.id" placeholder="label" />
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
                        <template v-if="field.type === 'list'">
                            <div class="mt-3 intro-y">
                                <div class="flex items-center justify-between gap-5">
                                    <div class="opacity-75 form-label">{{ field.label }}</div>
                                    <div>
                                        <button type="button" class="btn btn-sm btn-primary btn-rounded" @click="openModal()">
                                            <Icon name="solar:add-circle-outline" class="w-4 h-4 mr-2" />
                                            <span>Add New</span>
                                        </button>
                                    </div>
                                </div>
                                <div class="border border-slate-100 p-3 rounded-xl space-y-3 mt-3">
                                    <template v-for="(item, itemIndex) in field.value" :key="itemIndex">
                                        <div v-if="field.data === 'menu'" class="group bg-slate-50 hover:bg-slate-200/75 hover:scale-[101%] ease-in-out duration-300 rounded-xl p-3 grid lg:grid-cols-12 gap-5 items-center">
                                            <div class="lg:col-span-5">
                                                <div class="line-clamp-1 opacity-75">{{ item.title }}</div>
                                                <div v-if="item.url" class="mt-1 text-xs italic opacity-75 line-clamp-1">{{ item.url }}</div>
                                            </div>
                                            <div class="lg:col-span-3">
                                                <div class="text-xs">{{ buttonTargets.find((_) => _.id === item.target).name }}</div>
                                                <div :class="[item.active ? 'text-success' : 'text-danger', 'mt-1 text-xs font-semibold']" v-html="item.active ? 'Active' : 'Not Active'" />
                                            </div>
                                            <div class="lg:col-span-4 flex items-center space-x-4">
                                                <button type="button" class="btn btn-sm group-hover:btn-dark btn-secondary grow" @click="openModal(item, field.id)">Update</button>
                                                <button type="button" class="btn btn-sm btn-outline-danger" @click="removeItem(itemIndex, field.id)">
                                                    <Icon name="solar:close-circle-outline" class="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <div v-else-if="field.data === 'list'" class="group bg-slate-50 hover:bg-slate-200/75 hover:scale-[101%] ease-in-out duration-300 rounded-xl p-3 grid lg:grid-cols-12 gap-5 items-center">
                                            <div class="lg:col-span-5">
                                                <div class="line-clamp-1 opacity-75">{{ item.title }}</div>
                                            </div>
                                            <div class="lg:col-span-2">
                                                <div :class="[item.active ? 'text-success' : 'text-danger', 'mt-1 text-xs font-semibold']" v-html="item.active ? 'Active' : 'Not Active'" />
                                            </div>
                                            <div class="lg:col-span-5 flex items-center space-x-4">
                                                <button type="button" class="btn btn-sm btn-rounded btn-secondary grow" @click="openModal(item, field.id)">Update</button>
                                                <button type="button" class="btn-sm hover:text-danger text-danger/75 transition-all btn-rounded aspect-1/1" @click="removeItem(itemIndex, field.id)">
                                                    <Icon name="solar:close-circle-outline" class="size-5" />
                                                </button>
                                            </div>
                                        </div>
                                        <div v-else-if="field.data === 'table'" class="group bg-slate-50 hover:bg-slate-200/75 hover:scale-[101%] ease-in-out duration-300 rounded-xl p-3 grid lg:grid-cols-12 gap-5 items-center">
                                            <div class="lg:col-span-5">
                                                <div class="line-clamp-1 opacity-75">{{ item.title }}</div>
                                                <div class="mt-1 font-light line-clamp-1 text-xs">{{ item.target }}</div>
                                            </div>
                                            <div class="lg:col-span-2">
                                                <div :class="[item.active ? 'text-success' : 'text-danger', 'mt-1 text-xs font-semibold']" v-html="item.active ? 'Active' : 'Not Active'" />
                                            </div>
                                            <div class="lg:col-span-5 flex items-center space-x-4">
                                                <button type="button" class="btn btn-sm btn-rounded btn-secondary grow" @click="openModal(item, field.id)">Update</button>
                                                <button type="button" class="btn-sm hover:text-danger text-danger/75 transition-all btn-rounded aspect-1/1" @click="removeItem(itemIndex, field.id)">
                                                    <Icon name="solar:close-circle-outline" class="size-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </template>
                                </div>
                            </div>
                        </template>
                        <template v-if="field.type === 'datetime'">
                            <div>
                                <div>{{ field.label }}</div>
                                <FormDatePicker v-model="field.value" class="mt-3" :auto-apply="true" :teleport="true" :time-picker-inline="true" format="dd-MM-yyyy - HH:mm" />
                            </div>
                        </template>
                        <template v-if="field.type === 'datetime_range'">
                            <div>
                                <div>{{ field.label }}</div>
                                <FormDatePicker v-model="field.value" range class="mt-3" :teleport="true" :auto-apply="true" :enable-time-picker="false" format="dd-MM-yyyy" />
                            </div>
                        </template>
                    </template>
                </div>
                <div>
                    <button :disabled="formLoading" class="btn-rounded btn-sm btn btn-primary px-4 w-full" type="button" @click="handleModalSubmit()">
                        <Icon :name="formLoading ? 'svg-spinners:3-dots-fade' : 'solar:check-circle-broken'" class="w-5 h-5 mr-2" />
                        <span v-html="'Update'" />
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
