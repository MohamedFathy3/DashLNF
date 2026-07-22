<script setup>
const route = useRoute();
definePageMeta({
    middleware: 'auth',
});
import CompanyUpdateModal from '@/components/Member/CompanyUpdateModal.vue';

const settings = useSettingsStore();
const networkModalOpen = ref(false);
const updateModalOpen = ref(false);
const contactPersonModalOpen = ref(false);
const selectedPerson = ref(null);
const isEditMode = ref(false);
const formLoading = ref(false);

// ✅ متغيرات لإظهار/إخفاء الباسورد
const showPassword = ref(false);

function togglePassword() {
    showPassword.value = !showPassword.value;
}

function openNetworkModal() {
    networkModalOpen.value = true;
}
function closeNetworkModal() {
    networkModalOpen.value = false;
}
function openUpdateModal() {
    updateModalOpen.value = true;
}
function closeUpdateModal() {
    updateModalOpen.value = false;
}

// جلب بيانات الشركة
const { data: company, refresh } = await useApiFetch(`/api/member-network/${route.params?.id}`, {
    lazy: true,
    transform: (company) => company.data,
});

const sendWelcomeEmail = async () => {
    const { data, error } = await useApiFetch('/api/email-approved', {
        lazy: true,
        method: 'POST',
        body: {
            userId: company.value?.id,
        },
    });
    if (data.value) {
        useToast({ title: 'Success', message: data.value.message, type: 'success', duration: 5000 });
    }
    if (error.value) {
        useToast({ title: 'Error', message: data.value.message, type: 'error', duration: 5000 });
    }
};

const sendResetPasswordEmail = async () => {
    const { data, error } = await useApiFetch('/api/email-reset-password', {
        lazy: true,
        method: 'POST',
        body: {
            userId: company.value?.id,
        },
    });
    if (data.value) {
        useToast({ title: 'Success', message: data.value.message, type: 'success', duration: 5000 });
    }
    if (error.value) {
        useToast({ title: 'Error', message: data.value.message, type: 'error', duration: 5000 });
    }
};

// Functions for Contact Persons
function openAddContactPerson() {
    isEditMode.value = false;
    selectedPerson.value = {
        title: 'mr',
        name: '',
        email: '',
        job_title: '',
        birth_date: null,
        phone: '',
        cell_number: '',
        phone_key_id: 1,
        image: null,
    };
    contactPersonModalOpen.value = true;
}

async function openEditContactPerson(person) {
    isEditMode.value = true;
    formLoading.value = true;

    const { data, error } = await useApiFetch(`/api/contact-person-network/${person.id}`, {
        method: 'GET',
        lazy: true,
    });

    if (data.value) {
        selectedPerson.value = {
            ...data.value.data,
            image: data.value.data.image || null,
        };
    }
    if (error.value) {
        useToast({ title: 'Error', message: error.value.message, type: 'error', duration: 5000 });
    }
    formLoading.value = false;
    contactPersonModalOpen.value = true;
}

function closeContactPersonModal() {
    contactPersonModalOpen.value = false;
    selectedPerson.value = null;
    isEditMode.value = false;
    formLoading.value = false;
}

