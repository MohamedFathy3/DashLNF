<script lang="ts" setup>
const props = defineProps({
    data: {
        type: String,
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
                return 'text-success';
            case 'suspended':
                return 'text-warning';
            case 'pending':
                return 'text-slate-700';
            case 'blacklisted':
                return 'text-danger';
            default:
                return 'text-slate-700';
        }
    } else {
        return '';
    }
});
const elementIcon = computed(() => {
    if (props.data && membershipStatues.value.some((type) => type.value === props.data)) {
        const type = props.data;
        switch (type) {
            case 'approved':
                return 'solar:check-circle-outline';
            case 'suspended':
                return 'solar:close-circle-outline';
            case 'pending':
                return 'solar:info-circle-outline';
            case 'blacklisted':
                return 'solar:close-circle-outline';
            default:
                return 'solar:info-circle-outline';
        }
    } else {
        return 'solar:info-circle-outline';
    }
});
</script>

<template>
    <div class="shadow-sm bg-white rounded-2xl p-5 text-sm intro-x">
        <div class="flex items-center gap-3 whitespace-nowrap">
            <Icon :name="elementIcon" class="size-5 opacity-65" />
            <div class="font-medium opacity-75">Status</div>
        </div>
        <div class="pt-3">
            <span :class="elementStyle" class="text-xl font-semibold">{{ membershipStatues.find((t) => t.value === props.data)?.name }}</span>
        </div>
    </div>
</template>
