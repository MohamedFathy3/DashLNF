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
    open: {
        required: false,
        type: Boolean,
    },
});
const item = ref({
    title: null,
    name: null,
    email: null,
    unhashedPassword: null,
    jobTitle: null,
    tshirtSizeId: null,
    phone: null,
    cell: null,
    phoneKeyId: null,
    cellKeyId: null,
    extraDietaries: null,
    dietaries: [],
    image: null,
    bc: null,
});
const rules = ref({
    title: { required },
    name: { required },
    email: { required, email },
    unhashedPassword: {},
    jobTitle: {},
    tshirtSizeId: {},
    phone: {},
    cell: {},
    phoneKeyId: {},
    cellKeyId: {},
    extraDietaries: {},
    dietaries: {},
    image: {},
    bc: {},
});
const v$ = useVuelidate(rules, item);
const emit = defineEmits(['refresh', 'close']);
const resetPersonValues = async () => {
    item.value = {
        title: null,
        name: null,
        email: null,
        unhashedPassword: null,
        jobTitle: null,
        tshirtSizeId: null,
        phone: null,
        cell: null,
        phoneKeyId: null,
        cellKeyId: null,
        extraDietaries: null,
        dietaries: [],
        image: null,
        bc: null,
    };
};
async function closeModal() {
    emit('close');
    v$.value.$reset();
    await resetPersonValues();
    formLoading.value = false;
}
const fetchItem = async (id) => {
    const { data, error } = await useApiFetch(`/api/dashboard/delegate/${id}`);
    if (data.value) {
        item.value = data.value.data;
    }
    if (error.value) {
        useToast({ title: 'Error', message: data.value.message, type: 'error', duration: 5000 });
    }
};
async function updateItem() {
    const { data, error } = await useApiFetch(`/api/dashboard/delegate/${item.value?.id}`, {
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
async function resendPassword() {
    const { data, error } = await useApiFetch(`/api/event/email-reset-password`, {
        method: 'POST',
        body: {
            type: 'delegate',
            personId: item.value?.id,
        },
        lazy: true,
    });
    if (data.value) {
        useToast({ title: 'Success', message: data.value.message, type: 'success', duration: 5000 });
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
    }
}
onMounted(async () => {
    loadingModal.value = true;
    if (props.personId) {
        editMode.value = true;
        await fetchItem(props.personId);
    } else {
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
                    <FormInputField v-model="item.email" :errors="v$.email.$errors" class="lg:col-span-6" label="Email" name="email" placeholder="Email" />
                    <FormInputField v-model="item.unhashedPassword" :errors="v$.unhashedPassword.$errors" class="lg:col-span-6" label="Password" name="password" placeholder="Password" />
                    <FormSelectField v-model="item.tshirtSizeId" :errors="v$.tshirtSizeId.$errors" labelvalue="name" keyvalue="id" :select-data="resources.shirts" class="lg:col-span-6" name="shirt" placeholder="T-Shirt Size" label="T-Shirt Size" />
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
                <div class="lg:col-span-12">
                    <div class="form-label">Dietaries</div>
                    <fieldset :class="[v$.dietaries.$errors.length > 0 ? '!border-danger' : '', 'box !bg-opacity-50 shadow-sm p-4 grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3']">
                        <template v-for="dietary in resources.dietaries" :key="dietary.id">
                            <div class="relative flex items-center">
                                <div class="flex items-center h-6">
                                    <input
                                        :id="'package-' + dietary.id"
                                        v-model="item.dietaries"
                                        :checked="item.dietaries.includes(dietary.id)"
                                        :aria-describedby="'package-description'"
                                        :name="'sponsorship-item-' + dietary.id"
                                        :value="dietary.id"
                                        type="checkbox"
                                        class="focus:ring-primary h-5 w-5 rounded text-primary border-slate-500 disabled:read-only:opacity-50 disabled:read-only:cursor-not-allowed"
                                    />
                                </div>
                                <div :class="['ml-3 text-sm']">
                                    <label :class="['disabled:read-only:text-slate-400 whitespace-nowrap']" :for="'package-' + dietary.id" class="font-sm ease-in-out duration-150">
                                        <span>{{ dietary.name }}</span>
                                    </label>
                                </div>
                            </div>
                        </template>
                    </fieldset>
                    <template v-if="v$.dietaries.$errors.length > 0">
                        <ul class="mt-1">
                            <li v-for="(error, errorIndex) in v$.dietaries.$errors" :key="errorIndex" class="text-sm text-danger">{{ error.$message }}</li>
                        </ul>
                    </template>
                </div>
                <FormInputField v-model="item.extraDietaries" :errors="v$.extraDietaries.$errors" class="lg:col-span-12" label="Extra Dietaries" name="extraDietaries" placeholder="Extra Dietaries" />
                <FormUploader v-model="item.bc" :allowed-types="['image']" label="Business Card" name="bc" class="lg:col-span-12" />
            </div>
            <div v-else class="p-5 text-center animate-pulse">Loading Data...</div>
        </template>
        <template #footer>
            <div class="w-full flex items-center justify-between gap-5">
                <button :disabled="formLoading" class="btn-rounded btn-sm btn btn-warning px-4" type="button" @click="resendPassword">
                    <Icon :name="formLoading ? 'svg-spinners:3-dots-fade' : 'solar:circle-top-up-linear'" class="w-5 h-5 mr-2" />
                    <span>Resend Password</span>
                </button>
                <div class="flex items-center justify-end gap-5">
                    <button :disabled="formLoading" class="btn-rounded btn-sm btn btn-danger px-4" type="button" @click="closeModal">
                        <Icon :name="formLoading ? 'svg-spinners:3-dots-fade' : 'solar:close-circle-linear'" class="w-5 h-5 mr-2" />
                        <span>Close</span>
                    </button>
                    <button :disabled="formLoading" class="btn-rounded btn-sm btn btn-primary px-4" type="button" @click="handleModalSubmit">
                        <Icon :name="formLoading ? 'svg-spinners:3-dots-fade' : 'solar:check-circle-broken'" class="w-5 h-5 mr-2" />
                        <span v-html="'update'" />
                    </button>
                </div>
            </div>
        </template>
    </TheModal>
</template>
