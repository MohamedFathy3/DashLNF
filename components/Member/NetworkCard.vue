<script setup>
const props = defineProps({
    network: {
        required: true,
        type: Object,
        default: () => ({
            networkId: null,
            type: null,
            status: null,
            active: false,
            network: false,
            fpp: false,
            startDate: null,
            expireDate: null,
        }),
    },
    memberId: {
        required: true,
        type: Number,
    },
});
const emit = defineEmits(['refresh']);
const isOpen = ref(false);
function onSuccessUpdate() {
    emit('refresh');
}
function openModal() {
    isOpen.value = true;
}
function closeModal() {
    isOpen.value = false;
}
</script>
<template>
    <div class="bg-white rounded-xl p-5 shadow-sm">
        <div class="flex items-center justify-between gap-5 pb-3 border-b">
            <div class="font-medium flex items-center gap-1.5">
                <Icon name="solar:global-outline" class="size-5 opacity-75" />
                {{ props.network.name }}
            </div>
            <button class="flex items-center btn btn-sm btn-secondary btn-rounded" @click="openModal">
                <Icon class="size-4 mr-1" name="solar:pen-new-round-outline" />
                Update
            </button>
        </div>
        <ul class="pt-3 divide-y divide-dashed !divide-slate-100 text-sm">
            <li class="py-1.5 flex items-center justify-between min-h-10">
                <div class="flex items-center gap-1.5">
                    <Icon name="solar:bookmark-linear" class="size-4 opacity-75" />
                    Status
                </div>
                <UiStatusBadge :data="props.network.status" />
            </li>
            <li class="py-1.5 flex items-center justify-between min-h-10">
                <div class="flex items-center gap-1.5">
                    <Icon name="solar:bookmark-linear" class="size-4 opacity-75" />
                    Type
                </div>
                <UiNetworkTypeBadge :data="props.network.type" />
            </li>
            <li class="py-1.5 flex items-center justify-between min-h-10">
                <div class="flex items-center gap-1.5">
                    <Icon name="solar:bill-list-outline" class="size-4 opacity-75" />
                    Visibility
                </div>
                <div :class="[props.network.network ? 'text-success' : 'text-danger', 'font-medium']" v-html="props.network.network ? 'Visible' : 'Invisible'" />
            </li>
            <li class="py-1.5 flex items-center justify-between min-h-10">
                <div class="flex items-center gap-1.5">
                    <Icon name="solar:shield-user-linear" class="size-4 opacity-75" />
                    FPP
                </div>
                <div :class="[props.network.fpp ? 'text-success' : 'text-danger', 'font-medium']" v-html="props.network.fpp ? 'Active' : 'Inactive'" />
            </li>
            <li class="py-1.5 flex items-center justify-between min-h-10">
                <div class="flex items-center gap-1.5">
                    <Icon name="solar:login-3-linear" class="size-4 opacity-75" />
                    Active
                </div>
                <div :class="[props.network.active ? 'text-success' : 'text-danger', 'font-medium']" v-html="props.network.active ? 'Active' : 'Inactive'" />
            </li>
            <template v-if="network.status !== 'pending'">
                <li class="py-1.5 flex flex-col justify-between min-h-10">
                    <div class="flex items-center gap-1.5">
                        <Icon name="solar:calendar-linear" class="size-4 opacity-75" />
                        Member Since
                    </div>
                    <div class="font-medium ml-6">{{ props.network.startDateFormatted }}</div>
                </li>
                <li class="py-1.5 flex flex-col justify-between min-h-10">
                    <div class="flex items-center gap-1.5">
                        <Icon name="solar:calendar-linear" class="size-4 opacity-75" />
                        Expire Date
                    </div>
                    <div class="font-medium ml-6">{{ props.network.expireDateFormatted }}</div>
                </li>
                <li class="py-1.5 flex flex-col justify-between min-h-10">
                    <div class="flex items-center gap-1.5">
                        <Icon name="solar:calendar-linear" class="size-4 opacity-75" />
                        Membership Ends
                    </div>
                    <div class="font-medium ml-6">{{ props.network.expireDaysLeft }}</div>
                </li>
            </template>
            <template v-else>
                <li class="py-1.5 flex flex-col justify-between min-h-10">
                    <div class="flex items-center gap-1.5">
                        <Icon name="solar:calendar-linear" class="size-4 opacity-75" />
                        Application Submitted
                    </div>
                    <div class="font-medium ml-6">{{ props.network.createdAt }}</div>
                </li>
                <li class="py-1.5 flex flex-col justify-between min-h-10">
                    <div class="flex items-center gap-1.5">
                        <Icon name="solar:watch-round-line-duotone" class="size-4 opacity-75" />
                        Submitted Since
                    </div>
                    <div class="font-medium ml-6">{{ props.network.createdSince }}</div>
                </li>
            </template>
        </ul>
        <MemberNetworkModal v-if="isOpen" :open="isOpen" :network="props.network" :member-id="props.memberId" @close="closeModal" @refresh="onSuccessUpdate" />
    </div>
</template>
