import type { ExcelSchema, LookupOption } from "./excelIO";
import type { MasterData } from "@/services/masterDataService";

export interface PlanMasterData {
  companies: MasterData[];
  currencies: MasterData[];
}

const toOptions = (list: MasterData[]): LookupOption[] =>
  list.map((m) => ({ code: m.code, name: m.name }));

export const buildPlanSchema = (md: PlanMasterData): ExcelSchema => ({
  sheetName: "Plan",
  lookups: {
    companies: toOptions(md.companies),
    currencies: toOptions(md.currencies),
  },
  columns: [
    { key: "year", header: "Year", type: "integer", required: true, width: 8 },
    { key: "month", header: "Month", type: "integer", required: true, width: 8 },
    { key: "company_code", header: "Company", lookup: "companies", required: true, width: 20 },
    { key: "bmm", header: "BMM", type: "number", required: true, width: 10 },
    { key: "revenue", header: "Revenue", type: "number", required: true, width: 18 },
    { key: "currency_code", header: "Currency", lookup: "currencies", width: 12 },
    { key: "notes", header: "Notes", width: 32 },
  ],
});
