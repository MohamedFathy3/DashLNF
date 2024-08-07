<script lang="ts" setup>
const props = defineProps({
    data: {
        type: String,
        default: null,
        required: true,
    },
});

const membershipStatues = ref([
    { name: 'Pending', value: 'pending' },
    { name: 'Approved', value: 'approved' },
    { name: 'Suspended', value: 'suspended' },
    { name: 'Blacklisted', value: 'blacklisted' },
]);

const elementStyle = computed(() => {
    if (props.data && membershipStatues.value.some((type) => type.value === props.data)) {
        const type = props.data;
        switch (type) {
            case 'approved':
                return 'bg-success/25 text-green-700 border !border-success/25';
            case 'suspended':
                return 'bg-yellow-100 text-yellow-700 border !border-yellow-200';
            case 'pending':
                return 'bg-slate-100 text-slate-700 border !border-slate-200';
            case 'blacklisted':
                return 'bg-red-100 text-red-700 border !border-red-200';
            default:
                return 'bg-slate-100 text-slate-700 border !border-slate-200';
        }
    } else {
        return '';
    }
});
</script>

<template>
    <span :class="elementStyle" class="text-xs font-medium py-[0.23rem] px-2 rounded-full">{{ membershipStatues.find((t) => t.value === props.data)?.name }}</span>
</template>
