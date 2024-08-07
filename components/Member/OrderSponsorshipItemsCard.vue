<script setup>
const props = defineProps({
    items: {
        required: true,
        type: Array,
        default: () => [],
    },
    grid: {
        type: Number,
        default: 1,
    },
});
</script>
<template>
    <div>
        <div class="flex items-center justify-between gap-5 mb-3">
            <div class="font-medium text-base flex items-center gap-2 whitespace-nowrap">
                <Icon name="solar:medal-ribbons-star-outline" class="size-5 opacity-75" />
                <span>Sponsorship Items</span>
                <span class="px-2.5 py-0.5 bg-white rounded-full border">{{ props.items.length }}</span>
            </div>
        </div>
        <ul v-if="props.items.length > 0" :class="['grid 2xl:grid-cols-3 lg:grid-cols-' + props.grid + ' gap-3']">
            <li v-for="item in props.items" :key="item.id" class="flex flex-col gap-3 bg-white rounded-xl p-5 shadow-sm">
                <div class="flex items-center gap-3">
                    <NuxtImg :src="item.imageUrl" :title="item.name" :alt="item.name" class="size-12 shrink-0 rounded-md object-cover ring-2 p-1.5 bg-primary ring-slate-500/25" />
                    <div>
                        <div class="text-sm font-medium opacity-85 line-clamp-1">
                            {{ item.name }}
                        </div>
                        <div class="font-normal mt-0.5 text-xs capitalize line-clamp-1">{{ item.priceUsed }}<span class="font-light ml-1.5">USD</span></div>
                    </div>
                </div>
            </li>
        </ul>
        <div v-else class="lg:col-span-12 p-5 text-base text-center bg-white border-2 border-dashed font-medium opacity-75">No items</div>
    </div>
</template>
