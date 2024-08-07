<script setup>
const props = defineProps({
    delegates: {
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
                <Icon name="solar:users-group-two-rounded-linear" class="size-5 opacity-75" />
                <span>Delegates</span>
                <span class="px-2.5 py-0.5 bg-white rounded-full border">{{ props.delegates.length }}</span>
            </div>
        </div>
        <ul v-if="props.delegates.length > 0" :class="['grid 2xl:grid-cols-3 lg:grid-cols-' + props.grid + ' gap-3']">
            <li v-for="delegate in props.delegates" :key="delegate.id" class="flex flex-col gap-3 bg-white rounded-xl p-5 shadow-sm">
                <div class="flex items-center gap-3">
                    <NuxtImg :src="delegate.imageUrl" :title="delegate.name" :alt="delegate.name" class="size-10 shrink-0 rounded-full object-cover ring-2 ring-slate-500/25" />
                    <div>
                        <div class="text-sm font-medium opacity-85 line-clamp-1 capitalize">
                            {{ delegate.name.toLowerCase() }}
                        </div>
                        <div class="font-light mt-0.5 line-clamp-1 lowercase">{{ delegate.email }}</div>
                    </div>
                </div>
                <ul class="border-t border-dashed pt-2 divide-y divide-dashed">
                    <li class="flex items-center justify-between gap-5 py-1.5">
                        <div class="flex items-center gap-1.5">
                            <Icon class="size-4" name="solar:case-round-line-duotone" />
                            <span>Job Title</span>
                        </div>
                        <div class="font-normal">{{ delegate.jobTitle }}</div>
                    </li>
                    <li class="flex items-center justify-between gap-5 py-1.5">
                        <div class="flex items-center gap-1.5">
                            <Icon class="size-4" name="solar:phone-calling-rounded-linear" />
                            <span>Phone</span>
                        </div>
                        <div class="font-normal">
                            <span class="mr-1.5">+{{ delegate.phoneKey }}</span
                            >{{ delegate.phone }}
                        </div>
                    </li>
                    <li class="flex items-center justify-between gap-5 py-1.5">
                        <div class="flex items-center gap-1.5">
                            <Icon class="size-4" name="solar:smartphone-outline" />
                            <span>Cell</span>
                        </div>
                        <div class="font-normal">
                            <span class="mr-1.5">+{{ delegate.cellKey }}</span
                            >{{ delegate.cell }}
                        </div>
                    </li>
                    <li class="flex items-center justify-between gap-5 py-1.5">
                        <div class="flex items-center gap-1.5">
                            <Icon class="size-4" name="solar:t-shirt-outline" />
                            <span>Tshirt Size</span>
                        </div>
                        <div class="font-normal">{{ delegate.tshirtSize }}</div>
                    </li>
                    <li class="flex items-start justify-between gap-5 py-1.5">
                        <div class="flex items-center gap-1.5">
                            <Icon class="size-4" name="fluent:food-24-regular" />
                            <span>Dietaries</span>
                        </div>
                        <div v-if="delegate.dietaries.length > 0 || delegate.extraDietaries" class="font-normal flex flex-wrap gap-3 items-center">
                            <template v-for="diet in delegate.dietaries" :key="diet.id">
                                <span class="px-2 py-0.5 rounded-full bg-slate-100 border">{{ diet.name }}</span>
                            </template>
                            <template v-if="delegate.extraDietaries">
                                <span class="px-2 py-0.5 rounded-full bg-slate-100 border">{{ delegate.extraDietaries }}</span>
                            </template>
                        </div>
                        <div v-else class="font-normal opacity-65">No Dietaries</div>
                    </li>
                </ul>
            </li>
        </ul>
        <div v-else class="lg:col-span-12 p-5 text-base text-center bg-white border-2 border-dashed font-medium opacity-75">No delegates</div>
    </div>
</template>
