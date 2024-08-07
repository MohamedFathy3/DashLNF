<script setup>
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';

const props = defineProps({
    flexTitle: {
        type: Boolean,
        default: false,
    },
    label: {
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
    readonly: {
        type: Boolean,
        default: false,
    },
    disabled: {
        type: Boolean,
        default: false,
    },
    timePicker: {
        type: Boolean,
        default: true,
    },
    errors: {
        type: Array,
        default: () => [],
    },
    autocomplete: {
        type: String,
        default: 'off',
    },
    icon: {
        type: String,
        default: 'solar:calendar-linear',
    },
    format: {
        type: String,
        default: null,
    },
    required: {
        type: Boolean,
        default: false,
    },
    range: {
        type: Boolean,
        default: false,
    },
    modelValue: {
        type: Object,
        default: () => ({}),
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
        <label v-if="label" :for="name" class="form-label opacity-75 font-light" :class="[flexTitle ? '!text-left sm:w-20' : '']">
            <span>{{ label }}</span>
            <span v-if="label && required" class="ml-1 text-sm text-danger">*</span>
        </label>
        <VueDatePicker
            v-model="value"
            :teleport="true"
            :enable-time-picker="timePicker"
            :auto-apply="true"
            :format="format ? format : timePicker ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd'"
            :model-type="format ? format : timePicker ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd'"
            :autocomplete="autocomplete"
            :placeholder="placeholder"
            :name="name"
            :range="range"
            class="form-control form-control-rounded"
            :readonly="readonly"
            :disabled="disabled"
            :class="{ 'has-error': errors.length > 0 }"
        >
            <template #dp-input="{ value }">
                <div class="grow" :class="[icon && 'relative']">
                    <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Icon :name="icon" class="h-5 w-5 text-slate-400 dark:text-slate-600" />
                    </div>
                    <input :placeholder="placeholder" class="form-control-rounded form-control form-control placeholder:!text-slate-400 font-normal pl-10" type="text" :value="value" />
                </div>
            </template>
        </VueDatePicker>

        <template v-if="errors.length > 0">
            <ul class="mt-1">
                <li v-for="(error, errorIndex) in errors" :key="errorIndex" class="text-sm text-danger">{{ error.$message }}</li>
            </ul>
        </template>
    </div>
</template>
<style lang="scss">
.has-error > {
    .dp__input {
        @apply border-danger;
    }
}
</style>
