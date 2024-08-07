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
    rows: {
        type: Number,
        default: 5,
    },
    maxlength: {
        type: Number,
        default: 524288,
    },
    size: {
        type: String,
        default: '',
    },
    name: {
        type: String,
        default: '',
    },
    placeholder: {
        type: String,
        default: '',
    },
    description: {
        type: String,
        default: '',
    },
    rounded: {
        type: Boolean,
        default: true,
    },
    autofocus: {
        type: Boolean,
        default: false,
    },
    type: {
        type: String,
        default: 'text',
    },
    autocomplete: {
        type: String,
        default: 'off',
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
    icon: {
        type: String,
        default: '',
    },
    modelValue: {
        type: [String],
        default: '',
    },
});

const emit = defineEmits(['update:model-value']);
const value = ref(props.modelValue);
onMounted(() => {
    value.value = props.modelValue;
});
watchEffect(() => {
    emit('update:model-value', value.value);
});
watchEffect(() => {
    value.value = props.modelValue;
});
</script>

<template>
    <div class="text-base" :class="[flexTitle && 'form-inline']">
        <label v-if="label" :for="name" class="form-label opacity-75 font-light" :class="[flexTitle && '!text-left sm:w-20']">
            <span>{{ label }}</span>
            <span v-if="label && required" class="ml-1 text-sm text-danger">*</span>
        </label>
        <template v-if="type !== 'textarea'">
            <div class="grow" :class="[icon && 'relative']">
                <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Icon :name="icon" class="h-5 w-5 text-slate-400 dark:text-slate-600" />
                </div>
                <input
                    :id="id === null ? name : id"
                    v-model="value"
                    :autocomplete="autocomplete"
                    :type="type"
                    :autofocus="autofocus"
                    :readonly="readonly"
                    :maxlength="maxlength"
                    :required="required"
                    :aria-label="label ?? name"
                    class="form-control placeholder:!text-slate-400 font-light"
                    :class="[size === 'lg' ? 'form-control-lg' : '', size === 'sm' ? 'form-control-sm' : '', icon ? 'pl-10' : '', errors?.length > 0 ? '!border-danger' : '', rounded ? 'form-control-rounded' : '']"
                    :placeholder="placeholder"
                    :disabled="disabled"
                />
            </div>
            <div v-if="description" class="form-help px-3 opacity-75" v-html="description" />
            <template v-if="errors.length > 0">
                <ul class="mt-1">
                    <li v-for="(error, errorIndex) in errors" :key="errorIndex" class="text-sm text-danger">{{ error.$message }}</li>
                </ul>
            </template>
        </template>
        <template v-if="type === 'textarea'">
            <div class="grow">
                <textarea
                    :id="id === null ? name : id"
                    v-model="value"
                    :autocomplete="autocomplete"
                    :rows="rows"
                    :maxlength="maxlength"
                    :autofocus="autofocus"
                    :readonly="readonly"
                    :required="required"
                    :aria-label="label ?? name"
                    class="form-control font-light rounded-2xl"
                    :class="[size === 'lg' ? 'form-control-lg' : '', size === 'sm' ? 'form-control-sm' : '', errors?.length > 0 ? '!border-danger' : '']"
                    :placeholder="placeholder"
                    :disabled="disabled"
                />
            </div>
            <div v-if="description" class="form-help" v-html="description" />
            <template v-if="errors.length > 0">
                <ul class="mt-1">
                    <li v-for="(error, errorIndex) in errors" :key="errorIndex" class="text-sm text-danger">{{ error.$message }}</li>
                </ul>
            </template>
        </template>
    </div>
</template>
