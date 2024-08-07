<script setup>
defineProps({
    error: {
        type: Object,
        required: true,
    },
});
</script>

<template>
    <div class="h-screen flex items-center place-content-center">
        <div class="text-center space-y-4 text-white">
            <div class="text-4xl font-semibold">Oops</div>
            <div class="text-9xl font-bold text-warning">{{ error.statusCode }}</div>
            <div class="max-w-5xl mx-auto font-light text-xl">{{ error.message }}</div>
            <NuxtLink to="/">
                <button class="mt-3 btn btn-secondary btn-rounded px-6">Go to Home</button>
            </NuxtLink>
        </div>
    </div>
</template>
