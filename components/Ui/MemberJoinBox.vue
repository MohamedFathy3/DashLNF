<script lang="ts" setup>
const props = defineProps({
    data: {
        type: String,
        required: true,
    },
    label: {
        type: String,
        default: 'Submitted Date',
    },
    icon: {
        type: String,
        default: 'solar:calendar-linear',
    },
});
</script>

<template>
    <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100/80 hover:shadow-md transition-all duration-300 group">
        <div class="flex items-center gap-3">
            <div class="p-2 rounded-xl bg-primary/5 text-primary group-hover:bg-primary/10 transition-all duration-300">
                <Icon :name="icon" class="size-5" />
            </div>
            <div class="font-medium text-sm text-slate-500">{{ label }}</div>
        </div>
        <div class="pt-4 pl-1">
            <span class="text-xl font-semibold text-slate-800">{{ props.data }}</span>
        </div>
    </div>
</template>
