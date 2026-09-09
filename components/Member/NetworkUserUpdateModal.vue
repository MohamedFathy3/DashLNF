<script setup>
import { email, required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';

const props = defineProps({
    open: { type: Boolean, default: false },
    user: { type: Object, required: true },
    networkOnly: { type: Boolean, default: false },
});
const emit = defineEmits(['close', 'refresh']);
const resources = useResourceStore();
const formLoading = ref(false);
const item = ref({});

const membershipStatuses = [
    { name: 'Pending', value: 'pending' },
    { name: 'Approved', value: 'approved' },
    { name: 'Suspended', value: 'suspended' },
    { name: 'Blacklisted', value: 'blacklisted' },
];
const networkTypes = [
    { name: 'Member', value: 'member' },
    { name: 'Founder', value: 'founder' },
];
const rules = {
    name: { required },
    email: { required, email },
};
const v$ = useVuelidate(rules, item);

const toImageValue = (user) => {
    if (user.image) return user.image;
    if (user.imageUrl) return { id: user.id, fullUrl: user.imageUrl, name: user.name || 'image' };
    return null;
};

const fillItem = (user) => {
    item.value = {
        ...user,
        phone_key_id: user.phone_key_id ?? user.phoneKeyId ?? user.phone_key ?? null,
        type_network: user.type_network ?? user.typeNetwork ?? user.type ?? 'member',
        fpp: user.fpp === true || user.fpp === 'yes',
        image: toImageValue(user),
    };
};

const closeModal = () => {
    emit('close');
    v$.value.$reset();
    formLoading.value = false;
};

const submit = async () => {
    formLoading.value = true;
    const valid = await v$.value.$validate();
    if (!valid) {
        formLoading.value = false;
        useToast({ title: 'Error', message: 'Please complete all required fields', type: 'error', duration: 5000 });
        return;
    }

    const imageId = typeof item.value.image === 'object' ? item.value.image?.id : item.value.image;
    const payload = {
        name: item.value.name,
        addressLineOne: item.value.addressLineOne,
        addressLineTwo: item.value.addressLineTwo,
        city: item.value.city,
        state: item.value.state,
        postalCode: item.value.postalCode,
        countryId: item.value.countryId,
        website: item.value.website,
        phone: item.value.phone,
        phone_key_id: item.value.phone_key_id,
        type_network: item.value.type_network,
        membersCount: item.value.membersCount,
        businessEst: item.value.businessEst,
        profile: item.value.profile,
        fpp: item.value.fpp ? 'yes' : 'no',
        email: item.value.email,
        unhashed_password: item.value.unhashed_password,
        status: item.value.status || 'pending',
        active: Boolean(item.value.active),
        show_home: Boolean(item.value.show_home),
        image: imageId,
    };

    const { data, error } = await useApiFetch(`/api/user/${props.user.id}`, {
        method: 'PUT',
        body: payload,
    });

    if (data.value) {
        useToast({ title: 'Success', message: data.value.message || 'User updated successfully', type: 'success', duration: 5000 });
        emit('refresh');
        closeModal();
    }
    if (error.value) {
        useToast({ title: 'Error', message: error.value?.data?.message || error.value?.message || 'Failed to update user', type: 'error', duration: 5000 });
    }
    formLoading.value = false;
};

watch(
    () => [props.open, props.user],
    ([open, user]) => {
        if (open && user) fillItem(user);
    },
    { immediate: true, deep: true },
);
</script>

<template>
    <TheModal :open-modal="props.open" size="4xl" @close-modal="closeModal">
        <template #header>
            <div class="flex justify-between items-center">
                <div class="font-medium text-lg">{{ props.networkOnly ? 'Edit Network Details' : 'Edit Network' }}</div>
                <Icon name="solar:close-square-outline" class="w-8 h-8 opacity-50 cursor-pointer" @click="closeModal" />
            </div>
        </template>
        <template #content>
            <div v-if="formLoading" class="flex justify-center items-center py-20">
                <Icon name="svg-spinners:3-dots-fade" class="w-12 h-12 text-primary" />
            </div>
            <div v-else class="grid lg:grid-cols-12 gap-6">
                <div v-if="!props.networkOnly" class="lg:col-span-12">
                    <h4 class="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">Basic Information</h4>
                    <div class="grid lg:grid-cols-12 gap-5">
                        <FormInputField v-model="item.name" :errors="v$.name.$errors" class="lg:col-span-6" label="Name *" placeholder="Enter name" required />
                        <FormInputField v-model="item.email" :errors="v$.email.$errors" class="lg:col-span-6" label="Email *" placeholder="Enter email" type="email" required />
                        <FormSelectField v-model="item.phone_key_id" labelvalue="key" keyvalue="id" imgvalue="imageUrl" prefix="+" :select-data="resources.countries" class="lg:col-span-3" label="Phone Key" name="user-phone-key-id" placeholder="Phone key" />
                        <FormInputField v-model="item.phone" class="lg:col-span-3" label="Phone" placeholder="Enter phone" />
                        <FormInputField v-model="item.website" class="lg:col-span-6" label="Website" placeholder="Enter website" />
                        <FormSelectField v-if="!props.networkOnly" v-model="item.type_network" :select-data="networkTypes" labelvalue="name" keyvalue="value" class="lg:col-span-6" label="Network Type" name="type-network" placeholder="Select network type" />
                    </div>
                </div>

                <div v-if="!props.networkOnly" class="lg:col-span-12">
                    <h4 class="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">Address Information</h4>
                    <div class="grid lg:grid-cols-12 gap-5">
                        <FormInputField v-model="item.addressLineOne" class="lg:col-span-6" label="Address Line 1" placeholder="Enter address" />
                        <FormInputField v-model="item.addressLineTwo" class="lg:col-span-6" label="Address Line 2" placeholder="Enter address" />
                        <FormInputField v-model="item.city" class="lg:col-span-4" label="City" placeholder="Enter city" />
                        <FormInputField v-model="item.state" class="lg:col-span-4" label="State" placeholder="Enter state" />
                        <FormInputField v-model="item.postalCode" class="lg:col-span-4" label="Postal Code" placeholder="Enter postal code" />
                        <FormSelectField v-model="item.countryId" class="lg:col-span-6" label="Country *" placeholder="Select country" :select-data="resources.countries" labelvalue="name" keyvalue="id" imgvalue="imageUrl" required />
                    </div>
                </div>

                <div v-if="!props.networkOnly" class="lg:col-span-12">
                    <h4 class="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">Business Details</h4>
                    <div v-if="!props.networkOnly" class="grid lg:grid-cols-12 gap-5">
                        <FormInputField v-model="item.membersCount" class="lg:col-span-4" label="Members Count" type="number" />
                        <FormInputField v-model="item.businessEst" class="lg:col-span-4" label="Business Established Year" type="number" />
                        <div class="lg:col-span-4 flex items-center pt-2">
                            <FormSwitch v-model="item.fpp" label="FPP Status" name="fpp-status" />
                        </div>
                        <FormInputField v-model="item.profile" class="lg:col-span-12" label="Profile" type="textarea" rows="4" />
                    </div>
                </div>

                <div v-if="props.networkOnly" class="lg:col-span-12">
                    <h4 class="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">Network Details</h4>
                    <div class="grid lg:grid-cols-12 gap-5">
                        <FormSelectField v-model="item.type_network" :select-data="networkTypes" labelvalue="name" keyvalue="value" class="lg:col-span-6" label="Network Type" name="network-type-only" placeholder="Select network type" />
                        <FormSelectField v-model="item.status" :select-data="membershipStatuses" labelvalue="name" keyvalue="value" class="lg:col-span-6" label="Status *" name="network-status-only" placeholder="Select status" required />
                        <FormInputField v-model="item.membersCount" class="lg:col-span-4" label="Members Count" type="number" />
                        <FormInputField v-model="item.businessEst" class="lg:col-span-4" label="Business Established Year" type="number" />
                        <div class="lg:col-span-4 flex items-center pt-2">
                            <FormSwitch v-model="item.fpp" label="FPP Status" name="network-fpp-status" />
                        </div>
                    </div>
                </div>

                <div v-if="!props.networkOnly" class="lg:col-span-12">
                    <h4 class="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">Settings</h4>
                    <div class="grid lg:grid-cols-12 gap-5">
                        <FormSelectField v-model="item.status" class="lg:col-span-4" label="Status *" :select-data="membershipStatuses" labelvalue="name" keyvalue="value" required />
                        <div class="lg:col-span-4 flex items-center pt-2"><FormSwitch v-model="item.active" label="Active" name="active-toggle" /></div>
                    </div>
                </div>

                <FormUploader v-if="!props.networkOnly" v-model="item.image" class="lg:col-span-12" :allowed-types="['image']" label="Image" name="image" />
            </div>
        </template>
        <template #footer>
            <div class="w-full flex items-center justify-end gap-5">
                <button class="btn-rounded btn-sm btn btn-danger px-6 py-2.5" type="button" :disabled="formLoading" @click="closeModal">Cancel</button>
                <button class="btn-rounded btn-sm btn btn-primary px-6 py-2.5" type="button" :disabled="formLoading" @click="submit">Update</button>
            </div>
        </template>
    </TheModal>
</template>