async function submitContactPerson() {
    if (!selectedPerson.value) return;

    formLoading.value = true;
    const url = isEditMode.value ? `/api/contact-person-network/${selectedPerson.value.id}` : '/api/contact-person-network';

    const method = isEditMode.value ? 'PUT' : 'POST';

    let imageId = null;
    if (selectedPerson.value.image) {
        if (typeof selectedPerson.value.image === 'number') {
            imageId = selectedPerson.value.image;
        } else if (selectedPerson.value.image.id) {
            imageId = selectedPerson.value.image.id;
        }
    }

    const payload = {
        member_network_id: company.value.id,
        title: selectedPerson.value.title,
        name: selectedPerson.value.name,
        email: selectedPerson.value.email,
        job_title: selectedPerson.value.job_title,
        birth_date: selectedPerson.value.birth_date,
        phone: selectedPerson.value.phone,
        cell_number: selectedPerson.value.cell_number,
        phone_key_id: selectedPerson.value.phone_key_id || 1,
        image: imageId,
    };

    const { data, error } = await useApiFetch(url, {
        method: method,
        body: payload,
        lazy: true,
    });

    if (data.value) {
        useToast({
            title: 'Success',
            message: isEditMode.value ? 'Person updated successfully' : 'Person added successfully',
            type: 'success',
            duration: 5000,
        });
        closeContactPersonModal();
        await refresh();
    }
    if (error.value) {
        useToast({
            title: 'Error',
            message: error.value.message || 'Something went wrong',
            type: 'error',
            duration: 5000,
        });
        formLoading.value = false;
    }
}

async function deleteContactPerson(id) {
    const confirmed = confirm('Are you sure you want to delete this person?');
    if (confirmed) {
        const { data, error } = await useApiFetch(`/api/contact-person-network/${id}`, {
            method: 'DELETE',
            lazy: true,
        });
        if (data.value) {
            useToast({ title: 'Success', message: data.value.message, type: 'success', duration: 5000 });
            await refresh();
        }
        if (error.value) {
            useToast({ title: 'Error', message: error.value.message, type: 'error', duration: 5000 });
        }
    }
}
</script>

