import type { ExcelSchema, LookupOption } from "./excelIO";
import type { MasterData } from "@/services/masterDataService";

export interface RevenueMasterData {
  customers: MasterData[];
  companies: MasterData[];
  divisions: MasterData[];
  projects: MasterData[];
  projectTypes: MasterData[];
  resources: MasterData[];
  currencies: MasterData[];
}

const toOptions = (list: MasterData[]): LookupOption[] =>
  list.map((m) => ({ code: m.code, name: m.name }));

/**
 * Schema dùng cho IMPORT + template download.
 * Bỏ 3 trường suy ra được:
 *   - customer_code   ← projects.customer_id (auto từ Project chọn)
 *   - project_name    ← projects.name        (auto từ Project chọn)
 *   - original_amount ← unit_price × bmm     (auto tính)
 * Project trở thành required.
 */
export const buildRevenueImportSchema = (md: RevenueMasterData): ExcelSchema => ({
  sheetName: "Revenue",
  lookups: {
    companies: toOptions(md.companies),
    divisions: toOptions(md.divisions),
    projects: toOptions(md.projects),
    projectTypes: toOptions(md.projectTypes),
    resources: toOptions(md.resources),
    currencies: toOptions(md.currencies),
  },
  columns: [
    { key: "year", header: "Year", type: "integer", required: true, width: 8 },
    { key: "month", header: "Month", type: "integer", required: true, width: 8 },
    { key: "company_code", header: "Company", lookup: "companies", width: 20 },
    { key: "division_code", header: "Division", lookup: "divisions", width: 14 },
    { key: "project_code", header: "Project", lookup: "projects", required: true, width: 28 },
    { key: "project_type_code", header: "Project Type", lookup: "projectTypes", width: 18 },
    { key: "resource_code", header: "Resource", lookup: "resources", width: 18 },
    { key: "currency_code", header: "Currency", lookup: "currencies", width: 12 },
    { key: "unit_price", header: "Unit Price", type: "number", required: true, width: 14 },
    { key: "bmm", header: "BMM", type: "number", required: true, width: 10 },
    { key: "notes", header: "Notes", width: 32 },
  ],
});

/**
 * Schema dùng cho EXPORT đầy đủ — giữ tất cả cột để xem dễ. Nếu user
 * muốn import lại file này thì cần xoá 3 cột (customer_code, project_name,
 * original_amount) hoặc sửa lại theo template import.
 */
export const buildRevenueExportSchema = (md: RevenueMasterData): ExcelSchema => ({
  sheetName: "Revenue",
  lookups: {
    customers: toOptions(md.customers),
    companies: toOptions(md.companies),
    divisions: toOptions(md.divisions),
    projects: toOptions(md.projects),
    projectTypes: toOptions(md.projectTypes),
    resources: toOptions(md.resources),
    currencies: toOptions(md.currencies),
  },
  columns: [
    { key: "year", header: "Year", type: "integer", required: true, width: 8 },
    { key: "month", header: "Month", type: "integer", required: true, width: 8 },
    { key: "customer_code", header: "Customer", lookup: "customers", width: 28 },
    { key: "company_code", header: "Company", lookup: "companies", width: 20 },
    { key: "division_code", header: "Division", lookup: "divisions", width: 14 },
    { key: "project_code", header: "Project", lookup: "projects", width: 28 },
    { key: "project_name", header: "Project Name", width: 28 },
    { key: "project_type_code", header: "Project Type", lookup: "projectTypes", width: 18 },
    { key: "resource_code", header: "Resource", lookup: "resources", width: 18 },
    { key: "currency_code", header: "Currency", lookup: "currencies", width: 12 },
    { key: "unit_price", header: "Unit Price", type: "number", width: 14 },
    { key: "bmm", header: "BMM", type: "number", width: 10 },
    { key: "original_amount", header: "Original Amount", type: "number", width: 18 },
    { key: "notes", header: "Notes", width: 32 },
  ],
});

/** Backwards-compat alias — old callers used buildRevenueSchema. */
export const buildRevenueSchema = buildRevenueExportSchema;
