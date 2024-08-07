<template>
    <div class="p-5 bg-white rounded-2xl">
        <div class="flex items-center gap-5 justify-between">
            <div class="flex items-center gap-3">
                <Icon v-if="icon" :name="icon" class="opacity-75 size-5" />
                <span v-if="sectionHeading" class="font-medium">{{ sectionHeading }}</span>
            </div>
            <div v-if="total" class="px-2 py-0.5 bg-slate-200 rounded-md">{{ currency ? useFormatCurrency(total) : total }} <span v-if="currency" class="text-xs opacity-75 ml-1">USD</span></div>
        </div>
        <div class="mt-5">
            <Bar :data="data" :options="options" class="min-h-64" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, type ChartOptions, type ChartData } from 'chart.js';
import { Bar } from 'vue-chartjs';
import colors from 'tailwindcss/colors';

const props = defineProps({
    sectionHeading: {
        type: String,
        default: null,
    },
    icon: {
        type: String,
        default: null,
    },
    chartLabels: {
        type: Array as () => string[],
        required: true,
    },
    chartDataValues: {
        type: Array as () => ChartDataValues[],
        required: true,
    },
    total: {
        type: Number,
        default: undefined,
    },
    currency: {
        type: Boolean,
        default: false,
    },
});

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const options = computed<ChartOptions<'bar'>>(() => {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
            },
            tooltip: {
                intersect: false,
            },
        },
        scales: {
            y: {
                grid: {
                    color: colors.slate[200],
                },
                ticks: {
                    color: colors.slate[700],
                },
            },
            x: {
                grid: {
                    color: colors.slate[200],
                },
                ticks: {
                    color: colors.slate[700],
                },
            },
        },
    };
});

const data = ref<ChartData<'bar'>>({
    labels: props.chartLabels,
    datasets: [
        {
            label: props.chartDataValues[0]?.label,
            data: props.chartDataValues[0]?.data,
            backgroundColor: colors.blue[800],
        },
        {
            label: props.chartDataValues[1]?.label,
            data: props.chartDataValues[1]?.data,
            backgroundColor: colors.yellow[500],
        },
    ],
});
</script>
