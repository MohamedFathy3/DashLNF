<script setup>
const route = useRoute();
const showPassword = ref(false);
const userModalOpen = ref(false);
const contactPersonModalOpen = ref(false);
const selectedContactPersonId = ref(null);

definePageMeta({
    middleware: ['auth', 'permission'],
    permissions: ['network_member_list'],
});

const {
    data: user,
    error,
    refresh,
} = await useApiFetch(`/api/user/${route.params.id}`, {
    method: 'GET',
    lazy: true,
    transform: (response) => response.data,
});

if (error.value) {
    useToast({ title: 'Error', message: error.value.message || 'Failed to load user', type: 'error', duration: 5000 });
}

const togglePassword = () => {
    showPassword.value = !showPassword.value;
};

const openUserModal = () => {
    userModalOpen.value = true;
};

const closeUserModal = () => {
    userModalOpen.value = false;
};

const openContactPersonModal = (personId = null) => {
    selectedContactPersonId.value = personId;
    contactPersonModalOpen.value = true;
};

const closeContactPersonModal = () => {
    contactPersonModalOpen.value = false;
    selectedContactPersonId.value = null;
};

const activeNetwork = computed(() => user.value?.network || user.value?.memberNetwork || user.value?.networks?.[0] || null);
const networkSubmittedDate = computed(() => {
    const submittedAt = activeNetwork.value?.createdAt || user.value?.createdAt;
    return submittedAt ? String(submittedAt).split(/[T ]/)[0] : 'N/A';
});
</script>

