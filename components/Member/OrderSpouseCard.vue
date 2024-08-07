<script setup>
const props = defineProps({
    spouses: {
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
                <Icon name="solar:users-group-rounded-line-duotone" class="size-5 opacity-75" />
                <span>Spouses</span>
                <span class="px-2.5 py-0.5 bg-white rounded-full border">{{ props.spouses.length }}</span>
            </div>
        </div>
        <ul v-if="props.spouses.length > 0" :class="['grid 2xl:grid-cols-3 lg:grid-cols-' + props.grid + ' gap-3']">
            <li v-for="spouse in props.spouses" :key="spouse.id" class="flex flex-col gap-3 bg-white rounded-xl p-5 shadow-sm">
                <div class="flex items-center gap-3">
                    <NuxtImg :src="spouse.imageUrl" :title="spouse.name" :alt="spouse.name" class="size-10 shrink-0 rounded-full object-cover ring-2 ring-slate-500/25" />
                    <div>
                        <div class="text-sm font-medium opacity-85 line-clamp-1">
                            {{ spouse.name }}
                        </div>
                        <div class="font-light mt-0.5 line-clamp-1 capitalize items-center flex gap-1.5">
                            <Icon name="solar:user-circle-outline" class="size-4 opacity-75" />
                            <span>{{ spouse.delegate }}</span>
                        </div>
                    </div>
                </div>
                <ul class="border-t border-dashed pt-2 divide-y divide-dashed">
                    <li class="flex items-center justify-between gap-5 py-1.5">
                        <div class="flex items-center gap-1.5">
                            <Icon class="size-4" name="solar:t-shirt-outline" />
                            <span>Tshirt Size</span>
                        </div>
                        <div class="font-normal">{{ spouse.tshirtSize }}</div>
                    </li>
                    <li class="flex items-start justify-between gap-5 py-1.5">
                        <div class="flex items-center gap-1.5">
                            <Icon class="size-4" name="fluent:food-24-regular" />
                            <span>Dietaries</span>
                        </div>
                        <div v-if="spouse.dietaries.length > 0 || spouse.extraDietaries" class="font-normal flex flex-wrap gap-3 items-center">
                            <template v-for="diet in spouse.dietaries" :key="diet.id">
                                <span class="px-2 py-0.5 rounded-full bg-slate-100 border">{{ diet.name }}</span>
                            </template>
                            <template v-if="spouse.extraDietaries">
                                <span class="px-2 py-0.5 rounded-full bg-slate-100 border">{{ spouse.extraDietaries }}</span>
                            </template>
                        </div>
                        <div v-else class="font-normal opacity-65">No Dietaries</div>
                    </li>
                </ul>
            </li>
        </ul>
        <div v-else class="lg:col-span-12 p-5 text-base text-center bg-white border-2 border-dashed font-medium opacity-75">No spouses</div>
    </div>
</template>
