<script setup>
import { email, required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';

const formLoading = ref(false);
const loadingModal = ref(true);
const editMode = ref(false);
const resources = useResourceStore();

const props = defineProps({
    personId: {
        type: Number,
        default: null,
    },
    memberId: {
        type: Number,
        default: null,
    },
    open: {
        required: false,
        type: Boolean,
        default: false,
    },
    editMode: {
        type: Boolean,
        default: false,
    },
});

// ✅ تحديث الـ item عشان يطابق الـ JSON
const item = ref({
    id: null,
    title: null,
    member_network_id: null,
    memberNetwork: null, // ✅ أضفنا memberNetwork
    image: null,
    name: null,
    job_title: null,
    phone: null,
    cell_number: null,
    email: null,
    birth_date: null,
    phone_key_id: null,
    phone_key: null,
    phoneKeyId: null,
    phoneKey: null,
    imageUrl: null,
    deleted: null,
    deletedAt: null,
    createdAt: null,
    updatedAt: null,
});

// ✅ تحديث قواعد التحقق
const rules = ref({
    title: { required },
    name: { required },
    email: { required, email },
    job_title: { required },
    phone: { required },
    phone_key_id: { required },
    phone_key: {},
    birth_date: {},
    cell_number: {},
    image: {},
});

const v$ = useVuelidate(rules, item);
const emit = defineEmits(['refresh', 'close']);

// ✅ تحديث دالة reset
const resetPersonValues = async () => {
    item.value = {
        id: null,
        title: null,
        member_network_id: null,
        memberNetwork: null,
        image: null,
        name: null,
        job_title: null,
        phone: null,
        cell_number: null,
        email: null,
        birth_date: null,
        phone_key_id: null,
        phone_key: null,
        phoneKeyId: null,
        phoneKey: null,
        imageUrl: null,
        deleted: null,
        deletedAt: null,
        createdAt: null,
        updatedAt: null,
    };
};

async function closeModal() {
    emit('close');
    v$.value?.$reset();
    await resetPersonValues();
    formLoading.value = false;
    loadingModal.value = true;
}

// ✅ تحديث دالة جلب البيانات
// ملاحظة مهمة: شلنا lazy: true عشان الـ await يستنى فعليًا رد السيرفر
// والشرط بقى بيتحقق من data.value?.result بدل data.result (لأن data نفسها ref)
const fetchItem = async (id) => {
    console.log('🟡 [fetchItem] START — id:', id);
    loadingModal.value = true;

    const { data, error } = await useApiFetch(`/api/contact-person-network/${id}`);

    // 🔍 دي اللوجز الأساسية اللي هتوريك فين المشكلة بالظبط
    console.log('🔵 [fetchItem] data.value:', data.value);
    console.log('🔵 [fetchItem] error.value:', error.value);
    console.log('🔵 [fetchItem] data.value?.result:', data.value?.result);
    console.log('🔵 [fetchItem] data.value?.data:', data.value?.data);

    if (data.value?.result === 'Success' || data.value?.data) {
        console.log('🟢 [fetchItem] الشرط اتحقق، هيتم ملأ الفورم');
        // ✅ البيانات بتيجي جوه data.value.data
        const personData = data.value.data || data.value;
        console.log('🟢 [fetchItem] personData:', personData);

        // ✅ خريطة كل الحقول من JSON
        item.value = {
            id: personData.id || null,
            title: personData.title || null,
            member_network_id: personData.member_network_id || null,
            memberNetwork: personData.memberNetwork || null,
            image: personData.image || null,
            name: personData.name || null,
            job_title: personData.job_title || null,
            phone: personData.phone || null,
            cell_number: personData.cell_number || null,
            email: personData.email || null,
            birth_date: personData.birth_date || null,
            phone_key_id: personData.phoneKeyId || personData.phone_key_id || null,
            phoneKeyId: personData.phoneKeyId || null,
            phoneKey: personData.phoneKey || null,
            imageUrl: personData.imageUrl || null,
            deleted: personData.deleted || null,
            deletedAt: personData.deletedAt || null,
            createdAt: personData.createdAt || null,
            updatedAt: personData.updatedAt || null,
        };
        loadingModal.value = false;
        console.log('🟢 [fetchItem] item.value بعد الملء:', item.value);
    } else {
        console.warn('🔴 [fetchItem] الشرط مش بيتحقق — loadingModal هيفضل true! دي المشكلة اللي بتخلي الـ spinner يستمر');
    }

    if (error.value) {
        console.error('🔴 [fetchItem] فيه error:', error.value);
        useToast({
            title: 'Error',
            message: error.value?.data?.message || error.value?.message || 'Failed to fetch data',
            type: 'error',
            duration: 5000,
        });
        loadingModal.value = false;
    }

    console.log('🟡 [fetchItem] END — loadingModal.value:', loadingModal.value);
};

// ✅ تحديث دالة التحديث
async function updateItem() {
    const payload = {
        title: item.value.title,
        name: item.value.name,
        email: item.value.email,
        job_title: item.value.job_title,
        phone: item.value.phone,
        phone_key_id: item.value.phone_key_id || 1,
        cell_number: item.value.cell_number || null,
        birth_date: item.value.birth_date || null,
        image: item.value.image || null,
    };

    const { data, error } = await useApiFetch(`/api/contact-person-network/${item.value.id}`, {
        method: 'PUT',
        body: payload,
    });

    if (data.value) {
        useToast({
            title: 'Success',
            message: data.value?.message || 'Person updated successfully',
            type: 'success',
            duration: 5000,
        });
        formLoading.value = false;
        emit('refresh');
        await closeModal();
    }
    if (error.value) {
        useToast({
            title: 'Error',
            message: error.value?.data?.message || error.value?.message || 'Failed to update',
            type: 'error',
            duration: 5000,
        });
        formLoading.value = false;
    }
}

// ✅ تحديث دالة الإضافة
async function addItem() {
    const payload = {
        member_network_id: item.value.member_network_id || props.memberId,
        title: item.value.title,
        name: item.value.name,
        email: item.value.email,
        job_title: item.value.job_title,
        phone: item.value.phone,
        phone_key_id: item.value.phone_key_id || 1,
        cell_number: item.value.cell_number || null,
        birth_date: item.value.birth_date || null,
        image: item.value.image || null,
    };

    const { data, error } = await useApiFetch(`/api/contact-person-network`, {
        method: 'POST',
        body: payload,
    });

    if (data.value) {
        useToast({
            title: 'Success',
            message: data.value?.message || 'Person added successfully',
            type: 'success',
            duration: 5000,
        });
        formLoading.value = false;
        emit('refresh');
        await closeModal();
    }
    if (error.value) {
        useToast({
            title: 'Error',
            message: error.value?.data?.message || error.value?.message || 'Failed to add',
            type: 'error',
            duration: 5000,
        });
        formLoading.value = false;
    }
}

async function handleModalSubmit() {
    formLoading.value = true;
    const result = await v$.value.$validate();
    if (!result) {
        formLoading.value = false;
        useToast({
            title: 'Error',
            message: 'Please fill all required fields',
            type: 'error',
            duration: 5000,
        });
        return false;
    }

    if (editMode.value || props.editMode) {
        await updateItem();
    } else {
        await addItem();
    }
}

// ✅ مراقبة التغييرات في props.open
watch(
    () => props.open,
    (newVal) => {
        if (newVal && props.personId) {
            editMode.value = true;
            fetchItem(props.personId);
        } else if (newVal) {
            editMode.value = false;
            item.value.member_network_id = props.memberId;
            loadingModal.value = false;
        }
    },
    { immediate: true },
);
</script>

<template>
    <TheModal :open-modal="props.open" size="4xl" @close-modal="closeModal()">
        <template #header>
            <div class="flex justify-between items-center">
                <div class="font-medium text-lg">{{ editMode ? 'Update Contact Person' : 'Add New Contact Person' }}</div>
                <Icon class="w-8 h-8 opacity-50 cursor-pointer hover:opacity-100 ease-in-out duration-300" name="solar:close-square-outline" @click="closeModal" />
            </div>
        </template>
        <template #content>
            <div v-if="loadingModal" class="flex justify-center items-center py-20">
                <Icon name="svg-spinners:3-dots-fade" class="w-12 h-12 text-primary" />
            </div>
            <div v-else class="grid lg:grid-cols-12 gap-5 items-start">
                <!-- الصورة -->
                <div class="lg:col-span-4">
                    <FormUploader v-model="item.image" :errors="v$.image.$errors" :allowed-types="['image']" label="Profile Image" name="image" />

                    <!-- ✅ عرض معلومات الشركة في حالة التعديل -->
                    <div v-if="editMode && item.memberNetwork" class="mt-4 p-3 bg-slate-50 rounded-xl">
                        <div class="text-xs font-medium text-slate-500 mb-2">Company Details</div>
                        <div class="text-sm font-medium">{{ item.memberNetwork.name }}</div>
                        <div class="text-xs text-slate-500">{{ item.memberNetwork.city }}{{ item.memberNetwork.country_id ? `, ID: ${item.memberNetwork.country_id}` : '' }}</div>
                        <div class="flex items-center gap-2 mt-1">
                            <UiStatusBadge :data="item.memberNetwork.status" size="sm" />
                            <span v-if="item.memberNetwork.fpp" class="text-[8px] bg-success/10 text-success px-1.5 py-0.5 rounded-full uppercase font-bold">FPP</span>
                        </div>
                    </div>
                </div>

                <!-- المعلومات الأساسية -->
                <div class="lg:col-span-8 grid lg:grid-cols-12 gap-5 items-start">
                    <FormSelectField
                        v-model="item.title"
                        :errors="v$.title.$errors"
                        labelvalue="name"
                        keyvalue="value"
                        :select-data="[
                            { name: 'Mr', value: 'mr' },
                            { name: 'Mrs', value: 'mrs' },
                            { name: 'Ms', value: 'ms' },
                            { name: 'Dr', value: 'dr' },
                            { name: 'Prof', value: 'prof' },
                        ]"
                        class="lg:col-span-4"
                        label="Title *"
                        name="person-title"
                        placeholder="Title"
                        required
                    />
                    <FormInputField v-model="item.name" :errors="v$.name.$errors" class="lg:col-span-8" label="Full Name *" name="full-name" placeholder="Full Name" required />

                    <FormInputField v-model="item.job_title" :errors="v$.job_title.$errors" class="lg:col-span-6" label="Job Title *" name="job-title" placeholder="Job Title" required />
                    <FormInputField v-model="item.email" :errors="v$.email.$errors" class="lg:col-span-6" label="Email *" name="email" placeholder="Email" type="email" required />

                    <FormInputField v-model="item.birth_date" :errors="v$.birth_date.$errors" class="lg:col-span-12" label="Birth Date" name="birth-date" placeholder="Birth Date" type="date" />
                </div>

                <!-- رقم الهاتف -->
                <div class="lg:col-span-12 grid lg:grid-cols-12 gap-5">
                    <FormSelectField
                        v-model="item.phone_key_id"
                        :errors="v$.phone_key_id.$errors"
                        labelvalue="key"
                        keyvalue="id"
                        imgvalue="imageUrl"
                        :select-data="resources.countries"
                        class="lg:col-span-3"
                        label="Phone Key *"
                        name="phone-key"
                        placeholder="Phone Key"
                        prefix="+"
                        required
                    />
                    <FormInputField v-model="item.phone" :errors="v$.phone.$errors" class="lg:col-span-9" label="Phone Number *" name="phone" placeholder="Phone Number" required />
                </div>

                <!-- رقم المحمول -->
                <div class="lg:col-span-12 grid lg:grid-cols-12 gap-5">
                    <div class="lg:col-span-3">
                        <FormSelectField
                            v-model="item.phone_key"
                            :errors="v$.phone_key.$errors"
                            labelvalue="key"
                            keyvalue="id"
                            imgvalue="imageUrl"
                            :select-data="resources.countries"
                            class="lg:col-span-3"
                            label="Phone Key *"
                            name="phone-key"
                            placeholder="Phone Key"
                            prefix="+"
                            required
                        />
                    </div>
                    <FormInputField v-model="item.cell_number" :errors="v$.cell_number.$errors" class="lg:col-span-9" label="Cell Number" name="cell-number" placeholder="Cell Number (Optional)" />
                </div>
            </div>
        </template>
        <template #footer>
            <div class="w-full flex items-center justify-end gap-5">
                <button :disabled="formLoading" class="btn-rounded btn-sm btn btn-danger px-4" type="button" @click="closeModal">
                    <Icon :name="formLoading ? 'svg-spinners:3-dots-fade' : 'solar:close-circle-linear'" class="w-5 h-5 mr-2" />
                    <span>Cancel</span>
                </button>
                <button :disabled="formLoading" class="btn-rounded btn-sm btn btn-primary px-4" type="button" @click="handleModalSubmit">
                    <Icon :name="formLoading ? 'svg-spinners:3-dots-fade' : 'solar:check-circle-broken'" class="w-5 h-5 mr-2" />
                    <span>{{ editMode ? 'Update' : 'Save' }}</span>
                </button>
            </div>
        </template>
    </TheModal>
</template>
