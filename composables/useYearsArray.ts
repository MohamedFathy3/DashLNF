export const useYearArray = (numYears: number) => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: numYears }, (v, i) => ({
        id: currentYear - i,
        name: String(currentYear - i),
    }));
};
