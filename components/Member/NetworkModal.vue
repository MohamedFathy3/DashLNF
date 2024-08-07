<script setup>
import { required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';
const formLoading = ref(false);
const props = defineProps({
    network: {
        required: true,
        type: Object,
        default: () => null,
    },
    memberId: {
        required: true,
        type: Number,
    },
    open: {
        required: false,
        type: Boolean,
    },
});
const item = ref({
    networkId: props.network?.id ?? null,
    userId: props.memberId,
    type: props.network?.type ?? null,
    status: props.network?.status ?? null,
    active: props.network?.active ?? false,
    network: props.network?.network ?? false,
    fpp: props.network?.fpp ?? false,
    startDate: props.network?.startDate ?? null,
    expireDate: props.network?.expireDate ?? null,
});
onMounted(() => {
    if (props.network !== null) {
        item.value.networkId = props.network?.id;
        item.value.userId = props.memberId;
        item.value.type = props.network?.type;
        item.value.status = props.network?.status;
        item.value.active = props.network?.active;
        item.value.network = props.network?.network;
        item.value.fpp = props.network?.fpp;
        item.value.startDate = props.network?.startDate;
        item.value.expireDate = props.network?.expireDate;
    }
});
const rules = ref({
    networkId: { required },
    type: { required },
    userId: {},
    status: { required },
    active: {},
    network: {},
    fpp: {},
    startDate: {},
    expireDate: {},
});
const v$ = useVuelidate(rules, item);
const emit = defineEmits(['refresh', 'close']);
const resetNetworkValues = async () => {
    item.value = {
        networkId: null,
        userId: props.memberId,
        type: null,
        status: null,
        active: false,
        network: false,
        fpp: false,
        startDate: null,
        expireDate: null,
    };
};
async function closeModal() {
    emit('close');
    v$.value.$reset();
    await resetNetworkValues();
    formLoading.value = false;
}
const membershipStatues = ref([
    { name: 'Pending', value: 'pending' },
    { name: 'Approved', value: 'approved' },
    { name: 'Suspended', value: 'suspended' },
    { name: 'Blacklisted', value: 'blacklisted' },
]);
const membershipTypes = ref([
    { name: 'Member', value: 'member' },
    { name: 'Founder', value: 'founder' },
    { name: 'Partner', value: 'partner' },
    { name: 'Vendor', value: 'vendor' },
    { name: 'Non Member', value: 'non_member' },
    { name: 'LNF Team', value: 'wsa_team' },
]);
const settings = useSettingsStore();
async function updateNetwork() {
    formLoading.value = true;
    const result = await v$.value.$validate();
    if (!result) {
        formLoading.value = false;
        useToast({ title: 'Error', message: 'Please complete all required fields', type: 'error', duration: 5000 });
        return false;
    }
    const { data, error } = await useApiFetch(`/api/user/update-active-network/${props.memberId}`, {
        lazy: true,
        method: 'PATCH',
        body: item,
    });

    if (data.value) {
        useToast({ title: 'Success', message: data.value.message, type: 'success', duration: 5000 });
        emit('refresh');
        await closeModal();
        formLoading.value = false;
    }
    if (error.value) {
        useToast({ title: 'Error', message: data.value.message ?? data.value.data.message, type: 'error', duration: 5000 });
        formLoading.value = false;
    }
}
</script>
<template>
    <TheModal :open-modal="props.open" size="5xl" @close-modal="closeModal()">
        <template #header>
            <div class="flex justify-between items-center">
                <div class="font-medium" v-html="'Update Network Details'"></div>
                <Icon class="w-8 h-8 opacity-50 cursor-pointer hover:opacity-100 ease-in-out duration-300" name="solar:close-square-outline" @click="closeModal" />
            </div>
        </template>
        <template #content>
            <div class="grid lg:grid-cols-12 gap-5">
                <FormSelectField
                    v-model="item.networkId"
                    :errors="v$.networkId.$errors"
                    labelvalue="name"
                    keyvalue="id"
                    :select-data="settings.networks"
                    class="lg:col-span-12"
                    label="Network"
                    name="network-name"
                    placeholder="Please select a network..."
                />
                <FormSelectField v-model="item.type" :errors="v$.type.$errors" labelvalue="name" keyvalue="value" :select-data="membershipTypes" class="lg:col-span-6" label="Type" name="network-membership-type" placeholder="Membership Type" />
                <FormSelectField
                    v-model="item.status"
                    :errors="v$.status.$errors"
                    labelvalue="name"
                    keyvalue="value"
                    :select-data="membershipStatues"
                    class="lg:col-span-6"
                    label="Status"
                    name="network-membership-status"
                    placeholder="Membership Status"
                />
                <FormSwitch v-model="item.active" label="Can login (Active)" class="lg:col-span-4" />
                <FormSwitch v-model="item.network" label="Show in Network" class="lg:col-span-4" />
                <FormSwitch v-model="item.fpp" label="FPP" class="lg:col-span-4" />
                <FormDatePicker v-model="item.startDate" :time-picker="false" :errors="v$.startDate.$errors" class="lg:col-span-6" label="Start Date" name="start-date" />
                <FormDatePicker v-model="item.expireDate" :time-picker="false" :errors="v$.expireDate.$errors" class="lg:col-span-6" label="End Date" name="end-date" />
            </div>
        </template>
        <template #footer>
            <div class="w-full flex items-center justify-end gap-5">
                <button :disabled="formLoading" class="btn-rounded btn-sm btn btn-danger px-4" type="button" @click="closeModal">
                    <Icon :name="formLoading ? 'svg-spinners:3-dots-fade' : 'solar:close-circle-linear'" class="w-5 h-5 mr-2" />
                    <span>Close</span>
                </button>
                <button :disabled="formLoading" class="btn-rounded btn-sm btn btn-primary px-4" type="button" @click="updateNetwork">
                    <Icon :name="formLoading ? 'svg-spinners:3-dots-fade' : 'solar:check-circle-broken'" class="w-5 h-5 mr-2" />
                    <span v-html="'update'" />
                </button>
            </div>
        </template>
    </TheModal>
</template>
