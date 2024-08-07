<script lang="ts" setup>
const props = defineProps({
    data: {
        type: String,
        default: null,
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

const elementStyle = computed(() => {
    if (props.data && orderStatuses.value.some((type) => type.value === props.data)) {
        const type = props.data;
        switch (type) {
            case 'in_application_form':
                return 'bg-slate-100 text-slate-700 border !border-slate-200';
            case 'pending_payment':
                return 'bg-slate-100 text-slate-700 border !border-slate-200';
            case 'pending_bank_transfer':
                return 'bg-yellow-100 text-yellow-700 border !border-yellow-200';
            case 'approved_online_payment':
                return 'bg-success/25 text-green-700 border !border-success/25';
            case 'approved_bank_transfer':
                return 'bg-success/25 text-green-700 border !border-success/25';
            default:
                return 'bg-slate-100 text-slate-700 border !border-slate-200';
        }
    } else {
        return '';
    }
});
</script>

<template>
    <span :class="elementStyle" class="whitespace-nowrap text-xs font-medium py-[0.23rem] px-2 rounded-full">{{ orderStatuses.find((t) => t.value === props.data)?.name }}</span>
</template>
