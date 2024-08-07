<template>
    <HeadlessCombobox v-model="selected" multiple>
        <div class="relative mt-1">
            <div class="relative w-full form-control">
                <div class="relative flex items-center gap-3">
                    <ul v-if="selected.length > 0" class="p-2 w-full items-center flex flex-wrap z-20 gap-1.5">
                        <li v-for="(person, index) in selected" :key="index" class="bg-slate-200 rounded-full px-2 py-0.5 text-xs">
                            {{ person.name }}
                        </li>
                    </ul>
                    <HeadlessComboboxInput class="w-full form-control bg-transparent focus:ring-0 absolute inset-0 z-30" />
                </div>
                <HeadlessComboboxButton class="absolute inset-y-0 right-0 flex items-center pr-2 z-50">
                    <Icon name="solar:alt-arrow-down-outline" class="h-5 w-5 text-gray-400" aria-hidden="true" />
                </HeadlessComboboxButton>
            </div>
            <TransitionExpand>
                <HeadlessComboboxOptions class="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-10">
                    <div v-if="filteredPeople.length === 0 && query !== ''" class="relative cursor-default select-none px-4 py-2 text-gray-700">Nothing found.</div>

                    <HeadlessComboboxOption v-for="person in filteredPeople" :key="person.id" v-slot="{ selected, active }" as="template" :value="person">
                        <li
                            class="relative cursor-default select-none py-2 pl-10 pr-4"
                            :class="{
                                'bg-teal-600 text-white': active,
                                'text-gray-900': !active,
                            }"
                        >
                            <span class="block truncate" :class="{ 'font-medium': selected, 'font-normal': !selected }">
                                {{ person.name }}
                            </span>
                            <span v-if="selected" class="absolute inset-y-0 left-0 flex items-center pl-3" :class="{ 'text-white': active, 'text-teal-600': !active }">
                                <Icon name="solar:check-circle-linear" class="h-5 w-5" aria-hidden="true" />
                            </span>
                        </li>
                    </HeadlessComboboxOption>
                </HeadlessComboboxOptions>
            </TransitionExpand>
        </div>
    </HeadlessCombobox>
</template>

<script setup>
const people = [
    { id: 1, name: 'Wade Cooper' },
    { id: 2, name: 'Arlene Mccoy' },
    { id: 3, name: 'Devon Webb' },
    { id: 4, name: 'Tom Cook' },
    { id: 5, name: 'Tanya Fox' },
    { id: 6, name: 'Hellen Schmidt' },
];
const selected = ref([people[0]]);
const query = ref('');

const filteredPeople = computed(() => (query.value === '' ? people : people.filter((person) => person.name.toLowerCase().replace(/\s+/g, '').includes(query.value.toLowerCase().replace(/\s+/g, '')))));
</script>
