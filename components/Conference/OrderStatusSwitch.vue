<script setup>
const props = defineProps({
    orderId: {
        type: Number,
        required: true,
    },
    orderStatus: {
        type: String,
        required: true,
    },
});
const orderStatuses = ref([
    { name: 'Application Form', value: 'in_application_form' },
    { name: 'Pending Payment', value: 'pending_payment' },
    { name: 'Pending Bank Transfer', value: 'pending_bank_transfer' },
    { name: 'Approved Online Payment', value: 'approved_online_payment' },
    { name: 'Approved Bank Transfer', value: 'approved_bank_transfer' },
]);
const emit = defineEmits(['reload']);
const id = ref(props.orderId);
const status = ref(props.orderStatus);
watch(
    status,
    (newVal) => {
        changeOrder(newVal);
    },
    { deep: true },
);
const changeOrder = async (status) => {
    const { data, error } = await useApiFetch(`/api/dashboard/order/${id.value}/change-status`, {
        lazy: true,
        body: { status: status },
        method: 'POST',
    });
    if (data.value) {
        useToast({ title: 'Success', message: 'Status Changed Successfully', type: 'success', duration: 5000 });
    }
    if (error && error.value) {
        console.error(error);
        useToast({ title: 'Error', message: error.value.message, type: 'error', duration: 5000 });
    }
    setTimeout(() => {
        emit('reload');
    }, 100);
};
</script>
<template>
    <div>
        <div>
            <FormSelectField id="status-selector" v-model="status" class="text-slate-800 cursor-pointer w-[18rem]" placeholder="Please select a status..." :clearable="false" :select-data="orderStatuses" labelvalue="name" keyvalue="value" />
        </div>
    </div>
</template>
