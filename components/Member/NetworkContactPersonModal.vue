<script setup>
import { email, required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';

const props = defineProps({
    open: { type: Boolean, default: false },
    personId: { type: Number, default: null },
    networkId: { type: Number, required: true },
});
const emit = defineEmits(['close', 'refresh']);
const formLoading = ref(false);
const loadingModal = ref(false);
const isEditMode = computed(() => Boolean(props.personId));
const item = ref({
    title: 'mr',
    first_name: '',
    last_name: '',
    job_title: '',
    email: '',
    phone_number: '',
    cell_number: '',
    image: null,
    passport: null,
});
const rules = {
    title: { required },
    first_name: { required },
    last_name: { required },
    job_title: { required },
    email: { required, email },
    phone_number: { required },
};
const v$ = useVuelidate(rules, item);

const resetItem = () => {
    item.value = {
        title: 'mr',
        first_name: '',
        last_name: '',
        job_title: '',
        email: '',
        phone_number: '',
        cell_number: '',
        image: null,
        passport: null,
    };
};

const closeModal = () => {
    emit('close');
    v$.value.$reset();
    resetItem();
    formLoading.value = false;
    loadingModal.value = false;
};

const fetchItem = async (id) => {
    loadingModal.value = true;
    const { data, error } = await useApiFetch(`/api/contact-people/${id}`);
    const person = data.value?.data || data.value;
    if (person) {
        item.value = {
            title: person.title || 'mr',
            first_name: person.firstName || person.first_name || '',
            last_name: person.lastName || person.last_name || '',
            job_title: person.jobTitle || person.job_title || '',
            email: person.email || '',
            phone_number: person.phoneNumber || person.phone_number || person.phone || '',
            cell_number: person.cellNumber || person.cell_number || '',
            image: person.image || null,
            passport: person.passport || null,
        };
    }
    if (error.value) {
        useToast({ title: 'Error', message: error.value?.data?.message || error.value?.message || 'Failed to load contact person', type: 'error', duration: 5000 });
    }
    loadingModal.value = false;
};

const submit = async () => {
    formLoading.value = true;
    const valid = await v$.value.$validate();
    if (!valid) {
        formLoading.value = false;
        useToast({ title: 'Error', message: 'Please fill all required fields', type: 'error', duration: 5000 });
        return;
    }

    const payload = {
        user_id: props.networkId,
        title: item.value.title,
        first_name: item.value.first_name,
        last_name: item.value.last_name,
        job_title: item.value.job_title,
        email: item.value.email,
        phone_number: item.value.phone_number,
        cell_number: item.value.cell_number || null,
        image: typeof item.value.image === 'object' ? item.value.image?.id : item.value.image,
        passport: typeof item.value.passport === 'object' ? item.value.passport?.id : item.value.passport,
    };
    const url = isEditMode.value ? `/api/contact-people/${props.personId}` : '/api/contact-people';
    const { data, error } = await useApiFetch(url, { method: isEditMode.value ? 'PUT' : 'POST', body: payload });
    if (data.value) {
        useToast({ title: 'Success', message: data.value.message || 'Contact person saved successfully', type: 'success', duration: 5000 });
        emit('refresh');
        closeModal();
    }
    if (error.value) {
        useToast({ title: 'Error', message: error.value?.data?.message || error.value?.message || 'Failed to save contact person', type: 'error', duration: 5000 });
    }
    formLoading.value = false;
};

watch(
    () => props.open,
    (open) => {
        if (!open) return;
        if (props.personId) fetchItem(props.personId);
        else {
            resetItem();
            loadingModal.value = false;
        }
    },
    { immediate: true },
);
</script>

<template>
    <TheModal :open-modal="props.open" size="4xl" @close-modal="closeModal">
        <template #header>
            <div class="flex justify-between items-center">
                <div class="font-medium text-lg">{{ isEditMode ? 'Update Contact Person' : 'Add Contact Person' }}</div>
                <Icon name="solar:close-square-outline" class="w-8 h-8 opacity-50 cursor-pointer" @click="closeModal" />
            </div>
        </template>
        <template #content>
            <div v-if="loadingModal" class="flex justify-center py-20"><Icon name="svg-spinners:3-dots-fade" class="w-12 h-12 text-primary" /></div>
            <div v-else class="grid lg:grid-cols-12 gap-5">
                <div class="lg:col-span-4 flex flex-col gap-5">
                    <FormUploader v-model="item.image" :allowed-types="['image']" label="Profile Image" name="network-contact-image" />
                    <FormUploader v-model="item.passport" :allowed-types="['image']" label="Passport Image" name="network-contact-passport" />
                </div>
                <div class="lg:col-span-8 grid lg:grid-cols-12 gap-5">
                    <FormSelectField v-model="item.title" :select-data="[{ name: 'Mr', value: 'mr' }, { name: 'Mrs', value: 'mrs' }, { name: 'Ms', value: 'ms' } ]" labelvalue="name" keyvalue="value" :errors="v$.title.$errors" class="lg:col-span-4" label="Title" name="network-contact-title" required />
                    <FormInputField v-model="item.first_name" :errors="v$.first_name.$errors" class="lg:col-span-4" label="First Name" name="network-contact-first-name" required />
                    <FormInputField v-model="item.last_name" :errors="v$.last_name.$errors" class="lg:col-span-4" label="Last Name" name="network-contact-last-name" required />
                    <FormInputField v-model="item.job_title" :errors="v$.job_title.$errors" class="lg:col-span-6" label="Job Title" name="network-contact-job-title" required />
                    <FormInputField v-model="item.email" :errors="v$.email.$errors" class="lg:col-span-6" label="Email" name="network-contact-email" type="email" required />
                    <FormInputField v-model="item.phone_number" :errors="v$.phone_number.$errors" class="lg:col-span-12" label="Phone Number" name="network-contact-phone-number" required />
                    <FormInputField v-model="item.cell_number" class="lg:col-span-12" label="Cell Number" name="network-contact-cell" />
                </div>
            </div>
        </template>
        <template #footer>
            <div class="w-full flex justify-end gap-5">
                <button class="btn-rounded btn-sm btn btn-danger px-4" type="button" :disabled="formLoading" @click="closeModal">Cancel</button>
                <button class="btn-rounded btn-sm btn btn-primary px-4" type="button" :disabled="formLoading" @click="submit">{{ isEditMode ? 'Update' : 'Save' }}</button>
            </div>
        </template>
    </TheModal>
</template>
