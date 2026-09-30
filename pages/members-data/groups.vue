<script setup>
import { required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';

definePageMeta({
    middleware: ['auth', 'permission'],
    permissions: ['network_group_list'],
});

const userStore = useUserStore();
const canChooseNetwork = computed(() => userStore.isSuperAdmin || userStore.user?.showNonUser === true);
const forcedUserId = computed(() => (canChooseNetwork.value ? null : userStore.getUserId));

const selectedRows = ref([]);
const sortByList = ref([
    { name: 'Sort By ID', value: 'id' },
    { name: 'Sort By Name', value: 'name' },
]);

const filter = ref({
    name: null,
    user_id: null,
});

const serverParams = ref({
    filters: forcedUserId.value ? { user_id: forcedUserId.value } : {},
    orderBy: 'id',
    orderByDirection: 'desc',
    perPage: 15,
    page: 1,
    paginate: true,
    deleted: false,
});

const formLoading = ref(false);
const isOpen = ref(false);
const editMode = ref(false);

const resetServerParams = async () => {
    filter.value = {
        name: null,
        user_id: null,
    };
    serverParams.value = {
        filters: forcedUserId.value ? { user_id: forcedUserId.value } : {},
        orderBy: 'id',
        orderByDirection: 'desc',
        perPage: 15,
        page: 1,
        paginate: true,
        deleted: false,
    };
    selectedRows.value = [];
    await refresh();
};

const {
    data: rows,
    status,
    refresh,
} = await useApiFetch('/api/group/index', {
    method: 'POST',
    body: serverParams,
    lazy: true,
});

watch(
    filter,
    (newVal) => {
        if (newVal.name && newVal.name.trim() !== '') {
            serverParams.value.filters.name = newVal.name.trim();
        } else {
            delete serverParams.value.filters.name;
        }
        if (canChooseNetwork.value) {
            if (newVal.user_id) serverParams.value.filters.user_id = newVal.user_id;
            else delete serverParams.value.filters.user_id;
        } else if (forcedUserId.value) {
            serverParams.value.filters.user_id = forcedUserId.value;
        }
        serverParams.value.page = 1;
    },
    { deep: true },
);

watch(forcedUserId, (userId) => {
    if (userId) serverParams.value.filters.user_id = userId;
    else if (!filter.value.user_id) delete serverParams.value.filters.user_id;
});

const toggleDeleted = async () => {
    serverParams.value.deleted = !serverParams.value.deleted;
    serverParams.value.page = 1;
    selectedRows.value = [];
    await refresh();
};

const isSelected = (id) => {
    return selectedRows.value.some((r) => r === id);
};

const allSelected = computed(() => {
    return rows?.value?.data?.every((row) => selectedRows.value.includes(row.id)) || false;
});

const selectAllRows = () => {
    if (!rows.value?.data) return;
    const allSelected = rows.value.data.every((row) => isSelected(row.id));
    if (allSelected) {
        selectedRows.value = [];
    } else {
        rows.value.data.forEach((row) => {
            if (!isSelected(row.id)) {
                selectedRows.value.push(row.id);
            }
        });
    }
};

const changePage = async (value) => {
    const pageNumber = parseInt(value);
    if (!isNaN(pageNumber) && pageNumber > 0) {
        serverParams.value.page = pageNumber;
        selectedRows.value = [];
        await refresh();
    }
};

const toggleRowSelection = (id) => {
    const index = selectedRows.value.indexOf(id);
    if (index === -1) {
        selectedRows.value.push(id);
    } else {
        selectedRows.value.splice(index, 1);
    }
};

const item = ref({
    name: null,
    user_id: null,
    companies: [],
});
const companyDraft = ref({
    id_company: null,
    type_company: null,
});
const companySearch = ref('');

const rules = ref({
    name: { required },
    companies: {},
});

const v$ = useVuelidate(rules, item);

const fetchItem = async (id) => {
    const { data, error } = await useApiFetch(`/api/group/${id}`, {
        lazy: true,
    });
    if (data.value) {
        item.value = data.value.data;
        item.value.user_id = item.value.user_id ?? item.value.userId ?? item.value.user?.id ?? null;
        if (!item.value.companies) {
            item.value.companies = [];
        }
        // تأكد من أن المفاتيح صحيحة
        // ونحتفظ بأي بيانات للشركة راجعة من الـ API (company) كـ fallback للعرض
        item.value.companies = item.value.companies.map((company) => ({
            id_company: company.idCompany || company.id_company,
            type_company: (company.typeCompany || company.type_company || '').toString().toLowerCase(),
            company: company.company || null,
        }));
    }
    if (error.value) {
        useToast({
            title: 'Error',
            message: data.value?.message || 'Error fetching item',
            type: 'error',
            duration: 5000,
        });
    }
};

const resetItemValues = async () => {
    item.value = {
        name: null,
        user_id: canChooseNetwork.value ? null : userStore.getUserId,
        companies: [],
    };
    companyDraft.value = { id_company: null, type_company: null };
    companySearch.value = '';
};

async function closeModal() {
    isOpen.value = false;
    editMode.value = false;
    v$.value.$reset();
    await resetItemValues();
}

async function openModal(id = null) {
    formLoading.value = true;
    if (id !== null) {
        editMode.value = true;
        await fetchItem(id);
    } else {
        editMode.value = false;
        await resetItemValues();
    }
    formLoading.value = false;
    isOpen.value = true;
}

// Cache companies by user so the page preloads them and the modal opens instantly.
const memberSearchParams = ref({
    user_id: canChooseNetwork.value ? null : forcedUserId.value || null,
});

const { data: activeMembers, refresh: refreshMembers } = await useApiFetch('/api/get-companies', {
    method: 'GET',
    query: memberSearchParams,
    lazy: true,
});

const loadedMemberUserId = ref(canChooseNetwork.value ? null : forcedUserId.value || null);
const loadMembersForUser = async (userId) => {
    const normalizedUserId = userId || null;
    if (loadedMemberUserId.value === normalizedUserId && activeMembers.value) return;

    memberSearchParams.value.user_id = normalizedUserId;
    loadedMemberUserId.value = normalizedUserId;
    await refreshMembers();
};

const userSearchParams = ref({
    filters: { status: 'approved' },
    orderBy: 'name',
    orderByDirection: 'asc',
    perPage: 1000,
    page: 1,
    paginate: false,
    deleted: false,
});

const { data: usersData } = await useApiFetch('/api/user/index', {
    method: 'POST',
    body: userSearchParams,
    lazy: true,
});

const userOptions = computed(() => usersData.value?.data || []);
const selectedUserId = computed(() => (canChooseNetwork.value ? item.value.user_id : userStore.getUserId));
const availableMembers = computed(() => {
    const members = Array.isArray(activeMembers.value?.data) ? activeMembers.value.data : activeMembers.value?.data?.data || [];
    if (canChooseNetwork.value && !selectedUserId.value) return members;
    if (!selectedUserId.value) return [];

    return members.filter((member) => {
        const memberUserId = member.user_id ?? member.userId ?? member.user?.id ?? member.user?.user_id ?? member.memberNetwork?.user_id ?? member.memberNetwork?.userId;
        return Number(memberUserId) === Number(selectedUserId.value);
    });
});

/* ---------- Company helpers ---------- */

const companyTypes = ref([
    { name: 'HQ', value: 'hq' },
    { name: 'Branch', value: 'branch' },
]);

// Map for O(1) lookup of company details by id
const membersMap = computed(() => {
    const map = new Map();
    availableMembers.value.forEach((m) => map.set(Number(m.id), m));
    return map;
});

const getCompany = (id) => membersMap.value.get(Number(id)) || null;

const buildLocation = (c) => [c?.city, c?.countryName].filter(Boolean).join(', ');

// Picker options: same company but with extra info so similar names can be told apart.
// - location: "City, Country"
// - meta: "ID #12"  (+ "Already added" if it is already in the group)
const addedIds = computed(() => new Set((item.value.companies || []).map((c) => Number(c.id_company))));

const companyOptions = computed(() =>
    availableMembers.value.map((m) => ({
        ...m,
        location: buildLocation(m) || 'No location',
        meta: `ID #${m.id}` + (addedIds.value.has(Number(m.id)) ? ' · Already added' : ''),
    })),
);

// Options available for the "add" picker (hide the ones already in the group)
const draftOptions = computed(() => companyOptions.value.filter((m) => !addedIds.value.has(Number(m.id))));

// Display info for a row (falls back to API data if the company is not in the loaded list)
const rowInfo = (member) => {
    const c = getCompany(member.id_company) || member.company || {};
    return {
        name: c.name || `Company #${member.id_company}`,
        location: buildLocation(c),
        imageUrl: c.imageUrl || c.image_url || null,
        initial: (c.name || '?').trim().charAt(0).toUpperCase(),
    };
};

// Companies list for the UI: HQ first, then by name, filtered by the search box.
// Each entry keeps a reference to the real object so edits go straight to item.companies.
const visibleCompanies = computed(() => {
    const q = companySearch.value.trim().toLowerCase();
    return (item.value.companies || [])
        .map((member) => ({ member, info: rowInfo(member) }))
        .filter(({ info }) => !q || info.name.toLowerCase().includes(q) || info.location.toLowerCase().includes(q))
        .sort((a, b) => {
            const aHq = a.member.type_company === 'hq' ? 0 : 1;
            const bHq = b.member.type_company === 'hq' ? 0 : 1;
            return aHq - bHq || a.info.name.localeCompare(b.info.name);
        });
});

const hqCount = computed(() => (item.value.companies || []).filter((c) => c.type_company === 'hq').length);
const branchCount = computed(() => (item.value.companies || []).filter((c) => c.type_company === 'branch').length);

watch(
    () => item.value.user_id,
    async (userId, previousUserId) => {
        if (canChooseNetwork.value && userId && userId !== previousUserId) {
            await loadMembersForUser(userId);
        }
    },
);

function buildPayload() {
    return {
        name: item.value.name,
        user_id: canChooseNetwork.value ? item.value.user_id : userStore.getUserId,
        companies: item.value.companies.map((company) => ({
            idCompany: company.id_company,
            typeCompany: company.type_company,
        })),
    };
}

async function updateItem() {
    const { data, error } = await useApiFetch(`/api/group/${item.value?.id}`, {
        method: 'PATCH',
        body: buildPayload(),
        lazy: true,
    });
    if (data.value) {
        useToast({ title: 'Success', message: data.value.message, type: 'success', duration: 5000 });
        await closeModal();
        await refresh();
    }
    if (error.value) {
        useToast({ title: 'Error', message: data.value?.message || 'Error updating item', type: 'error', duration: 5000 });
    }
}

async function addItem() {
    const { data, error } = await useApiFetch(`/api/group`, {
        method: 'POST',
        body: buildPayload(),
        lazy: true,
    });
    if (data.value) {
        useToast({ title: 'Success', message: data.value.message, type: 'success', duration: 5000 });
        await closeModal();
        await refresh();
    }
    if (error.value) {
        useToast({ title: 'Error', message: data.value?.message || 'Error adding item', type: 'error', duration: 5000 });
    }
}

async function handleModalSubmit() {
    formLoading.value = true;
    const result = await v$.value.$validate();
    if (!result) {
        formLoading.value = false;
        return false;
    }
    if (editMode.value === true) {
        await updateItem();
    } else {
        await addItem();
    }
    formLoading.value = false;
}

async function deleteItems() {
    const confirmed = confirm('Are you sure you want to delete this item?');
    if (confirmed) {
        const { data, error } = await useApiFetch(`/api/group/delete`, {
            body: { items: selectedRows.value },
            method: 'DELETE',
            lazy: true,
        });
        if (data.value) {
            useToast({ title: 'Success', message: data.value.message, type: 'success', duration: 5000 });
            selectedRows.value = [];
            await refresh();
        }
        if (error.value) {
            useToast({ title: 'Error', message: data.value?.message || 'Error deleting items', type: 'error', duration: 5000 });
        }
    }
}

async function forceDeleteItems() {
    const confirmed = confirm('Are you sure you want to permanently delete this item?');
    if (confirmed) {
        const { data, error } = await useApiFetch(`/api/group/force-delete`, {
            body: { items: selectedRows.value },
            method: 'DELETE',
            lazy: true,
        });
        if (data.value) {
            useToast({ title: 'Success', message: data.value.message, type: 'success', duration: 5000 });
            selectedRows.value = [];
            await refresh();
        }
        if (error.value) {
            useToast({ title: 'Error', message: data.value?.message || 'Error force deleting items', type: 'error', duration: 5000 });
        }
    }
}

async function restoreItems() {
    const confirmed = confirm('Are you sure you want to restore this item?');
    if (confirmed) {
        const { data, error } = await useApiFetch(`/api/group/restore`, {
            body: { items: selectedRows.value },
            method: 'POST',
            lazy: true,
        });
        if (data.value) {
            useToast({ title: 'Success', message: data.value.message, type: 'success', duration: 5000 });
            selectedRows.value = [];
            await refresh();
        }
        if (error.value) {
            useToast({ title: 'Error', message: data.value?.message || 'Error restoring items', type: 'error', duration: 5000 });
        }
    }
}

function addRow() {
    if (!companyDraft.value.id_company || !companyDraft.value.type_company) return;
    if (!item.value.companies) {
        item.value.companies = [];
    }
    // منع التكرار
    if (addedIds.value.has(Number(companyDraft.value.id_company))) {
        useToast({ title: 'Warning', message: 'This company is already in the group', type: 'error', duration: 4000 });
        return;
    }
    item.value.companies.push({
        id_company: companyDraft.value.id_company,
        type_company: companyDraft.value.type_company,
        company: null,
    });
    companyDraft.value = { id_company: null, type_company: null };
}

// الحذف بالـ id بدل الـ index لأن القائمة بتتفلتر وتترتب
function removeCompany(idCompany) {
    if (!Array.isArray(item.value.companies)) return;
    const index = item.value.companies.findIndex((c) => Number(c.id_company) === Number(idCompany));
    if (index !== -1) item.value.companies.splice(index, 1);
}
</script>

<template>
    <div v-if="useCheckPermission(['show-members-data-groups'])" class="flex flex-col gap-8">
        <!-- Page Title & Action Buttons -->
        <div class="md:flex md:items-center md:justify-between md:gap-5">
            <div class="flex items-center gap-2">
                <Icon name="solar:link-square-line-duotone" class="size-5 opacity-75" />
                <div>{{ serverParams.deleted ? 'Deleted Groups' : 'Groups' }}</div>
                <span v-if="rows?.meta?.total" class="text-sm opacity-50">({{ rows.meta.total }})</span>
            </div>
            <div class="md:flex md:items-center md:gap-5 md:space-y-0 space-y-5">
                <template v-if="selectedRows.length > 0">
                    <template v-if="serverParams.deleted">
                        <button v-if="useCheckPermission(['forceDelete-members-data-groups'])" class="btn btn-danger btn-rounded px-6 btn-sm gap-3 md:w-fit w-full md:mt-0 mt-5" @click="forceDeleteItems">
                            <Icon name="solar:trash-bin-minimalistic-line-duotone" class="size-5 opacity-75" />
                            Delete Permanently
                        </button>
                    </template>
                    <template v-else>
                        <button v-if="useCheckPermission(['delete-members-data-groups'])" class="btn btn-danger btn-rounded px-6 btn-sm gap-3 md:w-fit w-full md:mt-0 mt-5" @click="deleteItems">
                            <Icon name="solar:trash-bin-minimalistic-line-duotone" class="size-5 opacity-75" />
                            Delete Items
                        </button>
                    </template>
                    <template v-if="serverParams.deleted">
                        <button v-if="useCheckPermission(['network_group_restore'])" class="btn btn-success btn-rounded px-6 btn-sm gap-3 md:w-fit w-full md:mt-0 mt-5" @click="restoreItems">
                            <Icon name="solar:restart-circle-outline" class="size-5 opacity-75" />
                            Restore Items
                        </button>
                    </template>
                </template>
                <button v-if="useCheckPermission(['create-members-data-groups'])" :disabled="serverParams.deleted" class="btn btn-primary btn-rounded px-6 btn-sm gap-3 md:w-fit w-full md:mt-0 mt-5" @click="openModal()">
                    <Icon name="solar:add-square-linear" class="size-5 opacity-75" />
                    Add New
                </button>
                <button v-if="useCheckPermission(['delete-members-data-groups', 'forceDelete-members-data-groups', 'network_group_restore'])" class="btn btn-primary btn-rounded px-6 btn-sm gap-3 md:w-fit w-full md:mt-0 mt-5" @click="toggleDeleted">
                    <Icon :name="serverParams.deleted ? 'solar:hamburger-menu-line-duotone' : 'solar:trash-bin-minimalistic-line-duotone'" class="size-5 opacity-75" />
                    {{ serverParams.deleted ? 'Items List' : 'Deleted Items' }}
                </button>
            </div>
        </div>

        <!-- Filter & Search -->
        <div class="grid lg:grid-cols-12 gap-5 items-center p-5 bg-white border rounded-2xl">
            <FormInputField v-model="filter.name" rounded class="xl:col-span-3 lg:col-span-3" placeholder="Search by Name" label="Name" />
            <FormSelectField
                v-if="canChooseNetwork"
                v-model="filter.user_id"
                class="xl:col-span-3 lg:col-span-3"
                label="User (Network)"
                labelvalue="name"
                keyvalue="id"
                imgvalue="imageUrl"
                is-rounded-image
                placeholder="Filter by User"
                :select-data="userOptions"
                searchable
            />
            <FormSelectField v-model="serverParams.orderBy" :clearable="false" class="xl:col-span-3 lg:col-span-3" label="Sort By" labelvalue="name" keyvalue="value" placeholder="Sort By" :select-data="sortByList" />
            <FormSelectField
                v-model="serverParams.orderByDirection"
                class="xl:col-span-3 lg:col-span-3"
                :clearable="false"
                label="Sort Direction"
                labelvalue="name"
                keyvalue="value"
                placeholder="Sort Direction"
                :select-data="[
                    { name: 'Z : A', value: 'desc' },
                    { name: 'A : Z', value: 'asc' },
                ]"
            />
            <button class="xl:col-span-6 lg:col-span-6 btn btn-rounded btn-sm btn-primary gap-3 w-full" @click="refresh">
                <Icon name="solar:rounded-magnifer-line-duotone" class="size-5 shrink-0" />
                Filter
            </button>
            <button class="xl:col-span-6 lg:col-span-6 btn btn-rounded btn-sm btn-secondary gap-3 w-full" @click="resetServerParams">
                <Icon name="solar:restart-circle-outline" class="size-5 shrink-0" />
                Reset
            </button>
        </div>

        <!-- Table -->
        <table class="table table-report font-light">
            <thead>
                <tr class="uppercase text-sm">
                    <th class="text-left">
                        <input v-model="allSelected" type="checkbox" class="form-check-input" @change="selectAllRows" />
                    </th>
                    <th class="text-left">Name</th>
                    <th class="text-center">Companies</th>
                    <th v-if="serverParams.deleted">Deleted At</th>
                    <th class="text-right">Action</th>
                </tr>
            </thead>
            <tbody>
                <template v-if="status !== 'pending' && rows?.data">
                    <tr v-for="row in rows.data" :key="row.id" class="text-sm">
                        <td>
                            <input :checked="isSelected(row.id)" type="checkbox" class="form-check-input" @change="toggleRowSelection(row.id)" />
                        </td>
                        <td class="font-normal">
                            <div>{{ row.name }}</div>
                        </td>
                        <td class="text-center">
                            <div>{{ row.companies?.length || 0 }}</div>
                        </td>
                        <td v-if="serverParams.deleted" class="text-sm">{{ row.deletedAt }}</td>
                        <td class="text-right">
                            <div>
                                <button v-if="useCheckPermission(['update-members-data-groups'])" :disabled="serverParams.deleted" class="btn btn-secondary btn-rounded btn-sm gap-3" @click="openModal(row.id)">
                                    <Icon name="solar:pen-new-round-outline" class="size-4" />
                                    Edit
                                </button>
                            </div>
                        </td>
                    </tr>
                </template>
                <template v-else-if="status === 'pending'">
                    <tr v-for="i in serverParams.perPage" :key="'skeleton-' + i">
                        <td colspan="5">
                            <div class="h-12 !opacity-50 animate-pulse bg-gray-200 rounded" />
                        </td>
                    </tr>
                </template>
                <template v-else>
                    <tr>
                        <td colspan="5" class="text-center py-8 text-gray-500">No data available</td>
                    </tr>
                </template>
            </tbody>
        </table>

        <!-- Pagination -->
        <TablePagination :pending="status === 'pending'" :rows="rows" :page="serverParams.page" @change-page="changePage" />

        <!-- Modal -->
        <TheModal :open-modal="isOpen" size="5xl" @close-modal="closeModal()">
            <template #header>
                <div class="flex justify-between items-center">
                    <div class="font-medium" v-html="editMode ? 'Update Group' : 'Add New Group'"></div>
                    <Icon class="w-8 h-8 opacity-50 cursor-pointer hover:opacity-100 ease-in-out duration-300" name="solar:close-square-outline" @click="closeModal" />
                </div>
            </template>
            <template #content>
                <div class="grid lg:grid-cols-12 gap-5 items-start">
                    <FormInputField v-model="item.name" :errors="v$.name?.$errors" class="lg:col-span-12" label="Name" name="name" placeholder="Enter Name" />
                    <FormSelectField
                        v-if="!editMode && canChooseNetwork"
                        v-model="item.user_id"
                        :select-data="userOptions"
                        labelvalue="name"
                        keyvalue="id"
                        imgvalue="imageUrl"
                        is-rounded-image
                        class="lg:col-span-12"
                        label="Network User"
                        name="group-user"
                        placeholder="Select a network"
                        searchable
                    />

                    <!-- Companies -->
                    <div v-if="editMode" class="col-span-12 pt-8 border-slate-200 border-t">
                        <div class="flex flex-wrap justify-between items-center gap-2 mb-4">
                            <h3 class="font-medium text-lg">Companies</h3>
                            <div class="flex items-center gap-2 text-xs">
                                <span class="rounded-full bg-amber-100 text-amber-800 px-2.5 py-1 font-medium">{{ hqCount }} HQ</span>
                                <span class="rounded-full bg-slate-100 text-slate-700 px-2.5 py-1 font-medium">{{ branchCount }} Branch</span>
                                <span class="text-slate-500 ml-1">{{ item.companies.length }} total</span>
                            </div>
                        </div>

                        <!-- Add company (sticky) -->
                        <div v-if="useCheckPermission(['update-members-data-groups'])" class="sticky top-0 z-20 mb-4 grid grid-cols-1 xl:grid-cols-12 gap-4 items-end rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                            <FormSelectField
                                v-model="companyDraft.id_company"
                                labelvalue="name"
                                secondlabelvalue="location"
                                thirdlabelvalue="meta"
                                imgvalue="imageUrl"
                                keyvalue="id"
                                :select-data="draftOptions"
                                class="xl:col-span-6"
                                name="company-draft"
                                placeholder="Search by name, city or country"
                                label="Company"
                                searchable
                                filterable
                            />
                            <FormSelectField v-model="companyDraft.type_company" labelvalue="name" keyvalue="value" :select-data="companyTypes" class="xl:col-span-3" name="company-type-draft" placeholder="Select type" label="Type" />
                            <div class="xl:col-span-3 xl:flex xl:justify-end">
                                <button :disabled="!companyDraft.id_company || !companyDraft.type_company" type="button" class="btn btn-dark btn-sm btn-rounded px-4 disabled:opacity-50" @click="addRow">
                                    <Icon name="solar:add-square-linear" class="size-4 mr-1" />
                                    Add Company
                                </button>
                            </div>
                        </div>

                        <!-- Search inside the list -->
                        <div v-if="item.companies.length > 5" class="relative mb-3">
                            <Icon name="solar:rounded-magnifer-line-duotone" class="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input v-model="companySearch" type="text" placeholder="Filter added companies..." class="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-slate-400" />
                        </div>

                        <!-- Compact list -->
                        <div v-if="visibleCompanies.length" class="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden">
                            <div v-for="{ member, info } in visibleCompanies" :key="member.id_company" class="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                                <!-- Logo / initial -->
                                <img v-if="info.imageUrl" :src="info.imageUrl" alt="" class="size-10 rounded-full object-cover border border-slate-200 shrink-0" />
                                <div v-else class="size-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-sm font-medium shrink-0">
                                    {{ info.initial }}
                                </div>

                                <!-- Name + location + id -->
                                <div class="min-w-0 flex-1">
                                    <div class="text-sm font-medium text-slate-800 truncate">{{ info.name }}</div>
                                    <div class="flex items-center gap-2 text-xs text-slate-500">
                                        <span class="flex items-center gap-1 truncate">
                                            <Icon name="solar:map-point-linear" class="size-3.5 shrink-0" />
                                            <span class="truncate">{{ info.location || 'No location' }}</span>
                                        </span>
                                        <span class="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">ID #{{ member.id_company }}</span>
                                    </div>
                                </div>

                                <!-- Type toggle -->
                                <div class="inline-flex rounded-full bg-slate-100 p-0.5 text-xs font-medium shrink-0">
                                    <button
                                        v-for="t in companyTypes"
                                        :key="t.value"
                                        type="button"
                                        :disabled="!useCheckPermission(['update-members-data-groups'])"
                                        class="rounded-full px-3 py-1 transition disabled:cursor-not-allowed"
                                        :class="member.type_company === t.value ? (t.value === 'hq' ? 'bg-amber-400 text-amber-950 shadow-sm' : 'bg-white text-slate-800 shadow-sm') : 'text-slate-500 hover:text-slate-700'"
                                        @click="member.type_company = t.value"
                                    >
                                        {{ t.name }}
                                    </button>
                                </div>

                                <!-- Remove -->
                                <button
                                    :disabled="!useCheckPermission(['update-members-data-groups'])"
                                    type="button"
                                    title="Remove from group"
                                    class="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-40 shrink-0"
                                    @click="removeCompany(member.id_company)"
                                >
                                    <Icon name="solar:trash-bin-minimalistic-line-duotone" class="size-5" />
                                </button>
                            </div>
                        </div>

                        <div v-else class="rounded-xl border border-dashed border-slate-200 text-center py-8 text-sm text-gray-400">
                            {{ item.companies.length ? 'No companies match your filter.' : 'No companies added yet. Pick a company above and click "Add Company".' }}
                        </div>
                    </div>
                </div>
            </template>
            <template #footer>
                <div class="w-full flex items-center justify-end gap-5">
                    <button :disabled="formLoading" class="btn-rounded btn-sm btn btn-danger px-4" type="button" @click="closeModal">
                        <Icon :name="formLoading ? 'svg-spinners:3-dots-fade' : 'solar:close-circle-linear'" class="w-5 h-5 mr-2" />
                        <span>Close</span>
                    </button>
                    <button v-if="useCheckPermission(['network_group_create', 'update-members-data-groups'])" :disabled="formLoading" class="btn-rounded btn-sm btn btn-primary px-4" type="button" @click="handleModalSubmit()">
                        <Icon :name="formLoading ? 'svg-spinners:3-dots-fade' : 'solar:check-circle-broken'" class="w-5 h-5 mr-2" />
                        <span v-html="editMode ? 'Update' : 'Save'" />
                    </button>
                </div>
            </template>
        </TheModal>
    </div>
</template>