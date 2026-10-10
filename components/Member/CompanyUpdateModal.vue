<!-- components/Member/CompanyUpdateModal.vue -->
<script setup>
import { email, required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';

const formLoading = ref(false);
const resources = useResourceStore();
const networkSearch = ref('');
const showNetworkOptions = ref(false);

// ✅ متغير لإظهار/إخفاء الباسورد في المودال
const showPassword = ref(false);

function togglePassword() {
    showPassword.value = !showPassword.value;
}

const props = defineProps({
    company: {
        required: true,
        type: Object,
        default: () => null,
    },
    open: {
        required: false,
        type: Boolean,
        default: false,
    },
});

const item = ref({
    id: null,
    name: null,
    address: null,
    city: null,
    status: 'pending',
    company_email: null,
    type: 'member',
    email: null,
    phone: null,
    website: null,
    unhashed_password: null,
    type_company: 'hq',
    phone_key_id: 1,
    country_id: null,
    user_id: null,
    image: null,
    fpp: false,
    active: false,
    users: [],
    network_user_ids: [],
    network_user_states: {},
});

const companyTypes = ref([
    { name: 'Headquarters', value: 'hq' },
    { name: 'Branch', value: 'branch' },
]);

const memberTypes = ref([
    { name: 'Member', value: 'member' },
    { name: 'Founder', value: 'founder' },
    { name: 'Vendor', value: 'vendor' },
    { name: 'Partner', value: 'partner' },
]);

const statuses = ref([
    { name: 'Pending', value: 'pending' },
    { name: 'Approved', value: 'approved' },
    { name: 'Suspended', value: 'suspended' },
    { name: 'Blacklisted', value: 'blacklisted' },
]);

// جلب الـ Users للـ Select
const userSearchParams = ref({
    filters: {},
    orderBy: 'id',
    orderByDirection: 'desc',
    perPage: 1000,
    page: 1,
    paginate: true,
    deleted: false,
});

const { data: usersData } = await useApiFetch('/api/user/index', {
    method: 'POST',
    body: userSearchParams,
    lazy: true,
});

const isAssociationActive = (active) => active === true || active === 1 || active === '1';

const availableNetworks = computed(() => {
    const selectedIds = item.value.network_user_ids || [];
    const query = networkSearch.value.trim().toLowerCase();

    return (usersData.value?.data || []).filter(
        (network) =>
            !selectedIds.some((id) => String(id) === String(network.id)) &&
            (!query || network.name?.toLowerCase().includes(query)),
    );
});

const getNetworkActive = (networkId) => {
    const state = item.value.network_user_states?.[networkId];
    if (state !== undefined) return isAssociationActive(state);

    const association = item.value.users?.find((user) => String(user.id ?? user.user_id) === String(networkId));
    return isAssociationActive(association?.active);
};

const setNetworkActive = (networkId, active) => {
    item.value.network_user_states = {
        ...item.value.network_user_states,
        [networkId]: active,
    };
};

const addNetwork = (networkId) => {
    if (networkId === null || networkId === undefined) return;

    if (!item.value.network_user_ids.some((id) => String(id) === String(networkId))) {
        item.value.network_user_ids = [...item.value.network_user_ids, networkId];
    }
    if (item.value.network_user_states[networkId] === undefined) {
        setNetworkActive(networkId, false);
    }
    networkSearch.value = '';
    showNetworkOptions.value = false;
};

const removeNetwork = (networkId) => {
    item.value.network_user_ids = item.value.network_user_ids.filter((id) => String(id) !== String(networkId));
};

const getNetworkDetails = (networkId) => {
    const option = usersData.value?.data?.find((network) => String(network.id) === String(networkId));
    if (option) return option;

    const association = item.value.users.find((network) => String(network.id ?? network.user_id) === String(networkId));
    if (association) return association;

    return { id: networkId, name: `Network #${networkId}` };
};

function fillData(company) {
    if (!company) return;

    let imageData = company.image || null;
    if (typeof imageData === 'string') {
        imageData = {
            id: company.id,
            fullUrl: imageData,
            name: company.name || 'image',
        };
    }
    if (!imageData && company.imageUrl) {
        imageData = {
            id: company.id,
            fullUrl: company.imageUrl,
            name: company.name || 'image',
        };
    }

    item.value = {
        id: company.id,
        name: company.name || '',
        address: company.address || '',
        city: company.city || '',
        status: company.status || 'pending',
        company_email: company.company_email || '',
        type: company.type || 'member',
        email: company.email || '',
        phone: company.phone || '',
        website: company.website || '',
        unhashed_password: company.unhashed_password || '', // ✅ عرض الباسورد القديم
        type_company: company.type_company || 'hq',
        phone_key_id: company.phone_key_id || 1,
        country_id: company.country?.id || null,
        user_id: company.user?.id || null,
        image: imageData,
        fpp: company.fpp === true || company.fpp === 'yes',
        active: company.active === true,
        users: Array.isArray(company.users) ? company.users : [],
        network_user_ids: [
            ...new Set(
                (Array.isArray(company.users) ? company.users : [])
                    .map((network) => network.id ?? network.user_id)
                    .filter((networkId) => networkId !== null && networkId !== undefined),
            ),
        ],
        network_user_states: Object.fromEntries(
            (Array.isArray(company.users) ? company.users : []).map((network) => [network.id ?? network.user_id, isAssociationActive(network.active)]),
        ),
    };
    const primaryNetworkId = company.user?.id ?? company.user_id;
    if (primaryNetworkId !== null && primaryNetworkId !== undefined && !item.value.network_user_ids.some((id) => String(id) === String(primaryNetworkId))) {
        item.value.network_user_ids = [...item.value.network_user_ids, primaryNetworkId];
        item.value.network_user_states[primaryNetworkId] = isAssociationActive(company.user?.active);
    }
    networkSearch.value = '';
    showNetworkOptions.value = false;
}

watch(
    () => props.company,
    (newVal) => {
        if (newVal) {
            fillData(newVal);
            // ✅ إعادة تعيين حالة الباسورد عند فتح المودال
            showPassword.value = false;
        }
    },
    { immediate: true, deep: true },
);

const rules = ref({
    name: { required },
    company_email: { email },
    email: { required, email },
    status: { required },
    type: { required },
    type_company: { required },
    country_id: { required },
});

const v$ = useVuelidate(rules, item);
const emit = defineEmits(['refresh', 'close']);

const resetItemValues = async () => {
    item.value = {
        id: null,
        name: null,
        address: null,
        city: null,
        status: 'pending',
        company_email: null,
        type: 'member',
        email: null,
        phone: null,
        website: null,
        unhashed_password: null,
        type_company: 'hq',
        phone_key_id: 1,
        country_id: null,
        user_id: null,
        image: null,
        fpp: false,
        active: false,
        users: [],
        network_user_ids: [],
        network_user_states: {},
    };
    showPassword.value = false;
    networkSearch.value = '';
    showNetworkOptions.value = false;
};

async function closeModal() {
    emit('close');
    v$.value?.$reset();
    await resetItemValues();
    formLoading.value = false;
}

async function updateCompany() {
    formLoading.value = true;
    const result = await v$.value.$validate();
    if (!result) {
        formLoading.value = false;
        useToast({ title: 'Error', message: 'Please complete all required fields', type: 'error', duration: 5000 });
        return false;
    }

    let imageId = null;
    if (item.value.image) {
        if (typeof item.value.image === 'number') {
            imageId = item.value.image;
        } else if (item.value.image.id) {
            imageId = item.value.image.id;
        }
    }

    const payload = {
        name: item.value.name,
        address: item.value.address,
        city: item.value.city,
        status: item.value.status,
        company_email: item.value.company_email,
        type: item.value.type,
        email: item.value.email,
        phone: item.value.phone,
        website: item.value.website,
        type_company: item.value.type_company,
        phone_key_id: item.value.phone_key_id || 1,
        country_id: item.value.country_id,
        user_id: item.value.network_user_ids[0] ?? null,
        image: imageId,
        fpp: item.value.fpp,
        active: item.value.active,
        users: item.value.network_user_ids.map((networkId) => ({
            user_id: networkId,
            active: getNetworkActive(networkId),
        })),
    };

    // ✅ لو الباسورد اتغير (مش فاضي) نبعت الجديد
    if (item.value.unhashed_password && item.value.unhashed_password.length > 0) {
        payload.unhashed_password = item.value.unhashed_password;
    }

    const { data, error } = await useApiFetch(`/api/member-network/${props.company.id}`, {
        lazy: true,
        method: 'PUT',
        body: payload,
    });

    if (data.value) {
        useToast({ title: 'Success', message: data.value.message || 'Company updated successfully', type: 'success', duration: 5000 });
        emit('refresh');
        await closeModal();
    }
    if (error.value) {
        useToast({ title: 'Error', message: error.value.message || 'Something went wrong', type: 'error', duration: 5000 });
        formLoading.value = false;
    }
}

async function resendPassword() {
    const { data, error } = await useApiFetch(`/api/email-reset-password`, {
        method: 'POST',
        body: {
            userId: props.company.id,
        },
        lazy: true,
    });
    if (data.value) {
        useToast({ title: 'Success', message: data.value.message, type: 'success', duration: 5000 });
    }
    if (error.value) {
        useToast({ title: 'Error', message: error.value.message, type: 'error', duration: 5000 });
    }
}
</script>

<template>
    <TheModal :open-modal="props.open" size="4xl" @close-modal="closeModal()">
        <template #header>
            <div class="flex justify-between items-center">
                <div class="font-medium text-lg">Update Company Details</div>
                <Icon class="w-8 h-8 opacity-50 cursor-pointer hover:opacity-100 ease-in-out duration-300" name="solar:close-square-outline" @click="closeModal" />
            </div>
        </template>
        <template #content>
            <div v-if="formLoading" class="flex justify-center items-center py-20">
                <Icon name="svg-spinners:3-dots-fade" class="w-12 h-12 text-primary" />
            </div>
            <div v-else>
                <!-- Login Details -->
                <div>
                    <div class="font-medium text-sm ml-4">Login Details</div>
                    <div class="mt-2 border border-slate-100 bg-slate-50/50 rounded-lg grid grid-cols-12 p-5 gap-5">
                        <FormInputField v-model="item.email" :errors="v$.email.$errors" class="col-span-12 lg:col-span-6" label="Login Email *" name="company-email" placeholder="Email" required />

                        <!-- ✅ حقل الباسورد مع زر العين -->
                        <div class="col-span-12 lg:col-span-6">
                            <label class="form-label opacity-75 font-light">Password</label>
                            <div class="relative">
                                <input
                                    v-model="item.unhashed_password"
                                    :type="showPassword ? 'text' : 'password'"
                                    class="form-control form-control-rounded w-full pr-12"
                                    placeholder="Enter new password (leave empty to keep current)"
                                    name="company-password"
                                />
                                <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors" :title="showPassword ? 'Hide password' : 'Show password'" @click="togglePassword">
                                    <Icon :name="showPassword ? 'solar:eye-outline' : 'solar:eye-closed-outline'" class="size-5 opacity-60 hover:opacity-100 transition-all" />
                                </button>
                            </div>
                            <div class="text-xs text-slate-400 mt-1">
                                <span v-if="item.unhashed_password && item.unhashed_password.length > 0" class="text-green-600"> ✓ Current password: {{ showPassword ? item.unhashed_password : '••••••••' }} </span>
                                <span v-else class="text-slate-400">No password set</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Company Details -->
                <div class="mt-6">
                    <div class="font-medium text-sm ml-4">Company Details</div>
                    <div class="mt-2 border border-slate-100 bg-slate-50/50 rounded-lg grid grid-cols-12 p-5 gap-5">
                        <FormInputField v-model="item.name" :errors="v$.name.$errors" class="col-span-12 lg:col-span-6" label="Company Name *" name="company-name" placeholder="Company Name" required />
                        <FormInputField v-model="item.company_email" :errors="v$.company_email.$errors" class="col-span-12 lg:col-span-6" label="Company Email" name="company-email" placeholder="Company Email" type="email" />
                        <FormInputField v-model="item.website" class="col-span-12 lg:col-span-6" label="Website" name="company-website" placeholder="Website" />

                        <FormSelectField
                            id="edit-company-country"
                            v-model="item.country_id"
                            name="edit-company-country"
                            class="col-span-12 lg:col-span-6"
                            label="Country *"
                            placeholder="Select country"
                            :select-data="resources.countries"
                            :errors="v$.country_id.$errors"
                            labelvalue="name"
                            keyvalue="id"
                            imgvalue="imageUrl"
                            required
                        />
                        <FormInputField v-model="item.city" class="col-span-12 lg:col-span-6" label="City" name="company-city" placeholder="City" />
                        <FormInputField v-model="item.address" class="col-span-12 lg:col-span-6" label="Address" name="company-address" placeholder="Address" />
                        <FormSelectField
                            id="edit-company-phone-key"
                            v-model="item.phone_key_id"
                            name="edit-company-phone-key"
                            class="col-span-12 lg:col-span-3"
                            label="Phone Key"
                            placeholder="Select code"
                            :select-data="resources.countries"
                            labelvalue="key"
                            keyvalue="id"
                            imgvalue="imageUrl"
                            prefix="+"
                        />
                        <FormInputField v-model="item.phone" class="col-span-12 lg:col-span-9" label="Phone" name="company-phone" placeholder="Phone" />
                    </div>
                </div>

                <!-- Company Settings -->
                <div class="mt-6">
                    <div class="font-medium text-sm ml-4">Company Settings</div>
                    <div class="mt-2 border border-slate-100 bg-slate-50/50 rounded-lg grid grid-cols-12 p-5 gap-5">
                        <div class="relative col-span-12 lg:col-span-6">
                            <label for="edit-company-user" class="form-label opacity-75 font-light">Associated Networks</label>
                            <input
                                id="edit-company-user"
                                v-model="networkSearch"
                                name="edit-company-user"
                                class="form-control form-control-rounded"
                                autocomplete="off"
                                placeholder="Search and add a network"
                                @focus="showNetworkOptions = true"
                                @input="showNetworkOptions = true"
                            />
                            <div
                                v-if="showNetworkOptions"
                                class="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg"
                            >
                                <button
                                    v-for="network in availableNetworks"
                                    :key="network.id"
                                    type="button"
                                    class="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-slate-50"
                                    @click="addNetwork(network.id)"
                                >
                                    <img
                                        v-if="network.imageUrl"
                                        :src="network.imageUrl"
                                        :alt="network.name"
                                        class="h-7 w-7 shrink-0 rounded-full border border-slate-100 bg-white object-contain"
                                    />
                                    <span v-else class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-500">
                                        {{ network.name?.charAt(0) || '?' }}
                                    </span>
                                    <span class="truncate">{{ network.name }}</span>
                                </button>
                                <div v-if="availableNetworks.length === 0" class="px-4 py-3 text-sm text-slate-500">
                                    {{ networkSearch ? 'No matching networks found' : 'All networks are already selected' }}
                                </div>
                            </div>
                            <div v-if="item.network_user_ids.length" class="mt-3 flex flex-col gap-2">
                                <div
                                    v-for="networkId in item.network_user_ids"
                                    :key="networkId"
                                    class="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2"
                                >
                                    <div class="flex min-w-0 items-center gap-2">
                                        <img
                                            v-if="getNetworkDetails(networkId).imageUrl"
                                            :src="getNetworkDetails(networkId).imageUrl"
                                            :alt="getNetworkDetails(networkId).name"
                                            class="h-7 w-7 shrink-0 rounded-full border border-slate-100 bg-white object-contain"
                                        />
                                        <span v-else class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-500">
                                            {{ getNetworkDetails(networkId).name?.charAt(0) || '?' }}
                                        </span>
                                        <span class="truncate text-sm font-medium">{{ getNetworkDetails(networkId).name }}</span>
                                    </div>
                                    <div class="flex shrink-0 items-center gap-2">
                                        <button
                                            type="button"
                                            class="rounded-full px-2.5 py-1 text-xs font-medium transition"
                                            :class="getNetworkActive(networkId) ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                                            :aria-pressed="getNetworkActive(networkId)"
                                            :aria-label="`${getNetworkDetails(networkId).name}: ${getNetworkActive(networkId) ? 'active' : 'inactive'}. Click to change`"
                                            @click="setNetworkActive(networkId, !getNetworkActive(networkId))"
                                        >
                                            {{ getNetworkActive(networkId) ? 'Active' : 'Inactive' }}
                                        </button>
                                        <button
                                            type="button"
                                            class="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                                            :aria-label="`Remove ${getNetworkDetails(networkId).name}`"
                                            @click="removeNetwork(networkId)"
                                        >
                                            <Icon name="solar:close-circle-linear" class="size-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <FormSelectField
                            id="edit-company-type-company"
                            v-model="item.type_company"
                            name="edit-company-type-company"
                            class="col-span-12 lg:col-span-6"
                            label="Company Type *"
                            placeholder="Select company type"
                            :select-data="companyTypes"
                            :errors="v$.type_company.$errors"
                            labelvalue="name"
                            keyvalue="value"
                            required
                        />
                        <FormSelectField
                            id="edit-company-type"
                            v-model="item.type"
                            name="edit-company-type"
                            class="col-span-12 lg:col-span-4"
                            label="Member Type *"
                            placeholder="Select member type"
                            :select-data="memberTypes"
                            :errors="v$.type.$errors"
                            labelvalue="name"
                            keyvalue="value"
                            required
                        />
                        <FormSelectField
                            id="edit-company-status"
                            v-model="item.status"
                            name="edit-company-status"
                            class="col-span-12 lg:col-span-4"
                            label="Status *"
                            placeholder="Select status"
                            :select-data="statuses"
                            :errors="v$.status.$errors"
                            labelvalue="name"
                            keyvalue="value"
                            required
                        />
                        <!-- FPP و Active Switches -->
                        <div class="col-span-12 grid lg:grid-cols-12 gap-5 pt-2 border-t border-dashed">
                            <div class="lg:col-span-6 flex items-center gap-5">
                                <FormSwitch v-model="item.fpp" label="FPP" name="fpp-toggle" />
                                <FormSwitch v-model="item.active" label="Active" name="active-toggle" />
                            </div>
                        </div>

                        <FormUploader v-model="item.image" class="col-span-12" :allowed-types="['image']" label="Image" name="image" />
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
                        <span>Cancel</span>
                    </button>
                    <button :disabled="formLoading" class="btn-rounded btn-sm btn btn-primary px-4" type="button" @click="updateCompany">
                        <Icon :name="formLoading ? 'svg-spinners:3-dots-fade' : 'solar:check-circle-broken'" class="w-5 h-5 mr-2" />
                        <span>Update</span>
                    </button>
                </div>
            </div>
        </template>
    </TheModal>
</template>
