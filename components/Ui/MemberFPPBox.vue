<script lang="ts" setup>
const props = defineProps({
    data: {
        type: Boolean,
        default: false,
    },
    label: {
        type: String,
        default: 'LNF FPP',
    },
    value: {
        type: String,
        default: '',
    },
    icon: {
        type: String,
        default: 'solar:shield-network-linear',
    },
});

const displayValue = computed(() => props.value || (props.data ? 'Active' : 'Inactive'));
const valueClass = computed(() => (props.value ? 'text-slate-800' : props.data ? 'text-success' : 'text-danger'));
</script>

<template>
    <div class="shadow-sm bg-white rounded-2xl p-5 text-sm intro-x">
        <div class="flex items-center gap-3 whitespace-nowrap">
            <Icon :name="icon" class="size-5 opacity-65" />
            <div class="font-medium opacity-75">{{ label }}</div>
        </div>
        <div class="pt-3">
            <span :class="valueClass" class="text-xl font-semibold">{{ displayValue }}</span>
        </div>
    </div>
</template>
