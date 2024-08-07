<script setup>
const props = defineProps({
    spouses: {
        required: true,
        type: Array,
        default: () => [],
    },
    memberId: {
        required: true,
        type: Number,
    },
});
const emit = defineEmits(['refresh']);
const isOpen = ref(false);
const selectedId = ref(null);
function onSuccessUpdate() {
    emit('refresh');
}
async function openModal(index) {
    selectedId.value = index;
    isOpen.value = true;
}
function closeModal() {
    isOpen.value = false;
    selectedId.value = undefined;
}
</script>
<template>
    <div>
        <div class="flex items-center justify-between gap-5 mb-3">
            <div class="font-medium flex items-center gap-1.5 whitespace-nowrap">
                <Icon name="solar:users-group-rounded-outline" class="size-5 opacity-75" />
                Spouses
            </div>
        </div>
        <ul v-if="props.spouses.length > 0" class="flex flex-col gap-3">
            <li v-for="person in props.spouses" :key="person.id" class="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm cursor-pointer hover:scale-105 transition-all" @click="openModal(person.id)">
                <NuxtImg :src="person.imageUrl" :title="person.name" :alt="person.name" class="size-10 shrink-0 rounded-full object-cover ring-2 ring-slate-500/25" />
                <div>
                    <div class="font-medium opacity-85 line-clamp-1">{{ person.name }}</div>
                    <div class="font-light mt-0.5 text-xs line-clamp-1">{{ person.delegate }}</div>
                </div>
            </li>
        </ul>
        <div v-else class="lg:col-span-12 p-5 text-base text-center bg-white border-2 border-dashed font-medium opacity-75">This member has no spouses</div>

        <MemberSpouseModal v-if="isOpen" :open="isOpen" :person-id="selectedId" @close="closeModal" @refresh="onSuccessUpdate" />
    </div>
</template>
