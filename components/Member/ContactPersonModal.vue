<script setup>
import { email, required } from '@vuelidate/validators';
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
        default: false,
    },
    editMode: {
        type: Boolean,
        default: false,
    },
});

const item = ref({
    id: null,
    title: null,
    member_network_id: null,
    image: null,
    name: null,
    job_title: null,
    phone: null,
    cell_number: null,
    email: null,
    birth_date: null,
    phone_key_id: null,
});

const rules = ref({
    title: { required },
    name: { required },
    email: { required, email },
    job_title: { required },
    phone: { required },
    phone_key_id: { required },
    birth_date: {},
    cell_number: {},
});

const v$ = useVuelidate(rules, item);
const emit = defineEmits(['refresh', 'close']);

const resetPersonValues = async () => {
    item.value = {
        id: null,
        title: null,
        member_network_id: null,
        image: null,
        name: null,
        job_title: null,
        phone: null,
        cell_number: null,
        email: null,
        birth_date: null,
        phone_key_id: null,
    };
};

async function closeModal() {
    emit('close');
    v$.value?.$reset();
    await resetPersonValues();
    formLoading.value = false;
    loadingModal.value = true;
}

const fetchItem = async (id) => {
    loadingModal.value = true;
    const { data, error } = await useApiFetch(`/api/contact-person-network/${id}`, {
        lazy: true,
    });

    if (data.value) {
        const personData = data.value.data || data.value;
        item.value = {
            id: personData.id || null,
            title: personData.title || null,
            member_network_id: personData.member_network_id || null,
            image: personData.image || null,
            name: personData.name || null,
            job_title: personData.job_title || null,
            phone: personData.phone || null,
            cell_number: personData.cell_number || null,
            email: personData.email || null,
            birth_date: personData.birth_date || null,
            phone_key_id: personData.phone_key_id || null,
        };
        loadingModal.value = false;
    }

    if (error.value) {
        useToast({
            title: 'Error',
            message: error.value?.data?.message || error.value?.message || 'Failed to fetch data',
            type: 'error',
            duration: 5000,
        });
        loadingModal.value = false;
    }
};

async function updateItem() {
    const payload = {
        title: item.value.title,
        name: item.value.name,
        email: item.value.email,
        job_title: item.value.job_title,
        phone: item.value.phone,
        phone_key_id: item.value.phone_key_id || 1,
        cell_number: item.value.cell_number || null,
        birth_date: item.value.birth_date || null,
        image: item.value.image || null,
    };

    const { data, error } = await useApiFetch(`/api/contact-person-network/${item.value.id}`, {
        method: 'PUT',
        body: payload,
        lazy: true,
    });

    if (data.value) {
        useToast({
            title: 'Success',
            message: data.value?.message || 'Person updated successfully',
            type: 'success',
            duration: 5000,
        });
        formLoading.value = false;
        emit('refresh');
        await closeModal();
    }
    if (error.value) {
        useToast({
            title: 'Error',
            message: error.value?.data?.message || error.value?.message || 'Failed to update',
            type: 'error',
            duration: 5000,
        });
        formLoading.value = false;
    }
}

async function addItem() {
    const payload = {
        member_network_id: item.value.member_network_id || props.memberId,
        title: item.value.title,
        name: item.value.name,
        email: item.value.email,
        job_title: item.value.job_title,
        phone: item.value.phone,
        phone_key_id: item.value.phone_key_id || 1,
        cell_number: item.value.cell_number || null,
        birth_date: item.value.birth_date || null,
        image: item.value.image || null,
    };

    const { data, error } = await useApiFetch(`/api/contact-person-network`, {
        method: 'POST',
        body: payload,
        lazy: true,
    });

    if (data.value) {
        useToast({
            title: 'Success',
            message: data.value?.message || 'Person added successfully',
            type: 'success',
            duration: 5000,
        });
        formLoading.value = false;
        emit('refresh');
        await closeModal();
    }
    if (error.value) {
        useToast({
            title: 'Error',
            message: error.value?.data?.message || error.value?.message || 'Failed to add',
            type: 'error',
            duration: 5000,
        });
        formLoading.value = false;
    }
}

async function handleModalSubmit() {
    formLoading.value = true;
    const result = await v$.value.$validate();
    if (!result) {
        formLoading.value = false;
        useToast({
            title: 'Error',
            message: 'Please fill all required fields',
            type: 'error',
            duration: 5000,
        });
        return false;
    }

    if (editMode.value || props.editMode) {
        await updateItem();
    } else {
        await addItem();
    }
}

