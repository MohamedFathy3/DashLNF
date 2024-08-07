<template>
    <div>
        <div>
            <FormSelectField id="conference-selector" v-model="id" class="text-slate-800 cursor-pointer w-[18rem]" placeholder="Please select a conference..." :clearable="false" :select-data="settings.conferences" labelvalue="name" keyvalue="id" />
        </div>
    </div>
</template>

<script setup lang="ts">
const emit = defineEmits(['reload']);
const settings = useSettingsStore();

const id = ref(settings.conferenceId);
watch(
    id,
    (newVal) => {
        changeConference(Number(newVal));
    },
    { deep: true },
);

const changeConference = async (id: number) => {
    await settings.getConference(id);
    setTimeout(() => {
        emit('reload');
    }, 100);
};
</script>
