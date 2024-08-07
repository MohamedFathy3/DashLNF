<script lang="ts" setup>
const props = defineProps({
    data: {
        type: String,
        default: null,
        required: true,
    },
});

const companyTypes = ref([
    { name: 'HQ', value: 'hq' },
    { name: 'Branch', value: 'branch' },
]);

const elementStyle = computed(() => {
    if (props.data && companyTypes.value.some((type) => type.value === props.data)) {
        const type = props.data;
        switch (type) {
            case 'hq':
                return 'bg-orange-100 text-orange-700 border !border-orange-200';
            case 'branch':
                return 'bg-slate-100 text-slate-700 border';
            default:
                return 'bg-slate-100 text-slate-700';
        }
    } else {
        return '';
    }
});
</script>

<template>
    <span :class="elementStyle" class="text-xs font-medium py-[0.23rem] px-3 rounded-full">{{ companyTypes.find((t) => t.value === props.data)?.name }}</span>
</template>
