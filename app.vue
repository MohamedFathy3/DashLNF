<script setup></script>

<template>
    <NuxtLoadingIndicator :duration="5000" :height="4" :throttle="0" class="z-[9999]" color="rgb(255 255 80)" />
    <NuxtLayout>
        <div>
            <NuxtPage />
        </div>
    </NuxtLayout>
</template>

<style lang="scss">
.page-enter-active,
.page-leave-active {
    transition: all 0.4s;
}

.page-enter-from,
.page-leave-to {
    opacity: 0;
    filter: blur(0.5rem);
}
</style>
