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
        type: Object,
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

const value = ref();

onMounted(() => {
    if (props.multiple) {
        value.value = (props.modelValue || []).map((item) => !!item);
    } else {
        if (typeof props.modelValue === 'boolean') {
            value.value = props.modelValue;
        } else if (typeof props.modelValue === 'number') {
            value.value = props.modelValue === 1;
        }
    }
});

watch(
    () => props.modelValue,
    (newValue) => {
        // Handle both 0/1 and true/false values
        if (typeof newValue === 'boolean') {
            value.value = newValue;
        } else if (typeof newValue === 'number') {
            value.value = newValue === 1;
        }
    },
);

watch(value, (newValue) => {
    // Convert true/false to 1/0 before emitting the update
    const newModelValue = newValue ? 1 : 0;
    emit('update:modelValue', newModelValue);
});
</script>
