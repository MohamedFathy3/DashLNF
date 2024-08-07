<script setup>
import { email, required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';
const formLoading = ref(false);
const loadingModal = ref(true);
const editMode = ref(false);
const resources = useResourceStore();
const props = defineProps({
    referenceId: {
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
    name: null,
    email: null,
    person: null,
    jobTitle: null,
    city: null,
    countryId: null,
    userId: null,
});
const rules = ref({
    id: {},
    name: { required },
    email: { required, email },
    person: {},
    jobTitle: {},
    city: {},
    countryId: { required },
    userId: {},
});
const v$ = useVuelidate(rules, item);
const emit = defineEmits(['refresh', 'close']);
const resetPersonValues = async () => {
    item.value = {
        id: null,
        name: null,
        email: null,
        person: null,
        jobTitle: null,
        city: null,
        countryId: null,
        userId: null,
    };
};
async function closeModal() {
    emit('close');
    v$.value.$reset();
    await resetPersonValues();
    formLoading.value = false;
}
const fetchItem = async (id) => {
    const { data, error } = await useApiFetch(`/api/trade-reference/${id}`);
    if (data.value) {
        item.value = data.value.data;
    }
    if (error.value) {
        useToast({ title: 'Error', message: data.value.message, type: 'error', duration: 5000 });
    }
};
async function updateItem() {
    const { data, error } = await useApiFetch(`/api/trade-reference/${item.value.id}`, {
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
    const { data, error } = await useApiFetch(`/api/trade-reference`, {
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
    if (props.referenceId) {
        editMode.value = true;
        await fetchItem(props.referenceId);
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
                <FormInputField v-model="item.person" :errors="v$.person.$errors" class="lg:col-span-6" label="Person" name="person" placeholder="Person" />
                <FormInputField v-model="item.jobTitle" :errors="v$.jobTitle.$errors" class="lg:col-span-6" label="Job Title" name="job-title" placeholder="Job Title" />
                <FormInputField v-model="item.email" :errors="v$.email.$errors" class="lg:col-span-6" label="Email" name="email" placeholder="Email" />
                <FormInputField v-model="item.name" :errors="v$.name.$errors" class="lg:col-span-6" label="Company" name="company-name" placeholder="Company" />
                <FormSelectField
                    v-model="item.countryId"
                    labelvalue="name"
                    keyvalue="id"
                    imgvalue="imageUrl"
                    :select-data="resources.countries"
                    :errors="v$.countryId.$errors"
                    class="lg:col-span-6"
                    label="Country"
                    name="reference-country"
                    placeholder="Country"
                />
                <FormInputField v-model="item.city" :errors="v$.city.$errors" class="lg:col-span-6" label="City" name="city" placeholder="City" />
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
