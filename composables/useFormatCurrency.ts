export const useFormatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US').format(amount);
};
