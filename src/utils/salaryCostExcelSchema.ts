import type { ExcelSchema, LookupOption } from "./excelIO";
import type { MasterData } from "@/services/masterDataService";
import { MONTH_SHORTS } from "@/lib/months";

export interface SalaryCostMasterData {
  companies: MasterData[];
  divisions: MasterData[];
  customers: MasterData[];
}

const toOptions = (list: MasterData[]): LookupOption[] =>
  list.map((m) => ({ code: m.code, name: m.name }));

export const buildSalaryCostSchema = (md: SalaryCostMasterData): ExcelSchema => ({
  sheetName: "Customer Cost",
  lookups: {
    companies: toOptions(md.companies),
    divisions: toOptions(md.divisions),
    customers: toOptions(md.customers),
    months: MONTH_SHORTS.map((m) => ({ code: m })),
  },
  columns: [
    { key: "year", header: "Year", type: "integer", required: true, width: 8 },
    { key: "month", header: "Month", lookup: "months", required: true, width: 10 },
    { key: "customer_code", header: "Customer", lookup: "customers", width: 28 },
    { key: "company_code", header: "Company", lookup: "companies", required: true, width: 20 },
    { key: "division_code", header: "Division", lookup: "divisions", width: 14 },
    { key: "amount", header: "Amount", type: "number", required: true, width: 16 },
    { key: "notes", header: "Notes", width: 32 },
  ],
});