<template>
    <div v-if="user" class="flex flex-col gap-5">
        <div class="flex flex-col gap-5">
            <div class="lg:flex lg:items-center lg:justify-between lg:gap-5">
                <div class="flex items-center gap-2">
                    <Icon name="solar:user-circle-outline" class="size-5 opacity-75" />
                    <div>User Profile</div>
                </div>
                <div class="flex items-center gap-3">
                    <button class="btn btn-primary btn-rounded btn-sm gap-2" type="button" @click="openUserModal">
                        <Icon name="solar:pen-new-round-outline" class="size-4" />
                        Edit User
                    </button>
                    <NuxtLink to="/members-data/network" class="btn btn-secondary btn-rounded btn-sm gap-2">
                        <Icon name="solar:arrow-left-outline" class="size-4" />
                        Back
                    </NuxtLink>
                </div>
            </div>
        </div>

        <div class="grid lg:grid-cols-12 gap-5 text-sm font-light items-start">
            <div class="lg:col-span-8 grid lg:grid-cols-12 gap-5">
                <div class="bg-white shadow-sm p-5 rounded-xl lg:col-span-4 flex items-center justify-center min-h-40">
                    <NuxtImg v-if="user.imageUrl" class="w-full h-32 object-contain" :src="user.imageUrl" :alt="user.name" :title="user.name" />
                    <Icon v-else name="solar:user-circle-outline" class="size-24 text-slate-300" />
                </div>

                <div class="bg-white shadow-sm p-5 rounded-xl lg:col-span-8">
                    <div class="font-medium text-base opacity-75">
                        <div class="line-clamp-1">{{ user.name }}</div>
                        <div v-if="user.email" class="font-light text-sm mt-0.5 lowercase hover:text-warning cursor-pointer transition-all" @click="useClipboard(user.email.toLowerCase())">
                            {{ user.email.toLowerCase() }}
                        </div>
                    </div>
                    <div class="border-t mt-2 pt-2 border-dashed">
                        <div class="flex items-center line-clamp-1 whitespace-nowrap">
                            <NuxtImg v-if="user.country?.imageUrl" :src="user.country.imageUrl" :alt="user.country.name" class="w-6 h-4 mr-2 object-contain" />
                            <div v-if="user.country" class="font-medium opacity-75">{{ user.country.name }}</div>
                            <div v-if="user.city" class="opacity-75 truncate">, {{ user.city }}</div>
                        </div>
                        <div v-if="user.addressLineOne" class="mt-2 pt-2 border-t border-dashed opacity-75">{{ user.addressLineOne }}</div>
                    </div>
                    <!-- <div class="mt-3 pt-3 border-t border-dashed flex items-center gap-2 text-xs">
                        <Icon name="solar:password-minimalistic-input-outline" class="size-4 opacity-75" />
                        <span class="font-medium opacity-75">Password:</span>
                        <span class="font-mono bg-slate-100 px-3 py-1 rounded-lg">{{ showPassword ? user.unhashed_password : '********' }}</span>
                        <button type="button" class="p-1.5 rounded-lg hover:bg-slate-100" :title="showPassword ? 'Hide password' : 'Show password'" @click="togglePassword">
                            <Icon :name="showPassword ? 'solar:eye-outline' : 'solar:eye-closed-outline'" class="size-4 opacity-60" />
                        </button>
                        <button type="button" class="p-1.5 rounded-lg hover:bg-slate-100" title="Copy password" @click="useClipboard(user.unhashed_password)">
                            <Icon name="solar:copy-outline" class="size-4 opacity-60" />
                        </button>
                    </div> -->
                </div>

                <div class="lg:col-span-12 grid lg:grid-cols-12 gap-5">
                    <UiMemberStatusBox class="lg:col-span-3" :data="user.status" />
                    <div class="lg:col-span-3 shadow-sm bg-white rounded-2xl p-5 text-sm intro-x">
                        <div class="flex items-center gap-3 whitespace-nowrap">
                            <Icon name="solar:global-outline" class="size-5 opacity-65" />
                            <div class="font-medium opacity-75">Network Type</div>
                        </div>
                        <div class="pt-3">
                            <span class="text-xl font-semibold opacity-75 capitalize">{{ user.type_network || 'N/A' }}</span>
                        </div>
                    </div>
                    <UiMemberJoinBox class="lg:col-span-3" :data="networkSubmittedDate" />
                    <UiCompanyTypeBadge class="lg:col-span-3" :data="user.fpp === 'yes' ? 'FPP' : 'Network'" />
                </div>

                <div class="lg:col-span-12">
                    <h2 class="font-normal text-base flex items-center mb-3">
                        <Icon name="solar:clipboard-list-line-duotone" class="size-5 mr-2 opacity-75" />
                        Network Submitted Date
                    </h2>
                    <div class="bg-white shadow-sm rounded-xl p-5 space-y-2">
                        <div><span class="font-normal mr-2">Submitted Date:</span>{{ networkSubmittedDate }}</div>
                        <div><span class="font-normal mr-2">Name:</span>{{ user.name || 'N/A' }}</div>
                        <div><span class="font-normal mr-2">Phone:</span>{{ user.phone || 'N/A' }}</div>
                        <div>
                            <span class="font-normal mr-2">Website:</span>
                            <a v-if="user.website" :href="useCheckUrl(user.website)" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">
                                {{ useCheckUrl(user.website) }}
                            </a>
                            <span v-else>N/A</span>
                        </div>
                        <div><span class="font-normal mr-2">Address:</span>{{ user.addressLineOne || 'N/A' }}</div>
                        <div><span class="font-normal mr-2">Address Line 2:</span>{{ user.addressLineTwo || 'N/A' }}</div>
                        <div><span class="font-normal mr-2">State:</span>{{ user.state || 'N/A' }}</div>
                        <div><span class="font-normal mr-2">Postal Code:</span>{{ user.postalCode || 'N/A' }}</div>
                        <div><span class="font-normal mr-2">Members Count:</span>{{ user.membersCount ?? 'N/A' }}</div>
                        <div><span class="font-normal mr-2">Business Established:</span>{{ user.businessEst || 'N/A' }}</div>
                        <div><span class="font-normal mr-2">Profile:</span>{{ user.profile || 'N/A' }}</div>
                    </div>
                </div>
            </div>

            <div class="lg:col-span-4 flex flex-col gap-5">
                <!-- <MemberNetworkCard v-if="activeNetwork" :network="activeNetwork" :member-id="user.id" @refresh="refresh" /> -->
                <!-- <div v-else class="bg-white shadow-sm rounded-xl p-5 text-center text-sm opacity-60">This user is not assigned to a network.</div> -->

                <div class="bg-white shadow-sm rounded-xl p-5 flex flex-col gap-3">
                    <div class="flex items-center gap-2 border-b border-dashed pb-3">
                        <Icon name="solar:info-circle-outline" class="size-5 opacity-75" />
                        <span class="font-medium text-sm">Additional Info</span>
                    </div>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="opacity-50">Created</span>
                            <span>{{ user.createdAt || 'N/A' }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="opacity-50">Updated</span>
                            <span>{{ user.updatedAt || 'N/A' }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="opacity-50">FPP</span>
                            <span :class="user.fpp === 'yes' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'">{{ user.fpp === 'yes' ? 'Active' : 'Inactive' }}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="opacity-50">Active</span>
                            <span :class="user.active ? 'text-green-600 font-medium' : 'text-red-600 font-medium'">{{ user.active ? 'Active' : 'Inactive' }}</span>
                        </div>
                    </div>
                </div>

                <div class="bg-white shadow-sm rounded-xl p-5 flex flex-col gap-4">
                    <div class="flex items-center justify-between border-b border-dashed pb-3">
                        <div class="flex items-center gap-2">
                            <Icon name="solar:users-group-two-rounded-outline" class="size-5 opacity-75" />
                            <span class="font-medium text-sm">Contact Persons</span>
                            <span class="text-xs bg-slate-100 px-2 py-0.5 rounded-full opacity-75">{{ user.contactPersons?.length || 0 }}</span>
                        </div>
                        <button class="btn btn-sm btn-primary btn-rounded gap-1.5 px-3" type="button" @click="openContactPersonModal()">
                            <Icon name="solar:add-circle-linear" class="size-4" />
                            Add
                        </button>
                    </div>

                    <div v-if="user.contactPersons?.length" class="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                        <div v-for="person in user.contactPersons" :key="person.id" class="border rounded-xl p-3 hover:shadow-md transition-all hover:border-primary/30 group cursor-pointer" @click="openContactPersonModal(person.id)">
                            <div class="flex items-start gap-3">
                                <NuxtImg
                                    :src="person.imageUrl || '/default-avatar.png'"
                                    class="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 shrink-0"
                                    :alt="`${person.firstName || ''} ${person.lastName || ''}`"
                                    :title="`${person.firstName || ''} ${person.lastName || ''}`"
                                />
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center gap-1.5">
                                        <span class="font-medium text-sm truncate">{{ [person.title, person.firstName, person.lastName].filter(Boolean).join(' ') || 'N/A' }}</span>
                                        <span v-if="person.jobTitle" class="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full truncate max-w-[120px]">{{ person.jobTitle }}</span>
                                    </div>
                                    <div class="text-xs opacity-75 truncate">
                                        <span v-if="person.email" class="hover:text-warning cursor-pointer" @click="useClipboard(person.email)">{{ person.email }}</span>
                                    </div>
                                    <div class="text-xs opacity-50 flex items-center gap-2 mt-0.5">
                                        <span v-if="person.phoneNumber">Phone: {{ person.phoneNumber }}</span>
                                        <span v-if="person.cellNumber">Cell: {{ person.cellNumber }}</span>
                                    </div>
                                    <div class="grid grid-cols-2 gap-x-3 gap-y-1 mt-3 pt-3 border-t border-dashed text-xs">
                                        <div><span class="opacity-50">ID:</span> {{ person.id }}</div>
                                        <div><span class="opacity-50">User ID:</span> {{ person.userId || 'N/A' }}</div>
                                        <div><span class="opacity-50">Title:</span> {{ person.title || 'N/A' }}</div>
                                        <div><span class="opacity-50">Job:</span> {{ person.jobTitle || 'N/A' }}</div>
                                    </div>
                                    <div v-if="person.passportImageUrl" class="mt-3 pt-3 border-t border-dashed">
                                        <div class="text-xs opacity-50 mb-1">Passport</div>
                                        <NuxtImg :src="person.passportImageUrl" :alt="`Passport of ${person.firstName || ''} ${person.lastName || ''}`" class="h-24 w-full rounded-lg object-contain bg-slate-50" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div v-else class="text-center py-8 text-sm opacity-50 border-2 border-dashed rounded-xl">
                        <Icon name="solar:users-group-two-rounded-outline" class="size-8 mx-auto opacity-50 mb-2" />
                        <p>No people added yet</p>
                    </div>
                </div>
            </div>
        </div>
        <MemberNetworkUserUpdateModal v-if="userModalOpen" :open="userModalOpen" :user="user" @close="closeUserModal" @refresh="refresh" />
        <MemberNetworkContactPersonModal v-if="contactPersonModalOpen" :open="contactPersonModalOpen" :person-id="selectedContactPersonId" :network-id="user.id" @close="closeContactPersonModal" @refresh="refresh" />
    </div>
    <div v-else class="flex justify-center py-20"><Icon name="svg-spinners:3-dots-fade" class="size-12 text-primary" /></div>
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
