<script setup>
const props = defineProps({
    member: {
        required: true,
        type: Object,
        default: () => null,
    },
});

const resources = useResourceStore();
</script>
<template>
    <div class="bg-white rounded-xl p-5 shadow-sm">
        <div class="flex items-center justify-between gap-5 pb-3 border-b">
            <div class="font-medium flex items-center gap-1.5">
                <Icon name="solar:menu-dots-square-outline" class="size-5 opacity-75" />
                Extra Details
            </div>
        </div>
        <ul class="pt-3 divide-y divide-dashed !divide-slate-100 text-sm">
            <li v-if="props.member?.eventRegisterDate" class="py-1.5 flex flex-col justify-between min-h-10">
                <div class="flex items-center gap-1.5">
                    <Icon name="solar:calendar-linear" class="size-4 opacity-75" />
                    Reg. Date
                </div>
                <div class="font-medium ml-6">{{ props.member.eventRegisterDate }}</div>
            </li>
            <li v-if="props.member?.membershipType" class="py-1.5 flex items-center justify-between min-h-10">
                <div class="flex items-center gap-1.5">
                    <Icon name="solar:bookmark-linear" class="size-4 opacity-75" />
                    Membership
                </div>
                <UiNetworkTypeBadge :data="props.member.membershipType" />
            </li>
            <li class="py-1.5 flex items-center justify-between min-h-10">
                <div class="flex items-center gap-1.5">
                    <Icon name="solar:bookmark-linear" class="size-4 opacity-75" />
                    Company Type
                </div>
                <UiCompanyTypeBadge v-if="props.member.typeCompany" :data="props.member.typeCompany" />
                <div v-else class="font-light ml-6">---</div>
            </li>
            <li :class="[props.member.referralId && 'flex-col', 'py-1.5 flex justify-between min-h-10']">
                <div class="flex items-center gap-1.5">
                    <Icon name="solar:multiple-forward-left-linear" class="size-4 opacity-75" />
                    Referral
                </div>
                <template v-if="props.member.referralId">
                    <div class="font-medium ml-6">{{ resources?.referrals.find((r) => r.id === props.member.referralId)?.name }}</div>
                    <div v-if="props.member?.refValue" class="font-light ml-6">{{ props.member?.refValue }}</div>
                </template>
                <div v-else class="font-light ml-6">---</div>
            </li>
            <li class="py-1.5 flex justify-between min-h-10">
                <div class="flex items-center gap-1.5">
                    <Icon name="solar:user-speak-linear" class="size-4 opacity-75" />
                    Agent
                </div>
                <div v-if="props.member?.ref" class="font-medium ml-6">{{ props.member.ref?.name }}</div>
                <div v-else class="font-light ml-6">---</div>
            </li>
            <li class="py-1.5 flex flex-col justify-between min-h-10">
                <div class="flex items-center gap-1.5">
                    <Icon name="solar:globus-linear" class="size-4 opacity-75" />
                    Detected Country
                </div>
                <div v-if="props.member?.detectedCountryName" class="font-medium ml-6">{{ props.member?.detectedCountryName }}</div>
                <div v-else class="font-light ml-6">---</div>
            </li>
        </ul>
    </div>
</template>
