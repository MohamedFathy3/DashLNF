<script setup>
definePageMeta({
    middleware: 'auth',
});
const selectedRows = ref([]);
const sortByList = ref([
    { name: 'Sort By ID', value: 'id' },
    { name: 'Sort By Date', value: 'created_at' },
]);

const serverParams = ref({
    from: null,
    to: null,
    orderBy: 'created_at',
    orderByDirection: 'desc',
    perPage: 25,
    page: 1,
    paginate: true,
});
const resetServerParams = async () => {
    serverParams.value = {
        from: null,
        to: null,
        orderBy: 'created_at',
        orderByDirection: 'desc',
        perPage: 25,
        page: 1,
        paginate: true,
    };
    selectedRows.value = [];
    await refresh();
};
const {
    data: rows,
    pending,
    refresh,
} = await useApiFetch('/api/log/index', {
    method: 'POST',
    body: serverParams,
    lazy: true,
});

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
</script>
<template>
    <div class="flex flex-col gap-8">
        <!-- Page Title & Action Buttons -->
        <div class="md:flex md:items-center md:justify-between md:gap-5">
            <div class="flex items-center gap-2">
                <Icon name="solar:clipboard-list-outline" class="size-5 opacity-75" />
                <div>Activity Logs</div>
            </div>
        </div>
        <!-- Filter & Search -->
        <div class="grid lg:grid-cols-12 gap-5 items-center p-5 bg-white border rounded-2xl">
            <FormDatePicker v-model="serverParams.from" :time-picker="false" :range="false" placeholder="From Date" class="xl:col-span-6 lg:col-span-6" />
            <FormDatePicker v-model="serverParams.to" :time-picker="false" :range="false" placeholder="To Date" class="xl:col-span-6 lg:col-span-6" />
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
                    <th class="text-left">Name</th>
                    <th class="text-left">Log</th>
                    <th class="text-left">Date</th>
                </tr>
            </thead>
            <tbody>
                <template v-if="!pending && rows">
                    <tr v-for="row in rows.data" :key="row.id" class="text-sm">
                        <td class="font-normal">
                            <div v-if="row.ip">{{ row.ip }}</div>
                            <div v-else>Undefined</div>
                        </td>
                        <td class="font-normal">
                            <div v-if="row.description !== 'login'" class="capitalize font-light">
                                <div class="line-clamp-1 truncate">
                                    <span class="font-normal">{{ row.module }}</span> was <span class="font-normal">{{ row.description }}</span> for record <span class="font-normal">{{ row.properties?.name }}</span>
                                </div>
                                <div class="mt-2">
                                    <span v-if="row.causer" class="px-3 py-1 text-xs font-medium border bg-slate-100 rounded-full">{{ row.causer }}</span>
                                </div>
                            </div>
                            <div v-else>
                                <div v-if="row.description" class="capitalize">{{ row.description }}</div>
                                <div class="mt-2">
                                    <span v-if="row.causer" class="px-3 py-1 text-xs font-medium border bg-slate-100 rounded-full">{{ row.causer }}</span>
                                </div>
                            </div>
                        </td>
                        <td class="font-normal">
                            <div>{{ row.date }}</div>
                            <div class="mt-0.5 font-light">{{ row.time }}</div>
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
        <!-- Pagination -->
        <TablePagination :pending="pending" :rows="rows" :page="serverParams.page" @change-page="changePage" />
    </div>
</template>
