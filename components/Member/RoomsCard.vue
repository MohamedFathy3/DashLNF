<script setup>
const props = defineProps({
    rooms: {
        required: true,
        type: Array,
        default: () => [],
    },
    grid: {
        type: Number,
        default: 1,
    },
});

const bedTypes = ref([
    { name: 'Twin Bed', value: 'twin' },
    { name: 'King Size Bed', value: 'king_size' },
]);
</script>
<template>
    <div>
        <div class="flex items-center justify-between gap-5 mb-3">
            <div class="font-medium text-base flex items-center gap-2 whitespace-nowrap">
                <Icon name="solar:bed-outline" class="size-5 opacity-75" />
                Rooms
            </div>
        </div>
        <ul v-if="props.rooms.length > 0" :class="['grid lg:grid-cols-' + props.grid + ' gap-3']">
            <li v-for="room in props.rooms" :key="room.id" class="flex flex-col gap-3 bg-white rounded-xl p-5 shadow-sm">
                <div class="flex items-center gap-3">
                    <NuxtImg :src="room.room.imageUrl" :title="room.room.name" :alt="room.room.name" class="size-14 shrink-0 rounded-md object-cover ring-2 ring-slate-500/25" />
                    <div>
                        <div class="text-sm font-medium opacity-85 line-clamp-1">
                            {{ room.room.name }}
                            <span
                                :class="!room.orderComplete ? 'text-xs font-normal bg-success/25 !border-success/25 text-success rounded-full px-2 py-0.5 border ml-4' : 'text-xs font-normal bg-slate-100 rounded-full px-2 py-0.5 border ml-4'"
                                v-html="room.orderComplete ? 'Pending' : 'Approved'"
                            />
                        </div>
                        <div class="font-light mt-0.5 text-xs capitalize line-clamp-1">
                            {{ room.room.type }}, <span class="font-medium">{{ bedTypes.find((t) => t.value === room.bedType).name }}</span>
                        </div>
                        <div class="text-xs mt-0.5 font-light flex items-center gap-2">
                            <div>{{ room.startDateFormatted }}</div>
                            <Icon name="solar:double-alt-arrow-right-line-duotone" class="size-4" />
                            <div>{{ room.endDateFormatted }}</div>
                        </div>
                    </div>
                </div>
                <div class="grid lg:grid-cols-2 gap-5 pt-3 border-t border-dashed">
                    <div v-for="person in room.persons" :key="person.id" class="flex items-center gap-3">
                        <NuxtImg :src="person.imageUrl" :title="person.name" :alt="room.room.name" class="size-8 shrink-0 rounded-full object-cover ring-2 ring-slate-500/25" />
                        <div>
                            <div class="font-medium opacity-85 line-clamp-1">{{ person.name }}</div>
                            <div class="font-light mt-0.5 text-xs capitalize line-clamp-1">{{ person.type }}</div>
                        </div>
                    </div>
                </div>
            </li>
        </ul>
        <div v-else class="lg:col-span-12 p-5 text-base text-center bg-white border-2 border-dashed font-medium opacity-75">No rooms</div>
    </div>
</template>
