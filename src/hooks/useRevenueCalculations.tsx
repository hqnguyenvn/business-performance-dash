
import { Revenue } from "@/services/revenueService";
import { MasterData } from "@/services/masterDataService";

export const useRevenueCalculations = (currencies: MasterData[], exchangeRates: any[]) => {
  const getMonthName = (monthNumber: number): string => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                       "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return monthNames[monthNumber - 1] || "Jan";
  };

  const getMonthNumber = (monthName: string): number => {
    const monthMap: { [key: string]: number } = {
      'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4,
      'May': 5, 'Jun': 6, 'Jul': 7, 'Aug': 8,
      'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
    };
    return monthMap[monthName] || 1;
  };

  const calculateVNDRevenue = (revenue: Revenue) => {
    if (!revenue.original_amount || !revenue.currency_id) return 0;
    
    // Find the currency code first
    const currency = currencies.find(c => c.id === revenue.currency_id);
    if (!currency) return 0;
    
    // Find the exchange rate for the specific year and month
    const exchangeRate = exchangeRates.find(rate => 
      rate.year === revenue.year && 
      rate.month === getMonthName(revenue.month) &&
      rate.currencyID === currency.code
    );
    
    if (exchangeRate) {
      return revenue.original_amount * exchangeRate.exchangeRate;
    }
    
    return 0;
  };

  return {
    getMonthName,
    getMonthNumber,
    calculateVNDRevenue,
  };
};
