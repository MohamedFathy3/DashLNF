<script setup lang="ts">
const props = defineProps({
    label: {
        type: String,
        default: 'Top Visited Countries',
    },
    icon: {
        type: String,
        default: 'solar:asteroid-linear',
    },
    data: {
        type: Array as () => Visit[],
        default: () => [] as Visit[],
    },
});
</script>

<template>
    <div class="lg:col-span-3">
        <div>
            <div class="p-5 bg-white rounded-2xl">
                <div class="flex items-center gap-3">
                    <Icon v-if="props.icon" :name="props.icon" class="opacity-75 size-5" />
                    <span class="font-medium">{{ props.label }}</span>
                </div>
                <ul class="mt-5 divide-y divide-slate-200 divide-dashed">
                    <li v-for="item in data" :key="item.country.id" class="py-2">
                        <div class="flex items-center justify-between gap- text-sm">
                            <div class="flex items-center gap-3">
                                <img :alt="item.country.name" :src="item.country.imageUrl" :title="item.country.name" class="w-6 h-6 rounded-full object-cover ring-3 ring-slate-100" />
                                <div class="font-light">{{ item.country.name }}</div>
                            </div>
                            <div>{{ item.count }}</div>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>
