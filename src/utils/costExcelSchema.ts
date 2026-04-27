import type { ExcelSchema, LookupOption } from "./excelIO";
import type { MasterData } from "@/services/masterDataService";
import { MONTH_SHORTS } from "@/lib/months";

export interface CostMasterData {
  costTypes: MasterData[];
}

const toOptions = (list: MasterData[]): LookupOption[] =>
  list.map((m) => ({ code: m.code, name: m.name }));

export const buildCostSchema = (md: CostMasterData): ExcelSchema => ({
  sheetName: "Cost",
  lookups: {
    costTypes: toOptions(md.costTypes),
    months: MONTH_SHORTS.map((m) => ({ code: m })),
    boolean: [{ code: "TRUE" }, { code: "FALSE" }],
  },
  columns: [
    { key: "year", header: "Year", type: "integer", required: true, width: 8 },
    { key: "month", header: "Month", lookup: "months", required: true, width: 10 },
    { key: "description", header: "Description", width: 40 },
    { key: "cost", header: "Cost", type: "number", required: true, width: 16 },
    { key: "category_code", header: "Category", lookup: "costTypes", required: true, width: 18 },
    { key: "is_cost", header: "Is Cost", lookup: "boolean", width: 10 },
    { key: "is_checked", header: "Checked", lookup: "boolean", width: 10 },
    { key: "notes", header: "Notes", width: 32 },
  ],
});
