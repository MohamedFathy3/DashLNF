<script setup>
const props = defineProps({
    pending: {
        type: Boolean,
        default: true,
        required: true,
    },
    rows: {
        type: Object,
        default: () => {},
        required: true,
    },
    page: {
        type: Number,
        default: 1,
        required: true,
    },
});

const emit = defineEmits(['change-page']);

function onPageChange(page) {
    emit('change-page', page);
}
</script>

<template>
    <div v-if="!props.pending && props.rows.data" class="flex items-center justify-between gap-5 text-sm">
        <button type="button" :disabled="props.rows.meta.current_page === 1" class="btn-secondary btn" @click="onPageChange(props.page - 1)">
            <Icon class="mr-2 w-5 h-5" name="solar:double-alt-arrow-left-line-duotone" />
            Previous
        </button>
        <ul class="md:flex items-center gap-3 hidden">
            <template v-for="(link, pageIndex) in props.rows.meta.links" :key="pageIndex">
                <li v-if="pageIndex !== 0 && pageIndex !== props.rows.meta.links.length - 1">
                    <button type="button" :class="[link.active ? 'btn-primary' : 'btn-secondary', 'btn']" :disabled="props.rows.meta.current_page === parseInt(link.label) || link.label === '...'" @click="onPageChange(link.label)">
                        {{ link.label }}
                    </button>
                </li>
            </template>
        </ul>
        <button type="button" :disabled="props.rows.meta.current_page === props.rows.meta.last_page" class="btn-secondary btn" @click="onPageChange(props.page + 1)">
            Next
            <Icon class="ml-2 w-5 h-5" name="solar:double-alt-arrow-right-line-duotone" />
        </button>
    </div>
</template>

<style scoped></style>
