<script lang="ts" setup>
defineProps({
    data: {
        type: Array as () => InfoBoxType[],
        required: true,
    },
});
</script>

<template>
    <div v-if="data && data.length > 0" class="lg:col-span-12 grid lg:grid-cols-12 gap-5">
        <div v-for="(item, i) in data" :key="i" class="xl:col-span-3 lg:col-span-6 border bg-white rounded-2xl p-5 text-sm intro-x">
            <div class="flex items-center gap-3 whitespace-nowrap">
                <Icon :name="item.icon" class="size-5 opacity-65 shrink-0" />
                <div>{{ item.title }}</div>
            </div>
            <div class="pt-3">
                <span class="text-3xl font-semibold">{{ item.value }}</span>
                <span class="text-sm font-light ml-3 opacity-75">{{ item.description }}</span>
            </div>
        </div>
    </div>
</template>
