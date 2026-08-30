<script setup>
definePageMeta({
    middleware: ['auth', 'permission'],
    permissions: ['network_claim_form_list'],
});
const selectedRows = ref([]);
const sortByList = ref([
    { name: 'Sort By ID', value: 'id' },
    { name: 'Sort By Date', value: 'created_at' },
]);
const filter = ref({
    name: null,
    countryId: null,
});
const item = ref(null);
const currencyTotals = ref([]);
const selectedId = ref(null);

const serverParams = ref({
    filters: {},
    orderBy: 'created_at',
    orderByDirection: 'desc',
    perPage: 25,
    page: 1,
    paginate: true,
    deleted: false,
});
const formLoading = ref(false);
const isOpen = ref(false);
const resetServerParams = async () => {
    filter.value = {
        name: null,
        countryId: null,
    };
    serverParams.value = {
        filters: {},
        orderBy: 'id',
        orderByDirection: 'desc',
        perPage: 25,
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
} = await useApiFetch('/api/claim-form/index', {
    method: 'POST',
    body: serverParams,
    lazy: true,
});
watch(
    filter,
    (newVal) => {
        for (const key in newVal) {
            const value = newVal[key];
            if (value) {
                serverParams.value.filters[key] = value;
            } else {
                delete serverParams.value.filters[key];
            }
        }
    },
    { deep: true },
);
const toggleDeleted = async () => {
    serverParams.value.deleted = !serverParams.value.deleted;
    selectedRows.value = [];
    await refresh();
};
const isSelected = (id) => {
    return selectedRows.value.some((r) => r === id);
};
const allSelected = computed(() => {
    return rows?.value?.data.every((row) => selectedRows.value.includes(row.id));
});
const selectAllRows = () => {
    const allSelected = rows.value.data.every((row) => isSelected(row.id));
    if (allSelected) {
        selectedRows.value = [];
    } else {
        rows.value.data.forEach((row) => {
            const id = row.id;
            if (!isSelected(id)) {
                selectedRows.value.push(id);
            }
        });
    }
};
const changePage = async (value) => {
    const pageNumber = parseInt(value);
    if (!isNaN(pageNumber)) {
        serverParams.value.page = pageNumber;
    } else {
        console.error('Invalid page number:', value);
    }
    selectedRows.value = [];
    await refresh();
};
const toggleRowSelection = (id) => {
    const index = selectedRows.value.indexOf(id);
    if (index === -1) {
        selectedRows.value.push(id);
    } else {
        selectedRows.value.splice(index, 1);
    }
};

async function closeModal() {
    isOpen.value = false;
    selectedId.value = null;
    item.value = null;
    currencyTotals.value = [];
}
async function openModal(id) {
    formLoading.value = true;
    if (id) {
        const { data, error } = await useApiFetch(`/api/claim-form/${id}`);
        if (data.value) {
            console.log(data.value.data);
            item.value = data.value.data;
            currencyTotalsArray(data.value.data.invoices);
        }
        if (error.value) {
            useToast({ title: 'Error', message: data.value.message, type: 'error', duration: 5000 });
        }
    }
    isOpen.value = true;
    formLoading.value = false;
}

async function deleteItems() {
    const confirmed = confirm('Are you sure you want to delete this item?');
    if (confirmed) {
        const { data, error } = await useApiFetch(`/api/claim-form/delete`, {
            body: { items: selectedRows.value },
            method: 'DELETE',
            lazy: true,
        });
        if (data.value) {
            useToast({ title: 'Success', message: data.value.message, type: 'success', duration: 5000 });
            await refresh();
        }
        if (error.value) {
            useToast({ title: 'Error', message: data.value.message, type: 'error', duration: 5000 });
        }
    }
}

async function forceDeleteItems() {
    const confirmed = confirm('Are you sure you want to delete this item?');
    if (confirmed) {
        const { data, error } = await useApiFetch(`/api/claim-form/force-delete`, {
            body: { items: selectedRows.value },
            method: 'DELETE',
            lazy: true,
        });
        if (data.value) {
            useToast({ title: 'Success', message: data.value.message, type: 'success', duration: 5000 });
            await refresh();
        }
        if (error.value) {
            useToast({ title: 'Error', message: data.value.message, type: 'error', duration: 5000 });
        }
    }
}

async function restoreItems() {
    const confirmed = confirm('Are you sure you want to delete this item?');
    if (confirmed) {
        const { data, error } = await useApiFetch(`/api/claim-form/restore`, {
            body: { items: selectedRows.value },
            method: 'POST',
            lazy: true,
        });
        if (data.value) {
            useToast({ title: 'Success', message: data.value.message, type: 'success', duration: 5000 });
            await refresh();
        }
        if (error.value) {
            useToast({ title: 'Error', message: data.value.message, type: 'error', duration: 5000 });
        }
    }
}
const currencyTotalsArray = (invoices) => {
    const totals = {};
    if (invoices.length > 0) {
        invoices.forEach((invoice) => {
            const amount = parseFloat(invoice.amount) || 0;
            if (!totals[invoice.currency]) {
                totals[invoice.currency] = 0;
            }
            totals[invoice.currency] += amount;
        });

        currencyTotals.value = Object.entries(totals).map(([currency, total]) => ({
            currency,
            total: parseFloat(total.toFixed(2)), // Ensure two decimal points
        }));
    } else {
        return [];
    }
};

const statusList = [
    { label: 'Open', value: 'open' },
    { label: 'Closed', value: 'closed' },
    { label: 'Postponed', value: 'postponed' },
];

const changeStatus = async (event, id) => {
    const target = event.target;
    const status = target.value;
    try {
        const response = await useApiFetch(`/api/claim-forms/${id}/status`, {
            method: 'PATCH',
            body: {
                status,
            },
        });

        useToast({ title: 'Success', message: response.data.value.message, type: 'success', duration: 5000 });
        await refresh();
    } catch (error) {
        useToast({ title: 'Error', message: error, type: 'error', duration: 5000 });
    }
};
</script>
<template>
    <div v-if="useCheckPermission(['show-members-data-claim-forms'])" class="flex flex-col gap-8">
        <!-- Page Title & Action Buttons -->
        <div class="md:flex md:items-center md:justify-between md:gap-5">
            <div class="flex items-center gap-2">
                <Icon name="solar:square-transfer-horizontal-broken" class="size-5 opacity-75" />
                <div>{{ serverParams.deleted ? 'Deleted Claim Forms' : 'Claim Forms' }}</div>
            </div>
            <div class="md:flex md:items-center md:gap-5 md:space-y-0 space-y-5">
                <template v-if="selectedRows.length > 0">
                    <template v-if="serverParams.deleted">
                        <button v-if="useCheckPermission(['forceDelete-members-data-claim-forms'])" class="btn btn-danger btn-rounded px-6 btn-sm gap-3 md:w-fit w-full md:mt-0 mt-5" @click="forceDeleteItems">
                            <Icon name="solar:trash-bin-minimalistic-line-duotone" class="size-5 opacity-75" />
                            Delete Permanently
                        </button>
                    </template>
                    <template v-else>
                        <button v-if="useCheckPermission(['delete-members-data-claim-forms'])" class="btn btn-danger btn-rounded px-6 btn-sm gap-3 md:w-fit w-full md:mt-0 mt-5" @click="deleteItems">
                            <Icon name="solar:trash-bin-minimalistic-line-duotone" class="size-5 opacity-75" />
                            Delete Items
                        </button>
                    </template>
                    <template v-if="serverParams.deleted">
                        <button v-if="useCheckPermission(['network_claim_form_restore'])" class="btn btn-success btn-rounded px-6 btn-sm gap-3 md:w-fit w-full md:mt-0 mt-5" @click="restoreItems">
                            <Icon name="solar:restart-circle-outline" class="size-5 opacity-75" />
                            Restore Items
                        </button>
                    </template>
                </template>
                <button
                    v-if="useCheckPermission(['delete-members-data-claim-forms', 'forceDelete-members-data-claim-forms', 'network_claim_form_restore'])"
                    class="btn btn-primary btn-rounded px-6 btn-sm gap-3 md:w-fit w-full md:mt-0 mt-5"
                    @click="toggleDeleted"
                >
                    <Icon :name="serverParams.deleted ? 'solar:hamburger-menu-line-duotone' : 'solar:trash-bin-minimalistic-line-duotone'" class="size-5 opacity-75" />
                    {{ serverParams.deleted ? 'Items List' : 'Deleted Items' }}
                </button>
            </div>
        </div>
        <!-- Filter & Search -->
        <div class="grid lg:grid-cols-12 gap-5 items-center p-5 bg-white border rounded-2xl">
            <!--            <FormInputField v-model="filter.name" rounded class="xl:col-span-6 lg:col-span-6" placeholder="Name" />-->
            <!--            <FormSelectField v-model="filter.countryId" labelvalue="name" keyvalue="id" imgvalue="imageUrl" :select-data="resources.countries" class="xl:col-span-6 lg:col-span-6" name="reference-country" placeholder="Country" />-->
            <FormSelectField v-model="serverParams.orderBy" :clearable="false" class="xl:col-span-6 lg:col-span-6" labelvalue="name" keyvalue="value" placeholder="Sort Direction" :select-data="sortByList" />
            <FormSelectField
                v-model="serverParams.orderByDirection"
                class="xl:col-span-6 lg:col-span-6"
                :clearable="false"
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
                Apply
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
                    <th>Member</th>
                    <th>Debtor</th>
                    <th>Status</th>
                    <th>Created at</th>
                    <th v-if="serverParams.deleted">Deleted At</th>
                    <th class="text-right">Action</th>
                </tr>
            </thead>
            <tbody>
                <template v-if="status !== 'pending' && rows">
                    <tr v-for="row in rows.data" :key="row.id" class="text-sm">
                        <td>
                            <input :checked="isSelected(row.id)" type="checkbox" class="form-check-input" @change="toggleRowSelection(row.id)" />
                        </td>
                        <td class="font-normal 2xl:max-w-64 max-w-44">
                            <div class="truncate">{{ row.member?.name }}</div>
                            <div class="flex items-center text-xs whitespace-nowrap">
                                <NuxtImg :src="row.member?.country?.imageUrl" class="h-4 !rounded-sm w-6 object-cover shrink-0 mr-1.5" />
                                <div class="opacity-75 font-semibold">{{ row.member?.country?.name }}</div>
                                <span class="capitalize font-light opacity-80">, {{ row.member?.city?.toLowerCase() }}</span>
                            </div>
                        </td>
                        <td class="font-normal 2xl:max-w-64 max-w-44">
                            <div class="truncate">{{ row.debtor.name }}</div>
                            <div class="flex items-center text-xs whitespace-nowrap">
                                <NuxtImg :src="row.debtor.country?.imageUrl" class="h-4 !rounded-sm w-6 object-cover shrink-0 mr-1.5" />
                                <div class="opacity-75 font-semibold">{{ row.debtor.country?.name }}</div>
                                <span class="capitalize font-light opacity-80">, {{ row.debtor.city?.toLowerCase() }}</span>
                            </div>
                        </td>
                        <td class="font-normal 2xl:max-w-64 max-w-44">
                            <UiClaimStatusBadge :status="row.status" />
                        </td>
                        <td class="text-sm font-normal whitespace-nowrap">
                            <div>{{ row.createdAt }}</div>
                        </td>
                        <td v-if="serverParams.deleted" class="text-sm">{{ row.deletedAt }}</td>
                        <td class="text-right">
                            <div>
                                <button v-if="useCheckPermission(['network_claim_form_list'])" :disabled="serverParams.deleted" class="btn btn-secondary btn-rounded btn-sm gap-3" @click="openModal(row.id)">
                                    <Icon name="solar:eye-outline" class="size-4" />
                                    View
                                </button>
                            </div>
                        </td>
                    </tr>
                </template>
                <template v-else>
                    <tr v-for="i in serverParams.perPage" :key="i">
                        <td :colspan="serverParams.deleted ? 6 : 5">
                            <div class="h-12 !opacity-50 animate-pulse" />
                        </td>
                    </tr>
                </template>
            </tbody>
        </table>
        <!-- Pagination -->
        <TablePagination :pending="status === 'pending'" :rows="rows" :page="serverParams.page" @change-page="changePage" />
        <TheModal :open-modal="isOpen" size="5xl" @close-modal="closeModal()">
            <template #header>
                <div class="flex justify-between items-center">
                    <div class="font-medium">View Claim</div>
                    <Icon class="w-8 h-8 opacity-50 cursor-pointer hover:opacity-100 ease-in-out duration-300" name="solar:close-square-outline" @click="closeModal" />
                </div>
            </template>
            <template #content>
                <div v-if="item" class="flex flex-col gap-5">
                    <div class="py-1 pl-5 border-l-4 border-success">
                        <div class="flex justify-between items-center">
                            <div class="ml-2 font-semibold">Member Details</div>
                            <div class="flex items-center gap-1 text-sm mt-1 opacity-75">
                                <div class="font-semibold py-2">
                                    <select id="status" name="status" class="rounded-full w-40 border border-gray-300 px-4 py-1 text-sm shadow-lg cursor-pointer" @change="changeStatus($event, item.id)">
                                        <option value="">change Status</option>
                                        <option v-for="status in statusList" :key="status.value" :value="status.value" :selected="status.value === item.status">
                                            {{ status.label }}
                                        </option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div class="mt-3 divide-y divide-dashed p-3 border rounded-xl bg-slate-50/50">
                            <div class="py-1.5 grid lg:grid-cols-12 gap-5 items-start">
                                <div class="lg:col-span-4 text-sm font-medium">Company Name</div>
                                <NuxtLink target="_blank" :to="'/members-data/members/' + item.member.id" class="lg:col-span-8 text-sm font-medium hover:opacity-75">{{ item.member.name }}</NuxtLink>
                            </div>
                            <div class="py-1.5 grid lg:grid-cols-12 gap-5 items-start">
                                <div class="lg:col-span-4 text-sm font-medium">WSA ID:</div>
                                <div class="lg:col-span-8 text-sm font-light">{{ item.member.wsaId }}</div>
                            </div>
                            <div class="py-1.5 grid lg:grid-cols-12 gap-5 items-start">
                                <div class="lg:col-span-4 text-sm font-medium">Country:</div>
                                <div class="lg:col-span-8 text-sm font-light">
                                    <div class="flex items-center text-xs whitespace-nowrap">
                                        <NuxtImg :src="item.member?.country?.imageUrl" class="h-4 !rounded-sm w-6 object-cover shrink-0 mr-1.5" />
                                        <div class="opacity-75 font-semibold">{{ item.member?.country?.name }}</div>
                                        <span class="capitalize font-light opacity-80">, {{ item.member?.city?.toLowerCase() }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="py-1 pl-5 border-l-4 border-danger">
                        <div class="ml-2 font-semibold">Debtor Details</div>
                        <div class="mt-3 divide-y divide-dashed p-3 border rounded-xl bg-slate-50/50">
                            <div class="py-1.5 grid lg:grid-cols-12 gap-5 items-start">
                                <div class="lg:col-span-4 text-sm font-medium">Company Name</div>
                                <NuxtLink target="_blank" :to="'/members-data/members/' + item.debtor.id" class="lg:col-span-8 text-sm font-medium hover:opacity-75">{{ item.debtor.name }}</NuxtLink>
                            </div>
                            <div class="py-1.5 grid lg:grid-cols-12 gap-5 items-start">
                                <div class="lg:col-span-4 text-sm font-medium">WSA ID:</div>
                                <div class="lg:col-span-8 text-sm font-light">{{ item.debtor.wsaId }}</div>
                            </div>
                            <div class="py-1.5 grid lg:grid-cols-12 gap-5 items-start">
                                <div class="lg:col-span-4 text-sm font-medium">Country:</div>
                                <div class="lg:col-span-8 text-sm font-light">
                                    <div class="flex items-center text-xs whitespace-nowrap">
                                        <NuxtImg :src="item.debtor?.country?.imageUrl" class="h-4 !rounded-sm w-6 object-cover shrink-0 mr-1.5" />
                                        <div class="opacity-75 font-semibold">{{ item.debtor?.country?.name }}</div>
                                        <span class="capitalize font-light opacity-80">, {{ item.debtor?.city?.toLowerCase() }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div class="ml-2 font-semibold">Invoices</div>
                        <ul class="mt-3 space-y-3">
                            <li v-for="invo in item.invoices" :key="invo.id" class="grid lg:grid-cols-12 gap-5 bg-white rounded-xl lg:rounded-full p-3 border text-sm">
                                <div class="lg:col-span-1">
                                    <NuxtLink target="_blank" :to="invo.fileUrl">
                                        <button type="button" class="hover:scale-105 shrink-0 ease-in-out duration-300 size-12 p-2 rounded-full bg-success/15 ring-success/25 ring-2 flex items-center place-content-center">
                                            <Icon class="shrink-0 size-9 opacity-75 text-success" name="solar:file-download-outline" />
                                        </button>
                                    </NuxtLink>
                                </div>
                                <div class="lg:col-span-6">
                                    <div class="pb-1 border-b border-dashed flex items-center gap-2">
                                        <Icon class="shrink-0 size-4 opacity-75" name="solar:hashtag-bold-duotone" />
                                        <div>{{ invo.number }}</div>
                                    </div>
                                    <div class="pt-1 font-light flex items-center gap-5 justify-between">
                                        <div class="flex items-center gap-2">
                                            <Icon class="shrink-0 size-4 opacity-75" name="solar:calendar-line-duotone" />
                                            <span>{{ invo.date }}</span>
                                        </div>
                                        <div>{{ invo.days }} Day(s)</div>
                                    </div>
                                </div>
                                <div class="lg:col-span-4 text-base flex items-center place-content-center">
                                    <div class="flex items-center gap-2">
                                        <Icon class="shrink-0 size-5 opacity-75" name="ion:cash-outline" />
                                        <div>
                                            {{ invo.amount }}<span class="font-light opacity-75 ml-1">{{ invo.currency }}</span>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <div class="pt-3 border-t border-dashed px-5">
                            <div class="flex items-start justify-between gap-5">
                                <div class="ml-2 font-semibold">Total Amount</div>
                                <ul class="divide-y">
                                    <li v-for="item in currencyTotals" :key="item.currency" class="py-1.5 lg:px-12 px-5 flex items-center gap-5 justify-between">
                                        <div>{{ item.total }}</div>
                                        <div class="font-light opacity-75">{{ item.currency }}</div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div class="pt-3 border-t border-dashed">
                        <div class="ml-2 font-semibold">Claim Details</div>
                        <div class="mt-3 divide-y divide-dashed p-3 border rounded-xl bg-slate-50/50">
                            <div class="py-1.5 grid lg:grid-cols-12 gap-5 items-start">
                                <div class="lg:col-span-4 text-sm font-medium">Person Filling Form</div>
                                <div class="lg:col-span-8 text-sm font-light">{{ item.person }}</div>
                            </div>
                            <div class="py-1.5 grid lg:grid-cols-12 gap-5 items-start">
                                <div class="lg:col-span-4 text-sm font-medium">Person Email</div>
                                <div class="lg:col-span-8 text-sm font-light">{{ item.email }}</div>
                            </div>
                            <div class="py-1.5 grid lg:grid-cols-12 gap-5 items-start">
                                <div class="lg:col-span-4 text-sm font-medium">Agreed Credit Terms</div>
                                <div class="lg:col-span-8 text-sm font-light">{{ item.creditTerms }}</div>
                            </div>
                            <div class="py-1.5 grid lg:grid-cols-12 gap-5 items-start">
                                <div class="lg:col-span-4 text-sm font-medium">Other Networks Membership</div>
                                <div class="lg:col-span-8 text-sm font-light">{{ item.otherNetworks }}</div>
                            </div>
                            <div class="py-1.5 grid lg:grid-cols-12 gap-5 items-start">
                                <div class="lg:col-span-4 text-sm font-medium">Insurance Company and Policy</div>
                                <div class="lg:col-span-8 text-sm font-light">{{ item.insurance }}</div>
                            </div>
                            <div class="py-1.5 grid lg:grid-cols-12 gap-5 items-start">
                                <div class="lg:col-span-4 text-sm font-medium">Comment</div>
                                <div class="lg:col-span-8 text-sm font-light">{{ item.comment }}</div>
                            </div>
                            <div class="py-1.5 grid lg:grid-cols-12 gap-5 items-start">
                                <div class="lg:col-span-4 text-sm font-medium">Submitted at</div>
                                <div class="lg:col-span-8 text-sm font-light">{{ item.createdAt }}</div>
                            </div>
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
                </div>
            </template>
        </TheModal>
    </div>
</template>
