<script lang="ts" setup>
const props = defineProps({
    data: {
        type: Boolean,
        required: true,
        default: false,
    },
});
</script>

<template>
    <div class="shadow-sm bg-white rounded-2xl p-5 text-sm intro-x">
        <div class="flex items-center gap-3 whitespace-nowrap">
            <Icon name="solar:shield-network-linear" class="size-5 opacity-65" />
            <div class="font-medium opacity-75">LNF FPP</div>
        </div>
        <div class="pt-3">
            <span :class="props.data ? 'text-success' : 'text-danger'" class="text-xl font-semibold" v-html="props.data ? 'Active' : 'Inactive'" />
        </div>
    </div>
</template>
