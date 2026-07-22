<script lang="ts" setup>
const props = defineProps({
    data: {
        type: String,
        default: null,
        required: true,
    },
    label: {
        type: String,
        default: null,
    },
});

const companyTypes = ref([
    { name: 'Headquarters', value: 'hq' },
    { name: 'Branch', value: 'branch' },
    { name: 'Sub Agent', value: 'sub_agent' },
]);

const elementStyle = computed(() => {
    if (props.data && companyTypes.value.some((type) => type.value === props.data)) {
        const type = props.data;
        switch (type) {
            case 'hq':
                return 'bg-white text-primary border !border-primary/30 shadow-sm shadow-primary/5 hover:shadow-primary/20 transition-all';
            case 'branch':
                return 'bg-white text-slate-700 border !border-slate-300 shadow-sm shadow-slate-100 hover:shadow-slate-200 transition-all';
            case 'sub_agent':
                return 'bg-white text-purple-700 border !border-purple-300 shadow-sm shadow-purple-100 hover:shadow-purple-200 transition-all';
            default:
                return 'bg-white text-slate-700 border !border-slate-300';
        }
    } else {
        return 'bg-white text-slate-700 border !border-slate-300';
    }
});

const glowStyle = computed(() => {
    if (props.data && companyTypes.value.some((type) => type.value === props.data)) {
        const type = props.data;
        switch (type) {
            case 'hq':
                return 'shadow-[0_0_15px_rgba(var(--primary-rgb),0.15)]';
            case 'branch':
                return 'shadow-[0_0_10px_rgba(0,0,0,0.05)]';
            case 'sub_agent':
                return 'shadow-[0_0_15px_rgba(147,51,234,0.12)]';
            default:
                return '';
        }
    }
    return '';
});

const displayLabel = computed(() => {
    if (props.label) return props.label;
    return companyTypes.value.find((t) => t.value === props.data)?.name || props.data;
});
</script>

<template>
    <span :class="[elementStyle, glowStyle]" class="text-xs font-medium py-1.5 px-4 rounded-lg inline-flex items-center gap-2 border backdrop-blur-sm transition-all duration-300 hover:scale-105">
        <span :class="[data === 'hq' ? 'bg-primary' : data === 'branch' ? 'bg-slate-400' : data === 'sub_agent' ? 'bg-purple-500' : 'bg-slate-400', 'w-1.5 h-1.5 rounded-full animate-pulse']"></span>
        {{ displayLabel }}
    </span>
</template>
