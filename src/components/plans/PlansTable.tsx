import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHeader,
  TableRow,
  TableHead,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Plus, Upload, Trash2 } from "lucide-react";
import { usePlanData } from "@/hooks/usePlanData";
import { PlansTableRow } from "./PlansTableRow";
import { AnnualPlan } from "@/types/plan";
import { MONTH_LABELS } from "@/types/employee";
import { exportExcel, type ImportError } from "@/utils/excelIO";
import { buildPlanSchema } from "@/utils/planExcelSchema";
import ExcelImportDialog, {
  type ImportResult,
  type ImportProgress,
} from "@/components/ExcelImportDialog";
import {
  bulkDeletePlans,
  bulkUpsertPlans,
} from "@/services/planService";
import RevenueFilters from "@/components/RevenueFilters";
import RevenueSearch from "@/components/RevenueSearch";
import PaginationControls from "@/components/PaginationControls";
import BulkDeleteByMonthDialog from "@/components/BulkDeleteByMonthDialog";
import CloneDataDialog from "@/components/CloneDataDialog";
import { useToast } from "@/hooks/use-toast";

function getDefaultMonths(): number[] {
  // Plans cover the whole year (BMM/revenue planned for all 12 months),
  // so default to all months — unlike Revenue which defaults to past months only.
  return Array.from({ length: 12 }, (_, i) => i + 1);
}

