<!-- components/Member/CompanyUpdateModal.vue -->
<script setup>
import { email, required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';

const formLoading = ref(false);
const resources = useResourceStore();

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
    };
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
    };
    showPassword.value = false;
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
        image: imageId,
        fpp: item.value.fpp,
        active: item.value.active,
    };

    // ✅ لو الباسورد اتغير (مش فاضي) نبعت الجديد
    if (item.value.unhashed_password && item.value.unhashed_password.length > 0) {
        payload.unhashed_password = item.value.unhashed_password;
    }

    if (item.value.user_id) {
        payload.user_id = item.value.user_id;
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
                                    :type="showPassword ? 'text' : 'password'"
                                    v-model="item.unhashed_password"
                                    class="form-control form-control-rounded w-full pr-12"
                                    placeholder="Enter new password (leave empty to keep current)"
                                    name="company-password"
                                />
                                <button type="button" @click="togglePassword" class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors" :title="showPassword ? 'Hide password' : 'Show password'">
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
                        <FormInputField v-model="item.address" class="col-span-12" label="Address" name="company-address" placeholder="Address" />
                        <FormInputField v-model="item.phone" class="col-span-12 lg:col-span-6" label="Phone" name="company-phone" placeholder="Phone" />
                        <FormInputField v-model="item.website" class="col-span-12 lg:col-span-6" label="Website" name="company-website" placeholder="Website" />
                    </div>
                </div>

                <!-- Company Settings -->
                <div class="mt-6">
                    <div class="font-medium text-sm ml-4">Company Settings</div>
                    <div class="mt-2 border border-slate-100 bg-slate-50/50 rounded-lg grid grid-cols-12 p-5 gap-5">
                        <FormSelectField
                            id="edit-company-user"
                            v-model="item.user_id"
                            name="edit-company-user"
                            class="col-span-12 lg:col-span-6"
                            label="Associated User (Network)"
                            placeholder="Select user"
                            :select-data="usersData?.data || []"
                            labelvalue="name"
                            keyvalue="id"
                            imgvalue="imageUrl"
                            secondlabelvalue="email"
                            thirdlabelvalue="country.name"
                            disabled
                        />
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
                        <FormSelectField
                            id="edit-company-phone-key"
                            v-model="item.phone_key_id"
                            name="edit-company-phone-key"
                            class="col-span-12 lg:col-span-4"
                            label="Phone Key"
                            placeholder="Select phone key"
                            :select-data="resources.countries"
                            labelvalue="name"
                            keyvalue="id"
                            imgvalue="imageUrl"
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
