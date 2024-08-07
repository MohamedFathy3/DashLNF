export const useResourceStore = defineStore('resource', () => {
    const countries = ref<Country[]>();
    const cities = ref<City[]>();

    const setCountries = (data?: Country[]) => {
        countries.value = data;
    };
    const setCities = (data?: City[]) => {
        cities.value = data;
    };
    const fetchResources = async () => {
        const { data: res, error } = await useApiFetch(`/api/fetch-resources`, {
            lazy: true,
            transform: (res) => (res as ApiResponse).data as any,
        });
        if (res.value) {
            setCountries((res.value as any).countries as Country[]);
            setCities((res.value as any).cities as City[]);
        }
        if (error && error.value) {
            setCountries();
            setCities();
            console.error(error);
        }
    };

    return {
        countries,
        cities,
        setCountries,
        setCities,
        fetchResources,
    };
});
