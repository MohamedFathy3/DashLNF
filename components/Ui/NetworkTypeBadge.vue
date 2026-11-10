<script lang="ts" setup>
import { memberTypes } from '~/utils/member-types';

const props = defineProps({
    data: {
        type: String,
        default: null,
        required: true,
    },
});

const legacyMembershipTypeNames: Record<string, string> = {
    founder: 'Founder',
    partner: 'Partner',
    vendor: 'Vendor',
    non_member: 'Non Member',
    wsa_team: 'LNF Team',
};

const elementStyle = computed(() => {
    if (!props.data) return '';

    switch (props.data) {
        case 'member':
            return 'bg-success/25 text-green-700 border !border-success/25';
        case 'global_partner':
        case 'associate':
        case 'founder':
            return 'bg-blue-100 text-blue-700 border !border-blue-200';
        case 'global_client':
        case 'ucn_hq':
        case 'ucn_china':
        case 'ucn_e_commerce':
        case 'partner':
        case 'vendor':
            return 'bg-yellow-100 text-yellow-700 border !border-yellow-200';
        case 'non_member':
            return 'bg-slate-100 text-slate-700 border !border-slate-200';
        case 'wsa_team':
            return 'bg-red-100 text-red-700 border !border-red-200';
        default:
            return 'bg-slate-100 text-slate-700 border !border-slate-200';
    }
});

const typeName = computed(() => memberTypes.find((type) => type.value === props.data)?.name ?? legacyMembershipTypeNames[props.data] ?? props.data);
</script>

<template>
    <span :class="elementStyle" class="text-xs font-medium py-[0.23rem] px-2 rounded-full">{{ typeName }}</span>
</template>
