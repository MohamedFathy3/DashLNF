<script setup>
import { email, required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';
const formLoading = ref(false);
const loadingModal = ref(true);
const editMode = ref(false);
const props = defineProps({
    personId: {
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
    passport: null,
    firstName: null,
    lastName: null,
    jobTitle: null,
    phoneNumber: null,
    cellNumber: null,
    email: null,
});
const rules = ref({
    id: {},
    title: { required },
    userId: { required },
    passport: { required },
    image: {},
    firstName: { required },
    lastName: { required },
    jobTitle: { required },
    phoneNumber: {},
    cellNumber: { required },
    email: { email },
});
const v$ = useVuelidate(rules, item);
const emit = defineEmits(['refresh', 'close']);
const resetPersonValues = async () => {
    item.value = {
        id: null,
        title: null,
        userId: null,
        image: null,
        passport: null,
        firstName: null,
        lastName: null,
        jobTitle: null,
        phoneNumber: null,
        cellNumber: null,
        email: null,
    };
};
async function closeModal() {
    emit('close');
    v$.value.$reset();
    await resetPersonValues();
    formLoading.value = false;
}
const fetchItem = async (id) => {
    const { data, error } = await useApiFetch(`/api/contact-people/${id}`);
    if (data.value) {
        item.value = data.value.data;
    }
    if (error.value) {
        useToast({ title: 'Error', message: data.value.message, type: 'error', duration: 5000 });
    }
};
async function updateItem() {
    const { data, error } = await useApiFetch(`/api/contact-people/${item.value.id}`, {
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
    const { data, error } = await useApiFetch(`/api/contact-people`, {
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
async function handleModalSubmit() {
    console.log('Before');
    formLoading.value = true;
    const result = await v$.value.$validate();
    console.log(v$.value);
    if (!result) {
        formLoading.value = false;
        return false;
    }
    console.log('here');
    if (editMode.value === true) {
        console.log('Update');
        await updateItem();
    } else {
        console.log('Add');
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
                <div class="lg:col-span-4 space-y-5">
                    <FormUploader v-model="item.image" :errors="v$.image.$errors" :allowed-types="['image']" label="Profile Image" name="image" />
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
                    <FormInputField v-model="item.firstName" :errors="v$.firstName.$errors" class="lg:col-span-4" label="First Name" name="first-name" placeholder="First Name" />
                    <FormInputField v-model="item.lastName" :errors="v$.lastName.$errors" class="lg:col-span-4" label="Last Name" name="last-name" placeholder="Last Name" />
                    <FormInputField v-model="item.jobTitle" :errors="v$.jobTitle.$errors" class="lg:col-span-6" label="Job Title" name="job-title" placeholder="Job Title" />
                    <FormInputField v-model="item.email" :errors="v$.email.$errors" class="lg:col-span-6" label="Email" name="email" placeholder="Email" />
                    <FormInputField v-model="item.phoneNumber" :errors="v$.phoneNumber.$errors" class="lg:col-span-6" label="Phone Number" name="person-phone-number" placeholder="Person Phone Number" />
                    <FormInputField v-model="item.cellNumber" :errors="v$.cellNumber.$errors" class="lg:col-span-6" label="Cell Number" name="person-cell-number" placeholder="Person Cell Number" />
                </div>
                <FormUploader v-model="item.passport" :errors="v$.passport.$errors" class="lg:col-span-12" :allowed-types="['image', 'document']" label="Passport" name="passport" />
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
