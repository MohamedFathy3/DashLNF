<script setup>
import { email, numeric, required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';
const formLoading = ref(false);
const resources = useResourceStore();
const years = useYearArray(199);

const props = defineProps({
    member: {
        required: true,
        type: Object,
        default: () => null,
    },
    open: {
        required: false,
        type: Boolean,
    },
});
const item = ref({
    id: props.member?.id,
    name: props.member?.name,
    slogan: props.member?.slogan,
    email: props.member?.email,
    companyEmail: props.member?.companyEmail,
    image: props.member?.image,
    addressLine1: props.member?.addressLine1,
    addressLine2: props.member?.addressLine2,
    city: props.member?.city,
    state: props.member?.state,
    postalCode: props.member?.postalCode,
    countryId: props.member?.countryId,
    phone: props.member?.phone,
    phoneKeyId: props.member?.phoneKeyId,
    fax: props.member?.fax,
    faxKeyId: props.member?.faxKeyId,
    website: props.member?.website,
    profile: props.member?.profile,
    branches: props.member?.branches,
    employeesNum: props.member?.employeesNum,
    businessEst: props.member?.businessEst,
    refValue: props.member?.refValue,
    wsaId: props.member?.wsaId,
    unhashedPassword: props.member?.unhashedPassword,
    typeCompany: props.member?.typeCompany,
    membershipType: props.member?.membershipType,
});
onMounted(() => {
    if (props.member !== null) {
        item.value.id = props.member?.id;
        item.value.name = props.member?.name;
        item.value.slogan = props.member?.slogan;
        item.value.email = props.member?.email;
        item.value.companyEmail = props.member?.companyEmail;
        item.value.image = props.member?.image;
        item.value.addressLine1 = props.member?.addressLine1;
        item.value.addressLine2 = props.member?.addressLine2;
        item.value.city = props.member?.city;
        item.value.state = props.member?.state;
        item.value.postalCode = props.member?.postalCode;
        item.value.countryId = props.member?.countryId;
        item.value.phone = props.member?.phone;
        item.value.phoneKeyId = props.member?.phoneKeyId;
        item.value.fax = props.member?.fax;
        item.value.faxKeyId = props.member?.faxKeyId;
        item.value.website = props.member?.website;
        item.value.profile = props.member?.profile;
        item.value.branches = props.member?.branches;
        item.value.employeesNum = props.member?.employeesNum;
        item.value.businessEst = props.member?.businessEst;
        item.value.refValue = props.member?.refValue;
        item.value.wsaId = props.member?.wsaId;
        item.value.unhashedPassword = props.member?.unhashedPassword;
        item.value.typeCompany = props.member?.typeCompany;
        item.value.membershipType = props.member?.membershipType;
    }
});
const rules = ref({
    name: { required },
    slogan: {},
    companyEmail: { email },
    image: {},
    addressLine1: {},
    addressLine2: {},
    city: {},
    state: {},
    postalCode: {},
    countryId: { required },
    phone: {},
    phoneKeyId: {},
    fax: {},
    faxKeyId: {},
    website: {},
    profile: {},
    branches: {},
    employeesNum: {},
    businessEst: {},
    refValue: {},
    wsaId: { numeric },
    email: { required, email },
    unhashedPassword: {},
    typeCompany: {},
    membershipType: {},
});
const v$ = useVuelidate(rules, item);
const emit = defineEmits(['refresh', 'close']);
const resetMemberValues = async () => {
    item.value = {
        id: null,
        name: null,
        slogan: null,
        email: null,
        companyEmail: null,
        image: null,
        addressLine1: null,
        addressLine2: null,
        city: null,
        state: null,
        postalCode: null,
        countryId: null,
        phone: null,
        phoneKeyId: null,
        fax: null,
        faxKeyId: null,
        website: null,
        profile: null,
        branches: null,
        employeesNum: null,
        businessEst: null,
        refValue: null,
        wsaId: null,
        unhashedPassword: null,
        typeCompany: null,
        membershipType: null,
    };
};
const nonMembershipTypes = ref([
    { name: 'Vendor', value: 'vendor' },
    { name: 'Non Member', value: 'non_member' },
    { name: 'LNF Team', value: 'wsa_team' },
]);
const membershipTypes = ref([
    { name: 'Member', value: 'member' },
    { name: 'Founder', value: 'founder' },
    { name: 'Partner', value: 'partner' },
    { name: 'Vendor', value: 'vendor' },
    { name: 'Non Member', value: 'non_member' },
    { name: 'LNF Team', value: 'wsa_team' },
]);

async function closeModal() {
    emit('close');
    v$.value.$reset();
    await resetMemberValues();
    formLoading.value = false;
}
async function updateMember() {
    formLoading.value = true;
    const result = await v$.value.$validate();
    if (!result) {
        formLoading.value = false;
        useToast({ title: 'Error', message: 'Please complete all required fields', type: 'error', duration: 5000 });
        return false;
    }
    const { data, error } = await useApiFetch(`/api/dashboard/member/update/${props.member.id}`, {
        lazy: true,
        method: 'PATCH',
        body: item,
    });

    if (data.value) {
        useToast({ title: 'Success', message: data.value.message, type: 'success', duration: 5000 });
        emit('refresh');
        emit('close');
        await closeModal();
        formLoading.value = false;
    }
    if (error.value) {
        useToast({ title: 'Error', message: data.value.message ?? data.value.data.message, type: 'error', duration: 5000 });
        formLoading.value = false;
    }
}
async function resendPassword() {
    const { data, error } = await useApiFetch(`/api/event/email-reset-password`, {
        method: 'POST',
        body: {
            type: 'company',
            personId: props.member.id,
        },
        lazy: true,
    });
    if (data.value) {
        useToast({ title: 'Success', message: data.value.message, type: 'success', duration: 5000 });
    }
    if (error.value) {
        useToast({ title: 'Error', message: data.value.message, type: 'error', duration: 5000 });
    }
}
function checkSlugs(form, data, slug) {
    const itemId = data.find((item) => item.slug === slug)?.id || 0;
    return form && form.includes(itemId);
}
const companyTypes = ref([
    { name: 'HQ', value: 'hq' },
    { name: 'Branch', value: 'branch' },
]);
</script>
<template>
    <TheModal :open-modal="props.open" size="5xl" @close-modal="closeModal()">
        <template #header>
            <div class="flex justify-between items-center">
                <div class="font-medium" v-html="'Update Member Details'" />
                <Icon class="w-8 h-8 opacity-50 cursor-pointer hover:opacity-100 ease-in-out duration-300" name="solar:close-square-outline" @click="closeModal" />
            </div>
        </template>
        <template #content>
            <div>
                <div>
                    <div class="font-medium text-sm ml-4">Login Details</div>
                    <div class="mt-2 border border-slate-100 bg-slate-50/50 rounded-lg grid grid-cols-12 p-5 gap-5">
                        <FormInputField v-model="item.email" :errors="v$.email.$errors" class="col-span-12 lg:col-span-6" label="Email" name="company-email" placeholder="Email" />
                        <FormInputField v-model="item.unhashedPassword" :errors="v$.unhashedPassword.$errors" class="col-span-12 lg:col-span-6" label="Password" name="company-password" placeholder="Password" />
                    </div>
                </div>
                <div class="mt-6">
                    <div class="font-medium text-sm ml-4">Membership Details</div>
                    <div class="mt-2 border border-slate-100 bg-slate-50/50 rounded-lg grid grid-cols-12 p-5 gap-5">
                        <FormSelectField
                            v-model="item.typeCompany"
                            :errors="v$.typeCompany.$errors"
                            labelvalue="name"
                            keyvalue="value"
                            :select-data="companyTypes"
                            class="col-span-12 lg:col-span-4"
                            label="Company Type"
                            name="company-type-company"
                            placeholder="Company Type"
                        />
                        <FormSelectField
                            v-model="item.membershipType"
                            :errors="v$.membershipType.$errors"
                            labelvalue="name"
                            keyvalue="value"
                            :clearable="false"
                            :select-data="props.member.networks.length === 0 ? nonMembershipTypes : membershipTypes"
                            class="col-span-12 lg:col-span-4"
                            label="Membership Type"
                            name="company-membership-type"
                            placeholder="Membership Type"
                        />
                        <FormInputField v-model="item.wsaId" :errors="v$.wsaId.$errors" class="col-span-12 lg:col-span-4" type="number" label="LNF ID" name="wsa-id" placeholder="LNF ID" />
                    </div>
                </div>
                <div class="mt-6">
                    <div class="font-medium text-sm ml-4">Company Details</div>
                    <div class="mt-2 border border-slate-100 bg-slate-50/50 rounded-lg grid grid-cols-12 p-5 gap-5">
                        <FormInputField v-model="item.name" :errors="v$.name.$errors" class="col-span-12 lg:col-span-6" label="Name" name="company-name" placeholder="Name" />
                        <FormInputField v-model="item.slogan" :errors="v$.slogan.$errors" class="col-span-12 lg:col-span-6" label="Slogan" name="company-slogan" placeholder="Slogan" />
                        <FormInputField v-model="item.addressLine1" :errors="v$.addressLine1.$errors" class="col-span-12" label="Address Line 1" name="company-slogan" placeholder="Address Line 1" />
                        <FormInputField v-model="item.addressLine2" :errors="v$.addressLine2.$errors" class="col-span-12" label="Address Line 2" name="company-slogan" placeholder="Address Line 2" />
                        <FormSelectField
                            id="add-member-country-form"
                            v-model="item.countryId"
                            class="col-span-12 lg:col-span-4"
                            placeholder="Please select a country..."
                            :select-data="resources?.countries"
                            :errors="v$.countryId.$errors"
                            labelvalue="name"
                            keyvalue="id"
                            label="Country"
                            imgvalue="imageUrl"
                        />
                        <FormInputField v-model="item.state" :errors="v$.state.$errors" class="col-span-12 lg:col-span-4" label="State" name="company-state" placeholder="State" />
                        <FormInputField v-model="item.city" :errors="v$.city.$errors" class="col-span-12 lg:col-span-4" label="City" name="company-city" placeholder="City" />
                        <FormInputField v-model="item.postalCode" :errors="v$.postalCode.$errors" class="col-span-12 lg:col-span-4" label="Postal Code" name="company-postal-code" placeholder="Postal Code" />
                        <FormInputField
                            v-model="item.employeesNum"
                            :errors="v$.employeesNum.$errors"
                            class="col-span-12 lg:col-span-4"
                            label="Approximate Number Of Employees"
                            name="company-employees-num"
                            placeholder="Approximate Number Of Employees"
                        />
                        <FormSelectField
                            v-model="item.businessEst"
                            :errors="v$.businessEst.$errors"
                            labelvalue="name"
                            keyvalue="id"
                            :select-data="years"
                            class="col-span-12 lg:col-span-4"
                            label="Business Establish Year"
                            name="company-business-est"
                            placeholder="Business Establish Year"
                        />
                        <FormInputField v-model="item.companyEmail" :errors="v$.companyEmail.$errors" class="col-span-12 lg:col-span-6" label="Company Email" name="company-contact-email" placeholder="Company Email" />
                        <FormInputField v-model="item.website" :errors="v$.website.$errors" class="col-span-12 lg:col-span-6" label="Website" name="company-website" placeholder="Website" />
                        <FormSelectField
                            v-model="item.phoneKeyId"
                            labelvalue="key"
                            keyvalue="id"
                            imgvalue="imageUrl"
                            :select-data="resources?.countries"
                            :errors="v$.phoneKeyId.$errors"
                            prefix="+"
                            class="col-span-12 lg:col-span-3"
                            label="Country Key"
                            name="company-phone-key"
                            placeholder="Country Key"
                        />
                        <FormInputField v-model="item.phone" :errors="v$.phone.$errors" class="col-span-12 lg:col-span-3" label="Phone" name="company-phone" placeholder="Phone" />
                        <FormSelectField
                            v-model="item.faxKeyId"
                            labelvalue="key"
                            keyvalue="id"
                            imgvalue="imageUrl"
                            :select-data="resources?.countries"
                            :errors="v$.faxKeyId.$errors"
                            prefix="+"
                            class="col-span-12 lg:col-span-3"
                            label="Country Key"
                            name="company-fax-key"
                            placeholder="Country Key"
                        />
                        <FormInputField v-model="item.fax" :errors="v$.fax.$errors" class="col-span-12 lg:col-span-3" label="Fax" name="company-fax" placeholder="Fax" />

                        <div class="col-span-12 grid grid-cols-12 gap-8 gap-y-4">
                            <div class="col-span-12 lg:col-span-6">
                                <FormUploader v-model="item.image" class="col-span-12" :allowed-types="['image', 'svg']" label="Flag" name="image" />
                            </div>
                            <div class="col-span-12 lg:col-span-6">
                                <FormInputField v-model="item.profile" :errors="v$.profile.$errors" class="col-span-12" label="Company profile" type="textarea" name="company-profile" placeholder="Company profile" />
                                <FormInputField v-model="item.branches" :errors="v$.branches.$errors" class="mt-2 col-span-12" label="Branches Details" type="textarea" name="company-branches" placeholder="Branches Details" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>
        <template #footer>
            <div class="w-full flex items-center justify-end gap-5">
                <button :disabled="formLoading" class="btn-rounded btn-sm btn btn-warning px-4" type="button" @click="resendPassword">
                    <Icon :name="formLoading ? 'svg-spinners:3-dots-fade' : 'solar:circle-top-up-linear'" class="w-5 h-5 mr-2" />
                    <span>Resend Password</span>
                </button>
                <div class="flex items-center justify-end gap-5">
                    <button :disabled="formLoading" class="btn-rounded btn-sm btn btn-danger px-4" type="button" @click="closeModal">
                        <Icon :name="formLoading ? 'svg-spinners:3-dots-fade' : 'solar:close-circle-linear'" class="w-5 h-5 mr-2" />
                        <span>Close</span>
                    </button>
                    <button :disabled="formLoading" class="btn-rounded btn-sm btn btn-primary px-4" type="button" @click="updateMember">
                        <Icon :name="formLoading ? 'svg-spinners:3-dots-fade' : 'solar:check-circle-broken'" class="w-5 h-5 mr-2" />
                        <span v-html="'update'" />
                    </button>
                </div>
            </div>
        </template>
    </TheModal>
</template>