<template>
    <div v-if="company" class="flex flex-col gap-5">
        <div class="flex flex-col gap-5">
            <!-- Page Title & Action Buttons -->
            <div class="lg:flex lg:items-center lg:justify-between lg:gap-5">
                <div class="flex items-center gap-2">
                    <Icon name="solar:buildings-outline" class="size-5 opacity-75" />
                    <div>Company Profile</div>
                </div>
                <div class="lg:flex lg:items-center lg:gap-5 lg:space-y-0 space-y-5">
                    <button class="btn btn-primary btn-rounded px-6 btn-sm gap-3 lg:w-fit w-full lg:mt-0 mt-5" type="button" @click="openUpdateModal">
                        <Icon name="solar:pen-new-round-outline" class="size-5 opacity-75" />
                        <span>Update Company</span>
                    </button>
                    <HeadlessMenu as="div" class="relative inline-block">
                        <HeadlessMenuButton>
                            <Icon class="size-6 opacity-75 hover:scale-105 transition-all" name="solar:hamburger-menu-outline" />
                        </HeadlessMenuButton>
                        <TransitionExpand>
                            <HeadlessMenuItems as="div" class="absolute text-sm right-0 mt-3 w-56 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black/5 focus:outline-none text-slate-600 z-50">
                                <ul class="p-1">
                                    <HeadlessMenuItem as="li" class="py-0.5" @click="sendResetPasswordEmail">
                                        <div class="flex items-center gap-3 px-2 py-1.5 cursor-pointer hover:bg-slate-100 rounded-full transition-all">
                                            <Icon name="solar:password-minimalistic-input-broken" class="size-5 opacity-75" />
                                            <span>Reset Password</span>
                                        </div>
                                    </HeadlessMenuItem>
                                </ul>
                            </HeadlessMenuItems>
                        </TransitionExpand>
                    </HeadlessMenu>
                </div>
            </div>
        </div>

        <div class="grid lg:grid-cols-12 gap-5 text-sm font-light items-start">
            <!-- العمود الأيسر -->
            <div class="lg:col-span-8 grid lg:grid-cols-12 gap-5">
                <!-- البطاقة الرئيسية -->
                <div class="bg-white shadow-sm p-5 rounded-xl lg:col-span-4 flex items-center place-content-center">
                    <NuxtImg class="w-full h-24 flex items-center my-auto object-contain hover:scale-105 ease-in-out duration-300" :src="company.imageUrl" :alt="company.name" :title="company.name" />
                </div>
                <div class="bg-white shadow-sm p-5 rounded-xl lg:col-span-8">
                    <div class="font-medium text-base opacity-75">
                        <div class="line-clamp-1">{{ company.name }}</div>
                        <div class="font-light text-sm mt-0.5 lowercase hover:text-warning cursor-pointer transition-all" @click="useClipboard(company.email?.toLowerCase())">
                            {{ company?.email?.toLowerCase() || 'N/A' }}
                        </div>
                    </div>
                    <div class="border-t mt-1.5 pt-1.5 border-dashed">
                        <div class="flex items-center line-clamp-1 whitespace-nowrap">
                            <NuxtImg :src="company.country?.imageUrl" :alt="company.country?.name" :title="company.country?.name" class="w-6 h-4 mr-2 object-contain" />
                            <div v-if="company.country" class="font-medium opacity-75">{{ company.country.name }}</div>
                            <div v-if="company.city" class="opacity-75 truncate">, {{ company.city }}</div>
                        </div>
                        <div class="mt-1.5 pt-1.5 border-t border-dashed opacity-75">
                            <span v-if="company.address">{{ company.address }}</span>
                        </div>
                    </div>

                    <!-- عرض الـ User المرتبط -->
                    <div v-if="company.user" class="mt-3 pt-3 border-t border-dashed">
                        <div class="flex items-center gap-2 text-xs opacity-75">
                            <Icon name="solar:user-circle-outline" class="size-4" />
                            <span class="font-medium">Associated User:</span>
                            <NuxtImg :src="company.user.imageUrl" class="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200" />
                            <span class="font-medium">{{ company.user.name }}</span>
                        </div>
                    </div>

                    <!-- ✅ عرض الباسورد مع زر العين -->
                    <div class="mt-3 pt-3 border-t border-dashed">
                        <div class="flex items-center gap-2 text-xs">
                            <Icon name="solar:password-minimalistic-input-outline" class="size-4 opacity-75" />
                            <span class="font-medium opacity-75">Password:</span>
                            <div class="flex items-center gap-2">
                                <span class="font-mono text-sm bg-slate-100 px-3 py-1 rounded-lg min-w-[120px]">
                                    {{ showPassword ? company.unhashed_password : '••••••••' }}
                                </span>
                                <button @click="togglePassword" class="p-1.5 rounded-lg hover:bg-slate-100 transition-colors" :title="showPassword ? 'Hide password' : 'Show password'">
                                    <Icon :name="showPassword ? 'solar:eye-outline' : 'solar:eye-closed-outline'" class="size-4 opacity-60 hover:opacity-100 transition-all" />
                                </button>
                                <button @click="useClipboard(company.unhashed_password)" class="p-1.5 rounded-lg hover:bg-slate-100 transition-colors" title="Copy password">
                                    <Icon name="solar:copy-outline" class="size-4 opacity-60 hover:opacity-100 transition-all" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Status Boxes -->
                <template v-if="company">
                    <UiMemberStatusBox class="lg:col-span-3" :data="company.status" />
                    <UiMemberIDBox class="lg:col-span-3" :data="'#' + company.id" />
                    <UiMemberJoinBox class="lg:col-span-3" :data="company.createdAt" />
                    <UiCompanyTypeBadge class="lg:col-span-3" :data="company.type_company" />
                </template>

                <!-- ✅ FPP و Active Badges -->
                <div class="lg:col-span-12 grid lg:grid-cols-12 gap-5">
                    <div class="lg:col-span-6 flex items-center gap-5">
                        <!-- FPP Badge -->
                        <div class="flex items-center gap-2">
                            <span class="text-xs opacity-50">FPP:</span>
                            <span
                                :class="[
                                    company.fpp === true || company.fpp === 'yes' ? 'bg-green-100 text-green-700 border border-green-300 shadow-sm shadow-green-200' : 'bg-red-100 text-red-700 border border-red-300 shadow-sm shadow-red-200',
                                    'text-xs font-medium py-1 px-3 rounded-full inline-flex items-center gap-1.5',
                                ]"
                            >
                                <span class="w-1.5 h-1.5 rounded-full" :class="company.fpp === true || company.fpp === 'yes' ? 'bg-green-500 animate-pulse' : 'bg-red-500'"></span>
                                {{ company.fpp === true || company.fpp === 'yes' ? 'Active' : 'Inactive' }}
                            </span>
                        </div>

                        <!-- Active Badge -->
                        <div class="flex items-center gap-2">
                            <span class="text-xs opacity-50">Status:</span>
                            <span
                                :class="[
                                    company.active === true ? 'bg-blue-100 text-blue-700 border border-blue-300 shadow-sm shadow-blue-200' : 'bg-gray-100 text-gray-700 border border-gray-300 shadow-sm shadow-gray-200',
                                    'text-xs font-medium py-1 px-3 rounded-full inline-flex items-center gap-1.5',
                                ]"
                            >
                                <span class="w-1.5 h-1.5 rounded-full" :class="company.active === true ? 'bg-blue-500 animate-pulse' : 'bg-gray-500'"></span>
                                {{ company.active === true ? 'Active' : 'Inactive' }}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Company Details -->
                <div class="lg:col-span-12">
                    <div class="intro-y block sm:flex items-center h-10">
                        <h2 class="font-normal text-base truncate mr-5 flex items-center">
                            <Icon name="solar:clipboard-list-line-duotone" class="size-5 mr-2 opacity-75" />
                            Company Details
                        </h2>
                    </div>
                    <div class="bg-white shadow-sm rounded-xl intro-y p-5">
                        <div>
                            <!-- About -->
                            <div class="flex border-b border-dashed pb-5 mb-5 last:border-b-0 last:pb-0 last:mb-0">
                                <div>
                                    <div class="font-medium text-base flex items-center opacity-75">
                                        <Icon name="solar:document-text-linear" class="size-4 mr-2 opacity-75 shrink-0" />
                                        <span>About</span>
                                    </div>
                                    <div class="ml-6">
                                        <div class="mt-1 opacity-75">
                                            <span class="font-normal mr-2">Company Name:</span>
                                            {{ company.name }}
                                        </div>
                                        <div class="mt-1 opacity-75">
                                            <span class="font-normal mr-2">Type:</span>
                                            {{ company.type || 'N/A' }}
                                        </div>
                                        <div class="mt-1 opacity-75">
                                            <span class="font-normal mr-2">Company Type:</span>
                                            {{ company.type_company || 'N/A' }}
                                        </div>
                                        <div class="mt-1 opacity-75">
                                            <span class="font-normal mr-2">Status:</span>
                                            {{ company.status || 'N/A' }}
                                        </div>
                                        <!-- ✅ إضافة الباسورد في التفاصيل -->
                                        <div class="mt-1 opacity-75">
                                            <span class="font-normal mr-2">Password:</span>
                                            <span class="font-mono">
                                                {{ showPassword ? company.unhashed_password : '••••••••' }}
                                            </span>
                                            <button @click="togglePassword" class="ml-2 text-xs text-primary hover:underline">
                                                {{ showPassword ? 'Hide' : 'Show' }}
                                            </button>
                                        </div>
                                        <div class="mt-1 opacity-75">
                                            <span class="font-normal mr-2">FPP:</span>
                                            <span :class="company.fpp === true || company.fpp === 'yes' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'">
                                                {{ company.fpp === true || company.fpp === 'yes' ? 'Active' : 'Inactive' }}
                                            </span>
                                        </div>
                                        <div class="mt-1 opacity-75">
                                            <span class="font-normal mr-2">Active:</span>
                                            <span :class="company.active === true ? 'text-green-600 font-medium' : 'text-red-600 font-medium'">
                                                {{ company.active === true ? 'Active' : 'Inactive' }}
                                            </span>
                                        </div>
                                        <div v-if="company.user" class="mt-1 opacity-75">
                                            <span class="font-normal mr-2">Associated User:</span>
                                            <span class="flex items-center gap-1.5">
                                                <NuxtImg :src="company.user.imageUrl" class="w-5 h-5 rounded-full object-cover" />
                                                {{ company.user.name }}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Contact Information -->
                            <div class="flex border-b border-dashed pb-5 mb-5 last:border-b-0 last:pb-0 last:mb-0">
                                <div>
                                    <div class="font-medium text-base flex items-center opacity-75">
                                        <Icon name="solar:phone-calling-outline" class="size-4 mr-2 opacity-75 shrink-0" />
                                        <span>Contact Information</span>
                                    </div>
                                    <div class="ml-6">
                                        <div class="mt-1 opacity-75">
                                            <span class="font-normal mr-2">Login Email:</span>
                                            <span class="hover:text-warning transition-all cursor-pointer" @click="useClipboard(company.email)">
                                                {{ company.email || 'N/A' }}
                                            </span>
                                        </div>
                                        <div class="mt-1 opacity-75">
                                            <span class="font-normal mr-2">Company Email:</span>
                                            <span class="hover:text-warning transition-all cursor-pointer" @click="useClipboard(company.company_email)">
                                                {{ company.company_email || 'N/A' }}
                                            </span>
                                        </div>
                                        <div class="mt-1 opacity-75">
                                            <span class="font-normal mr-2">Phone:</span>
                                            {{ company.phone || 'N/A' }}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Website -->
                            <div v-if="company.website" class="flex border-b border-dashed pb-5 mb-5 last:border-b-0 last:pb-0 last:mb-0">
                                <div>
                                    <div class="font-medium text-base flex items-center opacity-75">
                                        <Icon name="solar:basketball-outline" class="size-4 mr-2 opacity-75 shrink-0" />
                                        <span>Website</span>
                                    </div>
                                    <div class="ml-6">
                                        <a class="mt-1 opacity-75 hover:text-slate-800" target="_blank" :href="useCheckUrl(company.website)" :title="'Open' + ' ' + company.name + ' ' + 'in new window'">
                                            {{ useCheckUrl(company.website) }}
                                        </a>
                                    </div>
                                </div>
                            </div>

                            <!-- Location -->
                            <div class="flex border-b border-dashed pb-5 mb-5 last:border-b-0 last:pb-0 last:mb-0">
                                <div>
                                    <div class="font-medium text-base flex items-center opacity-75">
                                        <Icon name="solar:streets-map-point-linear" class="size-4 mr-2 opacity-75 shrink-0" />
                                        <span>Location</span>
                                    </div>
                                    <div class="ml-6">
                                        <div class="mt-1 opacity-75">
                                            <span class="font-normal mr-2">Address:</span>
                                            {{ company.address || 'N/A' }}
                                        </div>
                                        <div class="mt-1 opacity-75">
                                            <span class="font-normal mr-2">City:</span>
                                            {{ company.city || 'N/A' }}
                                        </div>
                                        <div class="mt-1 opacity-75 flex items-center">
                                            <span class="font-normal mr-2">Country:</span>
                                            <span v-if="company.country" class="flex items-center">
                                                <NuxtImg class="w-5 h-3 object-cover mr-1" :src="company.country.imageUrl" :alt="company.country.name" :title="company.country.name" />
                                                {{ company.country.name }}
                                            </span>
                                            <span v-else>N/A</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- العمود الأيمن (Sidebar) -->
            <div class="lg:col-span-4 flex flex-col gap-5">
                <!-- Contact Persons Card -->
                <div class="bg-white shadow-sm rounded-xl p-5 flex flex-col gap-4">
                    <div class="flex items-center justify-between border-b border-dashed pb-3">
                        <div class="flex items-center gap-2">
                            <Icon name="solar:users-group-two-rounded-outline" class="size-5 opacity-75" />
                            <span class="font-medium text-sm">Contact Persons</span>
                            <span class="text-xs bg-slate-100 px-2 py-0.5 rounded-full opacity-75">{{ company.contactPersonNetwork?.length || 0 }}</span>
                        </div>
                        <button class="btn btn-sm btn-primary btn-rounded gap-1.5 px-3" @click="openAddContactPerson">
                            <Icon name="solar:add-circle-linear" class="size-4" />
                            Add
                        </button>
                    </div>

                    <div v-if="company.contactPersonNetwork && company.contactPersonNetwork.length > 0" class="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                        <div v-for="person in company.contactPersonNetwork" :key="person.id" class="border rounded-xl p-3 hover:shadow-md transition-all hover:border-primary/30 group">
                            <div class="flex items-start gap-3">
                                <NuxtImg :src="person.imageUrl || '/default-avatar.png'" class="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 shrink-0" :alt="person.name" :title="person.name" />
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center gap-1.5">
                                        <span class="font-medium text-sm truncate">{{ person.name }}</span>
                                        <span class="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full truncate max-w-[60px]">{{ person.job_title }}</span>
                                    </div>
                                    <div class="text-xs opacity-75 truncate">
                                        <span v-if="person.email" class="hover:text-warning cursor-pointer" @click="useClipboard(person.email)">
                                            {{ person.email }}
                                        </span>
                                    </div>
                                    <div class="text-xs opacity-50 flex items-center gap-2 mt-0.5">
                                        <span v-if="person.phone">📞 {{ person.phone }}</span>
                                        <span v-if="person.cell_number">📱 {{ person.cell_number }}</span>
                                    </div>
                                </div>
                                <div class="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                                    <button class="btn btn-sm btn-secondary btn-rounded p-1" @click="openEditContactPerson(person)">
                                        <Icon name="solar:pen-outline" class="size-3" />
                                    </button>
                                    <button class="btn btn-sm btn-danger btn-rounded p-1" @click="deleteContactPerson(person.id)">
                                        <Icon name="solar:trash-bin-minimalistic-outline" class="size-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div v-else class="text-center py-8 text-sm opacity-50 border-2 border-dashed rounded-xl">
                        <Icon name="solar:users-group-two-rounded-outline" class="size-8 mx-auto opacity-50 mb-2" />
                        <p>No people added yet</p>
                        <p class="text-xs mt-1">Click "Add" to add a contact person</p>
                    </div>
                </div>

                <!-- Extra Info Card -->
                <div class="bg-white shadow-sm rounded-xl p-5 flex flex-col gap-3">
                    <div class="flex items-center gap-2 border-b border-dashed pb-3">
                        <Icon name="solar:info-circle-outline" class="size-5 opacity-75" />
                        <span class="font-medium text-sm">Additional Info</span>
                    </div>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="opacity-50">ID</span>
                            <span class="font-medium">#{{ company.id }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="opacity-50">Created</span>
                            <span>{{ company.createdAt }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="opacity-50">Updated</span>
                            <span>{{ company.updatedAt }}</span>
                        </div>
                        <!-- ✅ إضافة الباسورد في الـ Sidebar -->
                        <div class="flex justify-between border-t border-dashed pt-2 mt-2">
                            <span class="opacity-50">Password</span>
                            <div class="flex items-center gap-1">
                                <span class="font-mono text-xs">
                                    {{ showPassword ? company.unhashed_password : '••••••••' }}
                                </span>
                                <button @click="togglePassword" class="text-xs text-primary hover:underline">
                                    {{ showPassword ? 'Hide' : 'Show' }}
                                </button>
                            </div>
                        </div>
                        <div class="flex justify-between">
                            <span class="opacity-50">FPP</span>
                            <span :class="company.fpp === true || company.fpp === 'yes' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'">
                                {{ company.fpp === true || company.fpp === 'yes' ? '✅ Active' : '❌ Inactive' }}
                            </span>
                        </div>
                        <div class="flex justify-between">
                            <span class="opacity-50">Active</span>
                            <span :class="company.active === true ? 'text-green-600 font-medium' : 'text-red-600 font-medium'">
                                {{ company.active === true ? '✅ Active' : '❌ Inactive' }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modals -->
        <MemberNetworkModal v-if="networkModalOpen" :open="networkModalOpen" :member-id="company.id" @close="closeNetworkModal" @refresh="refresh" />
        <CompanyUpdateModal v-if="updateModalOpen" :open="updateModalOpen" :company="company" @close="closeUpdateModal" @refresh="refresh" />

        <!-- Contact Person Modal -->
        <TheModal :open-modal="contactPersonModalOpen" size="2xl" @close-modal="closeContactPersonModal">
            <template #header>
                <div class="flex justify-between items-center">
                    <div class="font-medium">{{ isEditMode ? 'Edit Contact Person' : 'Add Contact Person' }}</div>
                    <Icon class="w-8 h-8 opacity-50 cursor-pointer hover:opacity-100" name="solar:close-square-outline" @click="closeContactPersonModal" />
                </div>
            </template>
            <template #content>
                <div v-if="formLoading" class="flex justify-center items-center py-20">
                    <Icon name="svg-spinners:3-dots-fade" class="w-12 h-12 text-primary" />
                </div>
                <div v-else-if="!selectedPerson" class="flex justify-center items-center py-20 text-slate-400">No data available</div>
                <div v-else class="grid lg:grid-cols-12 gap-5">
                    <FormUploader v-model="selectedPerson.image" class="lg:col-span-12" :allowed-types="['image']" label="Profile Image" name="person-image" />
                    <FormSelectField
                        id="person-title"
                        v-model="selectedPerson.title"
                        name="person-title"
                        class="lg:col-span-6"
                        label="Title *"
                        placeholder="Select title"
                        :select-data="[
                            { name: 'Mr', value: 'mr' },
                            { name: 'Mrs', value: 'mrs' },
                            { name: 'Ms', value: 'ms' },
                            { name: 'Dr', value: 'dr' },
                            { name: 'Prof', value: 'prof' },
                        ]"
                        labelvalue="name"
                        keyvalue="value"
                        required
                    />
                    <FormInputField v-model="selectedPerson.name" class="lg:col-span-6" label="Full Name *" placeholder="Enter full name" required />
                    <FormInputField v-model="selectedPerson.email" class="lg:col-span-6" label="Email *" placeholder="Enter email" type="email" required />
                    <FormInputField v-model="selectedPerson.job_title" class="lg:col-span-6" label="Job Title" placeholder="Enter job title" />
                    <FormInputField v-model="selectedPerson.phone" class="lg:col-span-6" label="Phone Number" placeholder="Enter phone number" />
                    <FormInputField v-model="selectedPerson.cell_number" class="lg:col-span-6" label="Cell Number" placeholder="Enter cell number" />
                    <FormInputField v-model="selectedPerson.birth_date" class="lg:col-span-6" label="Birth Date" placeholder="YYYY-MM-DD" type="date" />
                </div>
            </template>
            <template #footer>
                <div class="w-full flex items-center justify-end gap-5">
                    <button :disabled="formLoading" class="btn-rounded btn-sm btn btn-danger px-6 py-2.5" type="button" @click="closeContactPersonModal">
                        <Icon :name="formLoading ? 'svg-spinners:3-dots-fade' : 'solar:close-circle-linear'" class="w-5 h-5 mr-2" />
                        <span>Cancel</span>
                    </button>
                    <button :disabled="formLoading || !selectedPerson" class="btn-rounded btn-sm btn btn-primary px-6 py-2.5" type="button" @click="submitContactPerson">
                        <Icon :name="formLoading ? 'svg-spinners:3-dots-fade' : 'solar:check-circle-broken'" class="w-5 h-5 mr-2" />
                        <span>{{ isEditMode ? 'Update' : 'Save' }}</span>
                    </button>
                </div>
            </template>
        </TheModal>
    </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 8px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 8px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}
</style>