export function PlansTable() {
  const {
    plans,
    companies,
    currencies,
    loading,
    handleCellEdit,
    addNewItem,
    addRowBelow,
    deleteItem,
    cloneData,
    reload,
  } = usePlanData();

  const { toast } = useToast();
  const [importOpen, setImportOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonths, setSelectedMonths] = useState<number[]>(
    getDefaultMonths(),
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | "all">(25);

  const filteredPlans = useMemo(() => {
    return plans
      .filter((p) => {
        if (p.year !== selectedYear) return false;
        if (selectedMonths.length > 0 && !selectedMonths.includes(p.month))
          return false;
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          const companyCode =
            companies.find((c) => c.id === p.company_id)?.code || "";
          const currencyCode =
            currencies.find((c) => c.id === p.currency_id)?.code || "";
          const searchable = [
            String(p.year),
            String(p.month),
            companyCode,
            currencyCode,
            p.notes || "",
          ]
            .join(" ")
            .toLowerCase();
          if (!searchable.includes(term)) return false;
        }
        return true;
      })
      .sort(
        (a, b) =>
          b.year - a.year ||
          b.month - a.month ||
          (companies.find((c) => c.id === a.company_id)?.code || "").localeCompare(
            companies.find((c) => c.id === b.company_id)?.code || "",
          ),
      );
  }, [plans, selectedYear, selectedMonths, searchTerm, companies, currencies]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedYear, selectedMonths, searchTerm]);

  const totalItems = filteredPlans.length;
  const totalPages =
    pageSize === "all" ? 1 : Math.ceil(totalItems / pageSize);
  const paginatedPlans = useMemo(() => {
    if (pageSize === "all") return filteredPlans;
    const start = (currentPage - 1) * pageSize;
    return filteredPlans.slice(start, start + pageSize);
  }, [filteredPlans, currentPage, pageSize]);
  const startIndex =
    pageSize === "all" ? 1 : (currentPage - 1) * (pageSize as number) + 1;
  const endIndex =
    pageSize === "all"
      ? totalItems
      : Math.min(currentPage * (pageSize as number), totalItems);

  const schema = useMemo(
    () => buildPlanSchema({ companies, currencies }),
    [companies, currencies],
  );

  const handleExport = async () => {
    try {
      const rows = filteredPlans.map((p) => ({
        year: p.year,
        month: p.month,
        company_code: companies.find((c) => c.id === p.company_id)?.code || "",
        bmm: Number(p.bmm) || 0,
        revenue: Number(p.revenue) || 0,
        currency_code:
          currencies.find((c) => c.id === p.currency_id)?.code || "",
        notes: p.notes || "",
      }));
      await exportExcel({
        schema,
        rows,
        fileName: `plans-${selectedYear}.xlsx`,
      });
      toast({
        title: "Export thành công",
        description: `Đã xuất ${rows.length} dòng.`,
      });
    } catch (err: any) {
      toast({
        title: "Export thất bại",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleImport = useCallback(
    async (
      rows: Record<string, any>[],
      onProgress?: ImportProgress,
    ): Promise<ImportResult> => {
      const errors: ImportError[] = [];

      const existingByKey = new Map<string, AnnualPlan>();
      for (const p of plans) {
        if (!p.id.startsWith("tmp-")) {
          existingByKey.set(`${p.year}|${p.month}|${p.company_id}`, p);
        }
      }

      type Validated = {
        rowNumber: number;
        year: number;
        monthLabel: string;
        companyCode: string;
        payload: Partial<AnnualPlan> & {
          year: number;
          month: number;
          company_id: string;
          bmm: number;
          revenue: number;
        };
      };
      const validated: Validated[] = [];

      for (const row of rows) {
        const rowNumber: number = row.__rowNumber || 0;
        const errCols: string[] = [];
        const reasons: string[] = [];

        const year = Number(row.year);
        if (!Number.isFinite(year) || year < 2000 || year > 2100) {
          errCols.push("Year");
          reasons.push(`Năm không hợp lệ: "${row.year ?? ""}"`);
        }

        const monthRaw = String(row.month ?? "").trim();
        let month = 0;
        if (/^\d+$/.test(monthRaw)) {
          month = Number(monthRaw);
        } else {
          const upper = monthRaw.toUpperCase();
          const idx = MONTH_LABELS.findIndex((m) => m === upper);
          if (idx >= 0) month = idx + 1;
        }
        if (month < 1 || month > 12) {
          errCols.push("Month");
          reasons.push(`Tháng không hợp lệ: "${row.month ?? ""}"`);
        }

        const companyCode = String(row.company_code || "").trim();
        const company = companyCode
          ? companies.find(
              (c) => c.code.toLowerCase() === companyCode.toLowerCase(),
            )
          : null;
        if (!companyCode) {
          errCols.push("Company");
          reasons.push("Company bắt buộc");
        } else if (!company) {
          errCols.push("Company");
          reasons.push(`Không tìm thấy Company: "${companyCode}"`);
        }

        const bmmRaw = row.bmm;
        const bmm =
          bmmRaw != null && bmmRaw !== "" ? Number(bmmRaw) : 0;
        if (bmmRaw != null && bmmRaw !== "" && !Number.isFinite(bmm)) {
          errCols.push("BMM");
          reasons.push("BMM phải là số");
        }

        const revRaw = row.revenue;
        const revenue =
          revRaw != null && revRaw !== "" ? Number(revRaw) : 0;
        if (revRaw != null && revRaw !== "" && !Number.isFinite(revenue)) {
          errCols.push("Revenue");
          reasons.push("Revenue phải là số");
        }

        const currencyCode = String(row.currency_code || "").trim();
        const currency = currencyCode
          ? currencies.find(
              (c) => c.code.toLowerCase() === currencyCode.toLowerCase(),
            )
          : null;
        if (currencyCode && !currency) {
          errCols.push("Currency");
          reasons.push(`Không tìm thấy Currency: "${currencyCode}"`);
        }

        if (errCols.length > 0) {
          errors.push({
            rowIndex: rowNumber,
            columns: errCols,
            reason: reasons.join("; "),
          });
          continue;
        }

        const key = `${year}|${month}|${company!.id}`;
        const existing = existingByKey.get(key);
        const payload: Validated["payload"] & { id?: string } = {
          year,
          month,
          company_id: company!.id,
          bmm,
          revenue,
          currency_id: currency?.id || null,
          notes: row.notes ? String(row.notes) : "",
        };
        if (existing) (payload as any).id = existing.id;

        validated.push({
          rowNumber,
          year,
          monthLabel: MONTH_LABELS[month - 1],
          companyCode,
          payload,
        });
      }

      let created = 0;
      let updated = 0;
      const total = validated.length;
      onProgress?.(0, total);

      const CHUNK = 200;
      for (let i = 0; i < validated.length; i += CHUNK) {
        const chunk = validated.slice(i, i + CHUNK);
        try {
          const res = await bulkUpsertPlans(chunk.map((v) => v.payload as any));
          created += res.created;
          updated += res.updated;
          for (const err of res.errors) {
            const v = chunk[err.index];
            errors.push({
              rowIndex: v?.rowNumber ?? 0,
              columns: [],
              reason: v
                ? `${v.year}/${v.monthLabel}/${v.companyCode}: ${err.error}`
                : err.error,
            });
          }
        } catch (err: any) {
          for (const v of chunk) {
            errors.push({
              rowIndex: v.rowNumber,
              columns: [],
              reason: `${v.year}/${v.monthLabel}/${v.companyCode}: ${err.message || "Lỗi"}`,
            });
          }
        }
        onProgress?.(Math.min(i + chunk.length, total), total);
      }

      reload();
      return { created, updated, errors };
    },
    [plans, companies, currencies, reload],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="ml-3 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <RevenueFilters
        selectedYear={selectedYear}
        selectedMonths={selectedMonths}
        onYearChange={setSelectedYear}
        onMonthChange={setSelectedMonths}
      />

      <Card className="bg-card">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-4 flex-wrap">
              <RevenueSearch
                searchTerm={searchTerm}
                onSearchTermChange={setSearchTerm}
              />
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={totalItems}
                startIndex={startIndex}
                endIndex={endIndex}
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
                position="top"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <CloneDataDialog onClone={cloneData} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setImportOpen(true)}
                className="flex items-center gap-1"
              >
                <Upload className="h-4 w-4" />
                Import
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setBulkDeleteOpen(true)}
                className="flex items-center gap-1"
              >
                <Trash2 className="h-4 w-4" />
                Delete by Month
              </Button>
              <Button
                onClick={() =>
                  addNewItem(
                    selectedYear,
                    selectedMonths.length > 0 ? selectedMonths[0] : undefined,
                  )
                }
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Plan
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto mt-4">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="border border-border w-12 text-center">
                    No.
                  </TableHead>
                  <TableHead className="border border-border">Year</TableHead>
                  <TableHead className="border border-border">Month</TableHead>
                  <TableHead className="border border-border">
                    Company
                  </TableHead>
                  <TableHead className="border border-border">BMM</TableHead>
                  <TableHead className="border border-border">
                    Revenue
                  </TableHead>
                  <TableHead className="border border-border">
                    Currency
                  </TableHead>
                  <TableHead className="border border-border">Notes</TableHead>
                  <TableHead className="border border-border text-center">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPlans.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="p-4 text-center text-muted-foreground"
                    >
                      No plans found.
                    </td>
                  </tr>
                ) : (
                  paginatedPlans.map((plan, idx) => (
                    <PlansTableRow
                      key={plan.id}
                      item={plan}
                      index={startIndex - 1 + idx}
                      companies={companies}
                      currencies={currencies}
                      handleCellEdit={handleCellEdit}
                      deleteItem={deleteItem}
                      addRowBelow={addRowBelow}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalItems}
            startIndex={startIndex}
            endIndex={endIndex}
            pageSize={pageSize}
            position="bottom"
          />
        </CardContent>

        <BulkDeleteByMonthDialog
          open={bulkDeleteOpen}
          onOpenChange={setBulkDeleteOpen}
          defaultYear={selectedYear}
          entityLabel="plan"
          onConfirm={async (year, months) => {
            try {
              const { deleted } = await bulkDeletePlans(year, months);
              toast({
                title: "Đã xoá",
                description: `Đã xoá ${deleted} dòng plan.`,
              });
              reload();
            } catch (err: any) {
              toast({
                variant: "destructive",
                title: "Xoá thất bại",
                description: err?.message || "Lỗi",
              });
            }
          }}
        />

        <ExcelImportDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          title="Plans"
          schema={schema}
          templateFileName="plans-template.xlsx"
          errorFileName="plans-errors.xlsx"
          onImport={handleImport}
        />
      </Card>
    </div>
  );
}
