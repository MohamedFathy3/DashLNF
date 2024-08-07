<script setup>
import { required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';
const formLoading = ref(false);
const loadingModal = ref(true);
const editMode = ref(false);
const resources = useResourceStore();
const props = defineProps({
    personId: {
        type: Number,
        default: null,
    },
    memberId: {
        type: Number,
        default: null,
    },
    open: {
        required: false,
        type: Boolean,
    },
});
const item = ref({
    id: null,
    title: null,
    userId: null,
    image: null,
    name: null,
    email: null,
    birthDate: null,
    jobTitle: null,
    phoneKeyId: null,
    phone: null,
    cellKeyId: null,
    cell: null,
});
const rules = ref({
    id: {},
    title: { required },
    userId: { required },
    image: {},
    name: { required },
    email: { required },
    birthDate: {},
    jobTitle: { required },
    phoneKeyId: {},
    phone: {},
    cellKeyId: {},
    cell: {},
});
const v$ = useVuelidate(rules, item);
const emit = defineEmits(['refresh', 'close']);
const resetPersonValues = async () => {
    item.value = {
        id: null,
        title: null,
        userId: null,
        image: null,
        name: null,
        email: null,
        birthDate: null,
        jobTitle: null,
        phoneKeyId: null,
        phone: null,
        cellKeyId: null,
        cell: null,
    };
};
async function closeModal() {
    emit('close');
    v$.value.$reset();
    await resetPersonValues();
    formLoading.value = false;
}
const fetchItem = async (id) => {
    const { data, error } = await useApiFetch(`/api/contact-person/${id}`);
    if (data.value) {
        item.value = data.value.data;
    }
    if (error.value) {
        useToast({ title: 'Error', message: data.value.message, type: 'error', duration: 5000 });
    }
};
async function updateItem() {
    const { data, error } = await useApiFetch(`/api/contact-person/${item.value.id}`, {
        method: 'PATCH',
        body: item,
        lazy: true,
    });
    if (data.value) {
        useToast({ title: 'Success', message: data.value.message, type: 'success', duration: 5000 });
        emit('refresh');
        await closeModal();
    }
    if (error.value) {
        useToast({ title: 'Error', message: data.value.message, type: 'error', duration: 5000 });
    }
}
async function addItem() {
    const { data, error } = await useApiFetch(`/api/contact-person`, {
        method: 'POST',
        body: item,
        lazy: true,
    });
    if (data.value) {
        useToast({ title: 'Success', message: data.value.message, type: 'success', duration: 5000 });
        emit('refresh');
        await closeModal();
    }
    if (error.value) {
        useToast({ title: 'Error', message: data.value.message, type: 'error', duration: 5000 });
    }
}
const { data: activeMembers } = await useApiFetch(`/api/get/member`, {
    method: 'POST',
    body: {
        type: 'all',
    },
    lazy: true,
});
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
onMounted(async () => {
    loadingModal.value = true;
    if (props.personId) {
        editMode.value = true;
        await fetchItem(props.personId);
    } else {
        item.value.userId = props.memberId;
        editMode.value = false;
    }
    loadingModal.value = false;
});
</script>
<template>
    <TheModal :open-modal="props.open" size="5xl" @close-modal="closeModal()">
        <template #header>
            <div class="flex justify-between items-center">
                <div class="font-medium" v-html="editMode ? 'Update Person Details' : 'Add New Person'"></div>
                <Icon class="w-8 h-8 opacity-50 cursor-pointer hover:opacity-100 ease-in-out duration-300" name="solar:close-square-outline" @click="closeModal" />
            </div>
        </template>
        <template #content>
            <div v-if="!loadingModal" class="grid lg:grid-cols-12 gap-5 items-start">
                <div class="lg:col-span-4">
                    <FormUploader v-model="item.image" :allowed-types="['image']" label="Profile Image" name="image" />
                </div>
                <div class="lg:col-span-8 grid lg:grid-cols-12 gap-5 items-center">
                    <FormSelectField
                        v-model="item.title"
                        :errors="v$.title.$errors"
                        labelvalue="name"
                        keyvalue="value"
                        :select-data="[
                            { name: 'Mr', value: 'mr' },
                            { name: 'Mrs', value: 'mrs' },
                            { name: 'Ms', value: 'ms' },
                        ]"
                        class="lg:col-span-4"
                        label="Title"
                        name="person-title"
                        placeholder="Title"
                    />
                    <FormInputField v-model="item.name" :errors="v$.name.$errors" class="lg:col-span-8" label="Name" name="name" placeholder="Name" />
                    <FormInputField v-model="item.jobTitle" :errors="v$.jobTitle.$errors" class="lg:col-span-6" label="Job Title" name="job-title" placeholder="Job Title" />
                    <FormDatePicker v-model="item.birthDate" :time-picker="false" :errors="v$.birthDate.$errors" class="lg:col-span-6" label="Birth Date" name="birth-date" />
                    <FormInputField v-model="item.email" :errors="v$.email.$errors" class="lg:col-span-6" label="Email" name="email" placeholder="Email" />
                    <FormSelectField
                        v-model="item.userId"
                        :errors="v$.userId.$errors"
                        labelvalue="name"
                        secondlabelvalue="countryName"
                        thirdlabelvalue="city"
                        imgvalue="imageUrl"
                        keyvalue="id"
                        :select-data="activeMembers.data"
                        class="lg:col-span-6"
                        name="member"
                        placeholder="Member"
                        label="Member"
                    />
                </div>
                <FormSelectField
                    v-model="item.phoneKeyId"
                    labelvalue="key"
                    keyvalue="id"
                    imgvalue="imageUrl"
                    :select-data="resources.countries"
                    :errors="v$.phoneKeyId.$errors"
                    prefix="+"
                    class="lg:col-span-3"
                    label="Country Key"
                    name="person-phone-key"
                    placeholder="Country Key"
                />
                <FormInputField v-model="item.phone" :errors="v$.phone.$errors" class="lg:col-span-3" label="Phone Number" name="person-phone-number" placeholder="Company Phone Number" />
                <FormSelectField
                    v-model="item.cellKeyId"
                    labelvalue="key"
                    keyvalue="id"
                    imgvalue="imageUrl"
                    :select-data="resources.countries"
                    :errors="v$.cellKeyId.$errors"
                    prefix="+"
                    class="lg:col-span-3"
                    label="Country Key"
                    name="person-cell-key"
                    placeholder="Country Key"
                />
                <FormInputField v-model="item.cell" :errors="v$.cell.$errors" class="lg:col-span-3" label="Cell Number" name="person-cell-number" placeholder="Company Cell Number" />
            </div>
            <div v-else class="p-5 text-center animate-pulse">Loading Data...</div>
        </template>
        <template #footer>
            <div class="w-full flex items-center justify-end gap-5">
                <button :disabled="formLoading" class="btn-rounded btn-sm btn btn-danger px-4" type="button" @click="closeModal">
                    <Icon :name="formLoading ? 'svg-spinners:3-dots-fade' : 'solar:close-circle-linear'" class="w-5 h-5 mr-2" />
                    <span>Close</span>
                </button>
                <button :disabled="formLoading" class="btn-rounded btn-sm btn btn-primary px-4" type="button" @click="handleModalSubmit">
                    <Icon :name="formLoading ? 'svg-spinners:3-dots-fade' : 'solar:check-circle-broken'" class="w-5 h-5 mr-2" />
                    <span v-html="'update'" />
                </button>
            </div>
        </template>
    </TheModal>
</template>