// مراقبة التغييرات في props.open
watch(
    () => props.open,
    (newVal) => {
        if (newVal && props.personId) {
            editMode.value = true;
            fetchItem(props.personId);
        } else if (newVal) {
            editMode.value = false;
            item.value.member_network_id = props.memberId;
            loadingModal.value = false;
        }
    },
    { immediate: true },
);
</script>

<template>
    <TheModal :open-modal="props.open" size="4xl" @close-modal="closeModal()">
        <template #header>
            <div class="flex justify-between items-center">
                <div class="font-medium text-lg">{{ editMode ? 'Update Contact Person' : 'Add New Contact Person' }}</div>
                <Icon class="w-8 h-8 opacity-50 cursor-pointer hover:opacity-100 ease-in-out duration-300" name="solar:close-square-outline" @click="closeModal" />
            </div>
        </template>
        <template #content>
            <div v-if="loadingModal" class="flex justify-center items-center py-20">
                <Icon name="svg-spinners:3-dots-fade" class="w-12 h-12 text-primary" />
            </div>
            <div v-else class="grid lg:grid-cols-12 gap-5 items-start">
                <!-- الصورة -->
                <div class="lg:col-span-4">
                    <FormUploader v-model="item.image" :errors="v$.image.$errors" :allowed-types="['image']" label="Profile Image" name="image" />
                </div>

                <!-- المعلومات الأساسية -->
                <div class="lg:col-span-8 grid lg:grid-cols-12 gap-5 items-start">
                    <FormSelectField
                        v-model="item.title"
                        :errors="v$.title.$errors"
                        labelvalue="name"
                        keyvalue="value"
                        :select-data="[
                            { name: 'Mr', value: 'mr' },
                            { name: 'Mrs', value: 'mrs' },
                            { name: 'Ms', value: 'ms' },
                            { name: 'Dr', value: 'dr' },
                            { name: 'Prof', value: 'prof' },
                        ]"
                        class="lg:col-span-4"
                        label="Title *"
                        name="person-title"
                        placeholder="Title"
                        required
                    />
                    <FormInputField v-model="item.name" :errors="v$.name.$errors" class="lg:col-span-8" label="Full Name *" name="full-name" placeholder="Full Name" required />
                    <FormInputField v-model="item.job_title" :errors="v$.job_title.$errors" class="lg:col-span-6" label="Job Title *" name="job-title" placeholder="Job Title" required />
                    <FormInputField v-model="item.email" :errors="v$.email.$errors" class="lg:col-span-6" label="Email *" name="email" placeholder="Email" type="email" required />
                    <FormInputField v-model="item.birth_date" :errors="v$.birth_date.$errors" class="lg:col-span-12" label="Birth Date" name="birth-date" placeholder="Birth Date" type="date" />
                </div>

                <!-- رقم الهاتف -->
                <div class="lg:col-span-12 grid lg:grid-cols-12 gap-5">
                    <FormSelectField
                        v-model="item.phone_key_id"
                        :errors="v$.phone_key_id.$errors"
                        labelvalue="key"
                        keyvalue="id"
                        imgvalue="imageUrl"
                        :select-data="resources.countries"
                        class="lg:col-span-3"
                        label="Phone Key *"
                        name="phone-key"
                        placeholder="Phone Key"
                        prefix="+"
                        required
                    />
                    <FormInputField v-model="item.phone" :errors="v$.phone.$errors" class="lg:col-span-9" label="Phone Number *" name="phone" placeholder="Phone Number" required />
                </div>

                <!-- رقم المحمول -->
                <div class="lg:col-span-12 grid lg:grid-cols-12 gap-5">
                    <div class="lg:col-span-3">
                        <span class="text-xs opacity-50">Cell Key</span>
                        <div class="text-sm text-slate-400 mt-1">Optional</div>
                    </div>
                    <FormInputField v-model="item.cell_number" :errors="v$.cell_number.$errors" class="lg:col-span-9" label="Cell Number" name="cell-number" placeholder="Cell Number (Optional)" />
                </div>
            </div>
        </template>
        <template #footer>
            <div class="w-full flex items-center justify-end gap-5">
                <button :disabled="formLoading" class="btn-rounded btn-sm btn btn-danger px-4" type="button" @click="closeModal">
                    <Icon :name="formLoading ? 'svg-spinners:3-dots-fade' : 'solar:close-circle-linear'" class="w-5 h-5 mr-2" />
                    <span>Cancel</span>
                </button>
                <button :disabled="formLoading" class="btn-rounded btn-sm btn btn-primary px-4" type="button" @click="handleModalSubmit">
                    <Icon :name="formLoading ? 'svg-spinners:3-dots-fade' : 'solar:check-circle-broken'" class="w-5 h-5 mr-2" />
                    <span>{{ editMode ? 'Update' : 'Save' }}</span>
                </button>
            </div>
        </template>
    </TheModal>
</template>
