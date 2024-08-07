<script lang="ts" setup>
const props = defineProps({
    type: {
        type: String,
        default: 'dropdown-right-top',
    },
});
const currentStyle = toRef(props, 'type');

const availableThemes = [
    {
        key: 'light',
        text: 'Light',
    },
    {
        key: 'dark',
        text: 'Dark',
    },
    {
        key: 'system',
        text: 'System',
    },
];
</script>

<template>
    <div class="flex items-center">
        <ClientOnly>
            <HeadlessListbox v-if="currentStyle === 'dropdown-right-top'" v-model="$colorMode.preference" as="div" class="relative flex items-center">
                <HeadlessListboxLabel class="sr-only"> Theme</HeadlessListboxLabel>
                <HeadlessListboxButton type="template">
                    <Icon v-if="$colorMode.value !== 'dark'" name="solar:sun-2-broken" class="h-6 w-6" />
                    <Icon v-if="$colorMode.value !== 'light'" name="solar:moon-stars-broken" class="h-6 w-6" />
                </HeadlessListboxButton>
                <HeadlessListboxOptions class="box absolute right-0 top-full z-50 w-36 origin-top-right overflow-hidden rounded-lg p-1 py-1 font-semibold shadow-lg">
                    <HeadlessListboxOption
                        v-for="theme in availableThemes"
                        :key="theme.key"
                        :value="theme.key"
                        class="flex cursor-pointer items-center px-2 py-2 text-sm"
                        :class="{
                            'bg-primary text-slate-100 rounded-md dark:bg-slate-600/30': $colorMode.preference === theme.key,
                            'hover:bg-slate-50 dark:hover:bg-slate-700/30': $colorMode.preference !== theme.key,
                        }"
                    >
                        <span class="mr-2 flex items-center">
                            <Icon v-if="theme.key === 'light'" class="w-5 h-5" name="solar:sun-2-broken" />
                            <Icon v-else-if="theme.key === 'dark'" class="w-5 h-5" name="solar:moon-stars-broken" />
                            <Icon v-else-if="theme.key === 'system'" class="w-5 h-5" name="solar:display-broken" />
                        </span>
                        {{ theme.text }}
                    </HeadlessListboxOption>
                </HeadlessListboxOptions>
            </HeadlessListbox>
            <select v-if="currentStyle === 'select-box'" v-model="$colorMode.preference" class="w-full rounded border border-slate-900/10 bg-transparent px-2 py-1 pr-3 outline-none dark:border-slate-50/[0.2] dark:text-slate-300">
                <option v-for="theme in availableThemes" :key="theme.key" :value="theme.key">
                    {{ theme.text }}
                </option>
            </select>
        </ClientOnly>
    </div>
</template>
