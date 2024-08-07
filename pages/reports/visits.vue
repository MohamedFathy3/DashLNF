<script setup>
import { required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';

definePageMeta({
    middleware: 'auth',
});
const selectedRows = ref([]);
const filter = ref({
    ip: null,
    countryId: null,
    city: null,
});

const serverParams = ref({
    filters: {},
    perPage: 25,
    page: 1,
});
const formLoading = ref(false);
const isOpen = ref(false);
const editMode = ref(false);
const resetServerParams = async () => {
    filter.value = {
        ip: null,
        countryId: null,
        city: null,
    };
    serverParams.value = {
        filters: {},
        perPage: 25,
        page: 1,
    };
    selectedRows.value = [];
    await refresh();
};
const {
    data: rows,
    pending,
    refresh,
} = await useApiFetch('/api/visit/index/ip', {
    params: serverParams,
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
const item = ref({
    name: null,
    orderId: null,
    active: true,
});
const rules = ref({
    name: { required },
    orderId: {},
    active: {},
});
const v$ = useVuelidate(rules, item);
const fetchItem = async (id) => {
    const { data, error } = await useApiFetch(`/api/visit/${id}`, {
        lazy: true,
    });
    if (data.value) {
        item.value = data.value.data;
    }
    if (error.value) {
        useToast({ title: 'Error', message: data.value.message, type: 'error', duration: 5000 });
    }
};
const resetItemValues = async () => {
    item.value = {
        name: null,
        orderId: null,
        active: true,
    };
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
    }
    formLoading.value = false;
    isOpen.value = true;
}
const resources = useResourceStore();

function getUniquePersons(paths) {
    const uniquePersonsMap = new Map();

    paths.forEach((item) => {
        if (item.person) {
            const key = `${item.person.id}-${item.person.accountType}`;
            if (!uniquePersonsMap.has(key)) {
                uniquePersonsMap.set(key, item.person);
            }
        }
    });

    return Array.from(uniquePersonsMap.values());
}
</script>
<template>
    <div class="flex flex-col gap-8">
        <!-- Page Title & Action Buttons -->
        <div class="md:flex md:items-center md:justify-between md:gap-5">
            <div class="flex items-center gap-2">
                <Icon name="solar:asteroid-linear" class="size-5 opacity-75" />
                <div>{{ serverParams.deleted ? 'Deleted Visits' : 'Visits' }}</div>
            </div>
        </div>
        <!-- Filter & Search -->
        <div class="grid lg:grid-cols-12 gap-5 items-center p-5 bg-white border rounded-2xl">
            <FormInputField v-model="filter.ip" rounded class="xl:col-span-4 lg:col-span-4" placeholder="IP" />
            <FormSelectField
                id="get-members-by-country-form"
                v-model="filter.countryId"
                class="lg:col-span-4 xl:col-span-4"
                placeholder="Please select a country..."
                :select-data="resources.countries"
                labelvalue="name"
                keyvalue="id"
                imgvalue="imageUrl"
            />
            <FormInputField v-model="filter.city" rounded class="xl:col-span-4 lg:col-span-4" placeholder="City" />
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
        <div class="overflow-x-auto">
            <table class="table table-report font-light">
                <thead>
                    <tr class="uppercase text-sm">
                        <th class="text-left">
                            <input v-model="allSelected" type="checkbox" class="form-check-input" @change="selectAllRows" />
                        </th>
                        <th>Location</th>
                        <th>Total Visits</th>
                        <th>Last Visit</th>
                        <th class="text-right">Action</th>
                    </tr>
                </thead>
                <tbody>
                    <template v-if="!pending && rows">
                        <tr v-for="row in rows.data" :key="row.id" class="text-sm">
                            <td>
                                <input :checked="isSelected(row.id)" type="checkbox" class="form-check-input" @change="toggleRowSelection(row.id)" />
                            </td>
                            <td class="font-normal">
                                <div>{{ row.ip }}</div>
                                <div class="flex items-center text-xs whitespace-nowrap mt-1">
                                    <NuxtImg :src="row.country?.imageUrl" class="h-4 !rounded-sm w-6 object-cover shrink-0 mr-1.5" />
                                    <div class="opacity-75 font-semibold">{{ row.country?.name }}</div>
                                    <span class="capitalize font-light opacity-80">, {{ row.city?.toLowerCase() }}</span>
                                </div>
                            </td>
                            <td>
                                <div>
                                    <div>
                                        <span v-if="getUniquePersons(row.paths).length > 0" class="flex items-center gap-1.5 flex-wrap">
                                            <span
                                                v-for="(p, index) in getUniquePersons(row.paths)"
                                                :key="index"
                                                :class="p.accountType === 'company' ? 'bg-success/25 text-success !border-success/25' : 'bg-warning/25 text-orange-900 !border-warning/25'"
                                                class="text-xs font-normal rounded-full px-2 border py-0.5"
                                            >
                                                <span v-if="p.accountType === 'delegate'" class="capitalize">{{ p.name.toLowerCase() }}</span>
                                                <span v-else>{{ p.name }}</span>
                                            </span>
                                        </span>
                                        <span v-else class="text-xs font-normal bg-slate-100 rounded-full px-2 border py-0.5">Guest</span>
                                    </div>
                                    <div class="text-xs font-normal mt-1 whitespace-nowrap truncate w-44">
                                        <span class="mr-1.5 font-light">Total visits:</span>
                                        {{ row.paths.length }}
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div>
                                    <div class="text-xs font-normal mt-1 whitespace-nowrap truncate w-44 opacity-75">{{ row.paths[0].path }}</div>
                                    <div class="font-normal text-sm opacity-75 mt-1">{{ row.paths[0].createdAt }}</div>
                                </div>
                            </td>
                            <td class="text-right">
                                <div>
                                    <button :disabled="serverParams.deleted" class="btn btn-secondary btn-rounded btn-sm gap-3" @click="openModal(row.id)">
                                        <Icon name="solar:eye-outline" class="size-4" />
                                        View
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </template>
                    <template v-else>
                        <tr v-for="i in serverParams.perPage" :key="i">
                            <td colspan="5">
                                <div class="h-12 !opacity-50 animate-pulse" />
                            </td>
                        </tr>
                    </template>
                </tbody>
            </table>
        </div>
        <!-- Pagination -->
        <TablePagination :pending="pending" :rows="rows" :page="serverParams.page" @change-page="changePage" />

        <TheModal :open-modal="isOpen" size="5xl" @close-modal="closeModal()">
            <template #header>
                <div class="flex justify-between items-center">
                    <div class="font-medium" v-html="'View Record'"></div>
                    <Icon class="w-8 h-8 opacity-50 cursor-pointer hover:opacity-100 ease-in-out duration-300" name="solar:close-square-outline" @click="closeModal" />
                </div>
            </template>
            <template #content>
                <div v-if="item && item.id">
                    <ul class="divide-y divide-dashed">
                        <li class="py-2 grid lg:grid-cols-12 gap-5 items-start">
                            <div class="lg:col-span-4 font-light">IP</div>
                            <div class="lg:col-span-8">{{ item.ip }}</div>
                        </li>
                        <li class="py-2 grid lg:grid-cols-12 gap-5 items-start">
                            <div class="lg:col-span-4 font-light">Location</div>
                            <div class="lg:col-span-8 flex items-center">
                                <NuxtImg :src="item.country?.imageUrl" class="h-4 !rounded-sm w-6 object-cover shrink-0 mr-1.5" />
                                <div class="opacity-75 font-semibold">{{ item.country?.name }}</div>
                                <span class="capitalize font-light opacity-80">, {{ item.state }}</span>
                                <span class="capitalize font-light opacity-80">, {{ item.city }}</span>
                            </div>
                        </li>
                        <li class="py-2 grid lg:grid-cols-12 gap-5 items-start">
                            <div class="lg:col-span-4 font-light">Total Visits Count</div>
                            <div class="lg:col-span-8">{{ item.paths.length }} Visits</div>
                        </li>
                    </ul>
                    <div class="border-t mt-5 pt-5">
                        <ul>
                            <li v-for="(path, index) in item.paths" :key="index" class="font-light text-sm p-2.5 rounded-full odd:bg-slate-100 grid lg:grid-cols-12 gap-5 items-start">
                                <div class="lg:col-span-4 truncate">{{ path.path }}</div>
                                <div class="lg:col-span-4">{{ path.createdAt }}</div>
                                <div class="lg:col-span-4">{{ path.person?.name }}</div>
                            </li>
                        </ul>
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
