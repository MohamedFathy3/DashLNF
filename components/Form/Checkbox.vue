<script setup>
const props = defineProps({
    flexTitle: {
        type: Boolean,
        default: false,
    },
    label: {
        type: String,
        default: '',
    },
    id: {
        type: String,
        default: null,
    },
    name: {
        type: String,
        default: '',
    },
    description: {
        type: String,
        default: '',
    },
    type: {
        type: String,
        default: 'checkbox',
    },
    readonly: {
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
    required: {
        type: Boolean,
        default: false,
    },
    modelValue: {
        type: [String],
        default: '',
    },
});

const emit = defineEmits(['update:model-value']);
const value = ref(null);
watchEffect(() => {
    emit('update:model-value', value.value);
});
onMounted(() => {
    value.value = props.modelValue ? props.modelValue : null;
});
</script>

<template>
    <div class="text-base" :class="[flexTitle ? 'form-inline' : '']">
        <div :class="[flexTitle ? 'form-inline' : '']" class="form-check items-start">
            <input :id="name" v-model="value" :aria-describedby="name" :disabled="disabled" :readonly="readonly" :name="name" :type="type" class="form-check-input mr-4 w-5 h-5" />
            <label v-if="label" :for="name" class="form-check-label" :class="[flexTitle ? '!text-left sm:w-20 ml-3' : '']">
                <span>{{ label }}</span>
                <span v-if="label && required" class="ml-1 text-sm text-danger">*</span>
            </label>
            <label class="form-check-label" :for="name"></label>
        </div>
        <div v-if="description" class="form-help" v-html="description" />
        <template v-if="errors.length > 0">
            <ul class="mt-1">
                <li v-for="(error, errorIndex) in errors" :key="errorIndex" class="text-sm text-danger">{{ error.$message }}</li>
            </ul>
        </template>
    </div>
</template>
