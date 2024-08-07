<script setup>
defineProps({
    openModal: {
        type: Boolean,
        default: false,
    },
    size: {
        type: String,
        default: 'md',
    },
});

const emit = defineEmits(['close-modal']);

function closeModal() {
    emit('close-modal');
}
</script>

<template>
    <div>
        <HeadlessTransitionRoot :show="openModal" appear as="template">
            <headlessDialog as="div" class="relative z-[9999] min-w-7xl" static>
                <HeadlessTransitionChild as="template" enter="duration-300 ease-out" enter-from="opacity-0" enter-to="opacity-100" leave="duration-200 ease-in" leave-from="opacity-100" leave-to="opacity-0">
                    <div class="fixed inset-0 bg-black bg-opacity-75 backdrop-blur" />
                </HeadlessTransitionChild>

                <div class="fixed inset-0 overflow-y-auto min-w-7xl">
                    <div class="flex min-h-full items-center justify-center p-5 text-center min-w-7xl">
                        <HeadlessTransitionChild
                            as="template"
                            enter="duration-300 ease-out"
                            enter-from="opacity-0 scale-95"
                            enter-to="opacity-100 scale-100"
                            leave="duration-200 ease-in"
                            leave-from="opacity-100 scale-100"
                            leave-to="opacity-0 scale-95"
                        >
                            <HeadlessDialogPanel :class="['max-w-' + size]" as="form" class="grow transform rounded-2xl bg-white p-5 text-left align-middle shadow-xl transition-all dark:bg-slate-900">
                                <HeadlessDialogTitle v-if="$slots.header" as="div" class="border-b border-slate-100 pb-5 text-lg font-medium leading-6 dark:border-slate-800">
                                    <slot name="header" />
                                </HeadlessDialogTitle>
                                <div class="my-5">
                                    <slot name="content" />
                                </div>
                                <div v-if="$slots.footer" class="border-t border-slate-100 pt-5 dark:border-slate-800">
                                    <slot name="footer" />
                                </div>
                            </HeadlessDialogPanel>
                        </HeadlessTransitionChild>
                    </div>
                </div>
            </headlessDialog>
        </HeadlessTransitionRoot>
    </div>
</template>
