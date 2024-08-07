<script setup>
const props = defineProps({
    title: {
        type: String,
        default: null,
    },
    message: {
        type: String,
        default: null,
    },
    type: {
        type: String,
        default: 'common', // Types are [success, error, common, warning]
    },
    duration: {
        type: Number,
        default: 5000, // 5 seconds
    },
});
const emit = defineEmits(['remove']);
onMounted(() => {
    setTimeout(() => emit('remove'), props.duration);
});
</script>
<template>
    <div
        :class="[
            props.type === 'success' ? 'dark:bg-success bg-success text-green-50' : '',
            props.type === 'common' ? 'bg-slate-50 dark:bg-slate-700' : '',
            props.type === 'error' ? 'dark:bg-danger bg-danger text-red-50' : '',
            props.type === 'warning' ? 'dark:bg-warning bg-warning text-slate-800' : '',
            'relative min-w-80 flex rounded-xl p-3 shadow-lg items-center divider-x divider-slate-500',
        ]"
    >
        <div class="pr-2">
            <Icon v-if="props.type === 'success'" name="solar:check-square-broken" class="w-7 h-7" />
            <Icon v-if="props.type === 'error'" name="solar:folder-error-broken" class="w-7 h-7" />
            <Icon v-if="props.type === 'common'" name="solar:bell-outline" class="w-7 h-7" />
            <Icon v-if="props.type === 'warning'" name="solar:shield-warning-broken" class="w-7 h-7" />
        </div>
        <div class="grow px-2">
            <div v-if="props.title" class="font-medium mr-8">{{ props.title }}</div>
            <div v-if="props.message" :class="[props.title ? 'mt-0.5' : '', 'text-sm']">{{ props.message }}</div>
        </div>
        <div class="pl-2">
            <Icon name="solar:close-square-line-duotone" :class="['shrink-0 cursor-pointer opacity-50 w-6 h-6 rounded-md hover:scale-105 ease-in-out duration-300 hover:opacity-75']" @click="emit('remove')" />
        </div>
    </div>
</template>
