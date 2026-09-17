<template>
    <div :class="[flexTitle && 'flex items-center']">
        <label v-if="label" :class="[flexTitle && 'mr-5 !mb-0', 'form-label opacity-75 font-light']">{{ label }}</label>
        <div :class="[label && (!flexTitle ? 'mt-3' : '')]">
            <div v-if="!multiple" class="form-check form-switch">
                <input :id="name" v-model="value" :disabled="disabled" class="form-check-input" :type="type" />
                <label class="form-check-label text-xs font-light" :for="name">{{ des }}</label>
            </div>
            <div v-else-if="multiple" class="grid gap-3 xl:grid-cols-3 md:grid-cols-2 grid-cols-1">
                <div v-for="item in selectData" :id="item[$attrs.keyvalue]" :key="item[$attrs.keyvalue]" class="form-check form-switch">
                    <input :id="name + '-' + item[$attrs.labelvalue]" v-model="value" :disabled="disabled" class="form-check-input mt-1.5" :value="item[$attrs.keyvalue]" :type="type" />
                    <label class="form-check-label" :for="name + '-' + item[$attrs.labelvalue]">{{ item[$attrs.labelvalue] }}</label>
                </div>
            </div>
            <template v-if="errors.length">
                <div v-for="(error, index) in errors" :key="index" class="text-danger mt-2">
                    {{ error.$message }}
                </div>
            </template>
        </div>
    </div>
</template>

<script setup>
const props = defineProps({
    label: {
        type: String,
        default: '',
    },
    des: {
        type: String,
        default: '',
    },
    name: {
        type: String,
        default: '',
    },
    multiple: {
        type: Boolean,
        default: false,
    },
    placeholder: {
        type: String,
        default: '',
    },
    type: {
        type: String,
        default: 'checkbox',
    },
    modelValue: {
        type: [Boolean, Number, Array, Object],
        default: null,
    },
    flexTitle: {
        type: Boolean,
        default: false,
    },
    disabled: {
        type: Boolean,
        default: false,
    },
    emitBoolean: {
        type: Boolean,
        default: false,
    },
    errors: {
        type: Array,
        default: () => [],
    },
    selectData: {
        type: Array,
        default: () => [],
    },
});
const emit = defineEmits(['update:modelValue']);

const normalizeValue = (modelValue) => {
    if (props.multiple) return (modelValue || []).map((item) => !!item);
    if (typeof modelValue === 'boolean') return modelValue;
    if (typeof modelValue === 'number') return modelValue === 1;
    return false;
};

const value = ref(normalizeValue(props.modelValue));

onMounted(() => {
    value.value = normalizeValue(props.modelValue);
});

watch(
    () => props.modelValue,
    (newValue) => {
        value.value = normalizeValue(newValue);
    },
);

watch(value, (newValue) => {
    const newModelValue = props.emitBoolean ? Boolean(newValue) : newValue ? 1 : 0;
    emit('update:modelValue', newModelValue);
});
</script>
