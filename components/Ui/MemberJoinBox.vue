<script lang="ts" setup>
const props = defineProps({
    data: {
        type: String,
        required: true,
    },
});
</script>

<template>
    <div class="shadow-sm bg-white rounded-2xl p-5 text-sm intro-x">
        <div class="flex items-center gap-3 whitespace-nowrap">
            <Icon name="solar:calendar-linear" class="size-5 opacity-65" />
            <div class="font-medium opacity-75">Submitted Date</div>
        </div>
        <div class="pt-3">
            <span class="text-lg font-semibold opacity-75">{{ props.data }}</span>
        </div>
    </div>
</template>
