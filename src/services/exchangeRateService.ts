
import { supabase } from "@/integrations/supabase/client";

export interface ExchangeRate {
  id: string;
  year: number;
  month: number;
  currency_id: string;
  exchange_rate: number;
}

export interface ExchangeRateDisplay {
  id: string;
  year: number;
  month: string;
  currencyID: string;
  exchangeRate: number;
}

export class ExchangeRateService {
  async getAll(): Promise<ExchangeRateDisplay[]> {
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('*, currencies:currency_id(code)')
      .order('year', { ascending: false })
      .order('month', { ascending: false });
    
    if (error) {
      console.error('Error fetching exchange rates:', error);
      throw error;
    }
    
    // Transform to display format
    return (data || []).map(rate => ({
      id: rate.id,
      year: rate.year,
      month: this.getMonthName(rate.month),
      currencyID: rate.currencies?.code || rate.currency_id,
      exchangeRate: rate.exchange_rate
    }));
  }

  async create(item: Omit<ExchangeRateDisplay, 'id'>): Promise<ExchangeRateDisplay> {
    // First, we need to get the currency_id from the currency code
    let currency_id = item.currencyID;
    
    // If the currencyID is a code, we need to find the corresponding ID
    if (item.currencyID && !item.currencyID.includes('-')) {
      const { data, error } = await supabase
        .from('currencies')
        .select('id')
        .eq('code', item.currencyID)
        .single();
      
      if (error) {
        console.error('Error finding currency by code:', error);
        throw error;
      }
      
      if (data) {
        currency_id = data.id;
      }
    }

    const dbItem = {
      year: item.year,
      month: this.getMonthNumber(item.month),
      currency_id: currency_id,
      exchange_rate: item.exchangeRate
    };

    const { data, error } = await supabase
      .from('exchange_rates')
      .insert(dbItem)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating exchange rate:', error);
      throw error;
    }
    
    return {
      id: data.id,
      year: data.year,
      month: this.getMonthName(data.month),
      currencyID: item.currencyID, // Use the original currencyID for consistency
      exchangeRate: data.exchange_rate
    };
  }

  async update(id: string, item: Partial<ExchangeRateDisplay>): Promise<ExchangeRateDisplay> {
    const dbItem: any = {};
    
    if (item.year !== undefined) dbItem.year = item.year;
    if (item.month !== undefined) dbItem.month = this.getMonthNumber(item.month);
    if (item.exchangeRate !== undefined) dbItem.exchange_rate = item.exchangeRate;
    
    // If currencyID is provided, find the corresponding ID
    if (item.currencyID !== undefined) {
      // First, check if it's a currency code
      if (!item.currencyID.includes('-')) {
        const { data, error } = await supabase
          .from('currencies')
          .select('id')
          .eq('code', item.currencyID)
          .single();
        
        if (error) {
          console.error('Error finding currency by code:', error);
          throw error;
        }
        
        if (data) {
          dbItem.currency_id = data.id;
        } else {
          dbItem.currency_id = item.currencyID;
        }
      } else {
        dbItem.currency_id = item.currencyID;
      }
    }

    const { data, error } = await supabase
      .from('exchange_rates')
      .update(dbItem)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating exchange rate:', error);
      throw error;
    }
    
    return {
      id: data.id,
      year: data.year,
      month: this.getMonthName(data.month),
      currencyID: item.currencyID || "", // Keep the original currencyID for UI consistency
      exchangeRate: data.exchange_rate
    };
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('exchange_rates')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting exchange rate:', error);
      throw error;
    }
  }

  private getMonthName(monthNumber: number): string {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                       "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return monthNames[monthNumber - 1] || "Jan";
  }

  private getMonthNumber(monthName: string): number {
    const monthMap: { [key: string]: number } = {
      'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4,
      'May': 5, 'Jun': 6, 'Jul': 7, 'Aug': 8,
      'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
    };
    return monthMap[monthName] || 1;
  }
}

export const exchangeRateService = new ExchangeRateService();
