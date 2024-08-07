<template>
    <div v-if="settings.conference?.isPast" class="container bg-warning/25 p-5 text-center rounded-xl border !border-warning/25">
        <span>You are watching an old conference content!</span>
    </div>
</template>

<script setup>
const settings = useSettingsStore();
</script>
