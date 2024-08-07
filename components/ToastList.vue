<script setup lang="ts">
const toast = useToastStore();
</script>
<template>
    <TransitionGroup
        tag="div"
        enter-from-class="translate-x-full opacity-0"
        enter-active-class="duration-300 ease-out"
        leave-active-class="duration-300 ease-in"
        leave-to-class="translate-x-full opacity-0"
        class="fixed z-[99999] bottom-8 right-8 space-y-5"
    >
        <ToastNotification v-for="(item, index) in toast.items" :key="item.key" :title="item.title" :message="item.message" :type="item.type" @remove="toast.removeToast(index)" />
    </TransitionGroup>
</template>
