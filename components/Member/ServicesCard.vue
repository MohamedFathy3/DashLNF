<script setup>
const props = defineProps({
    services: {
        required: true,
        type: Array,
        default: () => [],
    },
    extra: {
        type: Array,
        default: String,
    },
});

const resources = useResourceStore();
</script>
<template>
    <div class="bg-white rounded-xl p-5 shadow-sm">
        <div class="flex items-center justify-between gap-5 pb-3 border-b">
            <div class="font-medium flex items-center gap-1.5">
                <Icon name="solar:star-line-duotone" class="size-5 opacity-75" />
                Services
            </div>
        </div>
        <ul class="pt-3 flex flex-wrap gap-3">
            <template v-for="service in props.services" :key="service">
                <li v-if="resources?.services.find((s) => s.id === service)?.slug !== 'others'" class="hover:scale-105 transition-all">
                    <div class="text-sm font-normal py-[0.23rem] rounded-full bg-slate-100 px-3 flex items-center gap-1.5">
                        <Icon name="solar:check-read-outline" class="size-4 text-success" />
                        <span>{{ resources?.services.find((s) => s.id === service)?.name }}</span>
                    </div>
                </li>
            </template>

            <li v-if="props.extra" class="hover:scale-105 transition-all">
                <div class="text-sm font-normal py-[0.23rem] rounded-full bg-slate-100 px-3 flex items-center gap-1.5">
                    <Icon name="solar:check-read-outline" class="size-4 text-success" />
                    <span>{{ props.extra }}</span>
                </div>
            </li>
        </ul>
    </div>
</template>
