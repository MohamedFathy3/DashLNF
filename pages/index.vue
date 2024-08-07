<script lang="ts" setup>
definePageMeta({
    middleware: 'auth',
});
const networkInfoBoxes = ref([]);
const { data: networkStatistics, execute: fetchNetworkStatistics } = await useApiFetch('/api/dashboard/network/user-statistic', {
    immediate: false,
    lazy: true,
});
async function prepareInfoBoxes() {
    await fetchNetworkStatistics();
    networkInfoBoxes.value = [
        {
            title: 'Approved',
            icon: 'solar:users-group-two-rounded-outline',
            value: networkStatistics.value.totalApproved,
            description: 'Members',
        },
        {
            title: 'Countries',
            icon: 'solar:earth-outline',
            value: networkStatistics.value.totalCountriesWithMembers,
            description: 'With Members',
        },
        {
            title: 'Suspended',
            icon: 'solar:user-minus-rounded-line-duotone',
            value: networkStatistics.value.totalSuspended,
            description: 'Members',
        },
        {
            title: 'Blacklisted',
            icon: 'solar:user-cross-rounded-line-duotone',
            value: networkStatistics.value.totalBlacklisted,
            description: 'Members',
        },
    ];
}

onMounted(() => {
    prepareInfoBoxes();
});
const userStore = useUserStore();
</script>
<template>
    <div class="grid lg:grid-cols-12 gap-5">
        <div class="intro-x lg:col-span-12 text-2xl"><span class="font-light">Hello</span>, {{ userStore.user?.name }}</div>
        <UiInfoBox :data="networkInfoBoxes" />
    </div>
</template>
