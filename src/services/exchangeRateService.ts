import { api } from "@/lib/api";
import { currenciesService, type MasterData } from "@/services/masterDataService";

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

// Shape backend trả về (snake_case, join currencies.code)
interface ExchangeRateRow {
  id: string;
  year: number;
  month: number;
  currency_id: string;
  currency_code: string | null;
  exchange_rate: string | number;
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const MONTH_MAP: Record<string, number> = Object.fromEntries(
  MONTH_NAMES.map((n, i) => [n, i + 1]),
);

function monthName(n: number): string {
  return MONTH_NAMES[n - 1] || "Jan";
}
function monthNumber(name: string): number {
  return MONTH_MAP[name] || 1;
}

/**
 * Resolve currencyID (có thể là code "USD" hoặc uuid) → uuid.
 * Nếu đã là uuid (có dấu "-") thì trả nguyên.
 */
async function resolveCurrencyId(currencyID: string): Promise<string> {
  if (currencyID.includes("-")) return currencyID;
  const list = (await currenciesService.getAll()) as MasterData[];
  const match = list.find((c) => c.code === currencyID);
  if (!match) throw new Error(`Currency code not found: ${currencyID}`);
  return match.id;
}

export class ExchangeRateService {
  async getAll(): Promise<ExchangeRateDisplay[]> {
    const rows = await api.get<ExchangeRateRow[]>("/exchange-rates");
    return rows.map((r) => ({
      id: r.id,
      year: r.year,
      month: monthName(r.month),
      currencyID: r.currency_code || r.currency_id,
      exchangeRate: Number(r.exchange_rate),
    }));
  }

  async create(item: Omit<ExchangeRateDisplay, "id">): Promise<ExchangeRateDisplay> {
    const currency_id = await resolveCurrencyId(item.currencyID);
    const row = await api.post<ExchangeRateRow>("/exchange-rates", {
      year: item.year,
      month: monthNumber(item.month),
      currency_id,
      exchange_rate: item.exchangeRate,
    });
    return {
      id: row.id,
      year: row.year,
      month: monthName(row.month),
      currencyID: item.currencyID,
      exchangeRate: Number(row.exchange_rate),
    };
  }

  async update(
    id: string,
    item: Partial<ExchangeRateDisplay>,
  ): Promise<ExchangeRateDisplay> {
    const patch: Record<string, unknown> = {};
    if (item.year !== undefined) patch.year = item.year;
    if (item.month !== undefined) patch.month = monthNumber(item.month);
    if (item.exchangeRate !== undefined) patch.exchange_rate = item.exchangeRate;
    if (item.currencyID !== undefined) {
      patch.currency_id = await resolveCurrencyId(item.currencyID);
    }
    const row = await api.put<ExchangeRateRow>(`/exchange-rates/${id}`, patch);
    return {
      id: row.id,
      year: row.year,
      month: monthName(row.month),
      currencyID: item.currencyID || row.currency_code || row.currency_id,
      exchangeRate: Number(row.exchange_rate),
    };
  }

  async delete(id: string): Promise<void> {
    await api.delete<void>(`/exchange-rates/${id}`);
  }
}

export const exchangeRateService = new ExchangeRateService();
