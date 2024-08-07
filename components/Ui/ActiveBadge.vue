<script lang="ts" setup>
const props = defineProps({
    data: {
        type: Boolean,
        default: true,
        required: true,
    },
});

const membershipStatues = ref([
    { name: 'Pending', value: 'pending' },
    { name: 'Approved', value: 'approved' },
    { name: 'Suspended', value: 'suspended' },
    { name: 'Blacklisted', value: 'blacklisted' },
]);
</script>

<template>
    <span :class="props.data ? 'bg-success/25 text-green-700' : 'bg-red-700 text-white'" class="text-xs font-medium py-[0.23rem] px-2 rounded-full" v-html="props.data ? 'Active' : 'Inactive'" />
</template>
