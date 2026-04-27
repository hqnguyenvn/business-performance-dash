
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import RevenueSearch from "@/components/RevenueSearch";
import { Plus, Upload, Download, Trash2 } from "lucide-react";
import BulkDeleteByMonthDialog from "@/components/BulkDeleteByMonthDialog";
import { bulkDeleteSalaryCosts, getSalaryCosts, batchCreateSalaryCosts, type SalaryCostInsert } from "@/services/salaryCostService";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo } from "react";
import ExcelImportDialog, { type ImportResult, type ImportProgress } from "@/components/ExcelImportDialog";
import { exportExcel, type ImportError } from "@/utils/excelIO";
import { buildSalaryCostSchema } from "@/utils/salaryCostExcelSchema";
import type { MasterData } from "@/services/masterDataService";
import { monthShort, MONTHS } from "@/lib/months";
import { useSalaryCosts } from "@/hooks/useSalaryCosts";
import { SalaryCostsHeader } from "@/components/salary-costs/SalaryCostsHeader";
import { SalaryCostsToolbar } from "@/components/salary-costs/SalaryCostsToolbar";
import { SalaryCostsTable } from "@/components/salary-costs/SalaryCostsTable";
import { SalaryCostDialogs } from "@/components/salary-costs/SalaryCostDialogs";
import CloneSalaryCostDialog from "@/components/salary-costs/CloneSalaryCostDialog";
import PaginationControls from "@/components/PaginationControls";

const SalaryCosts = () => {
  const {
    salaryCosts,
    selectedYear,
    handleYearChange,
    selectedMonths,
    setSelectedMonths,
    handleMonthToggle,
    availableYears,
    filteredSalaryCosts,
    isLoading,
    companies,
    divisions,
    customers,
    addNewRow,
    updateSalaryCost,
    deleteCost,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    costToDelete,
    setCostToDelete,
    openDialog,
    saveChanges,
    isDialogOpen,
    setIsDialogOpen,
    dialogMode,
    selectedCost,
    setSelectedCost,
    getMonthName,
    getMasterDataName,
    insertRowBelow,
    cloneRow,
    exportToCSV,
    importFromCSV,
    cloneSalaryCosts,
    confirmDelete,
    currentPage,
    setCurrentPage,
    pageSize,
    handlePageSizeChange,
    totalRecords,
    totalPages,
  } = useSalaryCosts();

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const salaryCostSchema = useMemo(() => buildSalaryCostSchema({
    companies, divisions, customers,
  }), [companies, divisions, customers]);

  const [searchTerm, setSearchTerm] = useState("");

  const searchedSalaryCosts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return filteredSalaryCosts;
    return filteredSalaryCosts.filter((c) => {
      const monthName = getMonthName(c.month)?.toLowerCase() || "";
      const companyCode = companies.find((x) => x.id === c.company_id)?.code?.toLowerCase() || "";
      const divisionCode = divisions.find((x) => x.id === c.division_id)?.code?.toLowerCase() || "";
      const customerCode = customers.find((x) => x.id === c.customer_id)?.code?.toLowerCase() || "";
      return (
        (c.notes || "").toLowerCase().includes(term) ||
        monthName.includes(term) ||
        companyCode.includes(term) ||
        divisionCode.includes(term) ||
        customerCode.includes(term) ||
        String(c.amount ?? "").includes(term)
      );
    });
  }, [filteredSalaryCosts, searchTerm, companies, divisions, customers, getMonthName]);

  const handleExportExcel = async () => {
    try {
      const all = await getSalaryCosts({
        year: parseInt(selectedYear),
        months: selectedMonths,
        pageSize: "all",
      });
      const rows = all.data.map((c) => ({
        year: c.year,
        month: monthShort(c.month),
        customer_code: customers.find((x) => x.id === c.customer_id)?.code || "",
        company_code: companies.find((x) => x.id === c.company_id)?.code || "",
        division_code: divisions.find((x) => x.id === c.division_id)?.code || "",
        amount: c.amount,
        notes: c.notes || "",
      }));
      await exportExcel({ schema: salaryCostSchema, rows, fileName: `customer-cost-${selectedYear}.xlsx` });
      toast({ title: "Export thành công", description: `Đã xuất ${rows.length} dòng.` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Export thất bại", description: err?.message || "Lỗi" });
    }
  };

  const handleImportExcel = async (
    rows: Record<string, any>[],
    onProgress?: ImportProgress,
  ): Promise<ImportResult> => {
    const errors: ImportError[] = [];
    const valid: SalaryCostInsert[] = [];

    for (const row of rows) {
      const rowNumber: number = row.__rowNumber || 0;
      const errCols: string[] = [];
      const reasons: string[] = [];

      const year = Number(row.year);
      if (!Number.isFinite(year) || year < 2000 || year > 2100) { errCols.push("Year"); reasons.push(`Năm không hợp lệ: "${row.year ?? ""}"`); }

      const monthRaw = String(row.month || "").trim();
      let month = 0;
      if (/^\d+$/.test(monthRaw)) {
        month = Number(monthRaw);
      } else {
        const lower = monthRaw.toLowerCase();
        const found = MONTHS.find((m) => m.short.toLowerCase() === lower || m.label.toLowerCase() === lower);
        if (found) month = found.value;
      }
      if (month < 1 || month > 12) { errCols.push("Month"); reasons.push(`Tháng không hợp lệ: "${row.month ?? ""}"`); }

      const mapFK = (code: any, list: MasterData[], header: string, required = false): string | null => {
        const s = String(code || "").trim();
        if (!s) {
          if (required) { errCols.push(header); reasons.push(`${header} không được để trống`); }
          return null;
        }
        const found = list.find((m) => m.code.toLowerCase() === s.toLowerCase());
        if (!found) { errCols.push(header); reasons.push(`Không tìm thấy ${header}: "${s}"`); return null; }
        return found.id;
      };

      const customer_id = mapFK(row.customer_code, customers, "Customer");
      const company_id = mapFK(row.company_code, companies, "Company", true);
      const division_id = mapFK(row.division_code, divisions, "Division");

      const amount = Number(row.amount);
      if (!Number.isFinite(amount)) { errCols.push("Amount"); reasons.push("Amount phải là số"); }

      if (errCols.length > 0) {
        errors.push({ rowIndex: rowNumber, columns: errCols, reason: reasons.join("; ") });
        continue;
      }

      valid.push({
        year, month,
        customer_id: customer_id || null,
        company_id: company_id!,
        division_id: division_id || null,
        amount,
        notes: String(row.notes || ""),
      });
    }

    let created = 0;
    const total = valid.length;
    onProgress?.(0, total);
    const CHUNK = 200;
    for (let i = 0; i < valid.length; i += CHUNK) {
      const chunk = valid.slice(i, i + CHUNK);
      try {
        const result = await batchCreateSalaryCosts(chunk);
        created += result.length;
      } catch (err: any) {
        errors.push({ rowIndex: 0, columns: [], reason: `Lỗi batch: ${err.message || "Unknown"}` });
      }
      onProgress?.(Math.min(i + chunk.length, total), total);
    }

    queryClient.invalidateQueries({ queryKey: ["salaryCosts"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-primitives"] });
    return { created, updated: 0, errors };
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-24 w-full mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const effectivePageSize = typeof pageSize === 'number' ? pageSize : totalRecords;
  const startIndex = totalRecords > 0 ? (currentPage - 1) * effectivePageSize + 1 : 0;
  const endIndex = pageSize === 'all' ? totalRecords : Math.min(currentPage * effectivePageSize, totalRecords);

  return (
    <div className="min-h-screen bg-gray-50">
      <SalaryCostsHeader />

      <div className="p-6">
        <SalaryCostsToolbar
          selectedYear={selectedYear}
          handleYearChange={handleYearChange}
          availableYears={availableYears}
          selectedMonths={selectedMonths}
          handleMonthToggle={handleMonthToggle}
          setSelectedMonths={setSelectedMonths}
        />

        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
              <RevenueSearch searchTerm={searchTerm} onSearchTermChange={setSearchTerm} />
              <div className="flex items-center gap-2 flex-wrap">
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={totalRecords}
                  startIndex={startIndex}
                  endIndex={endIndex}
                  pageSize={pageSize}
                  onPageSizeChange={handlePageSizeChange}
                  position="top"
                />
                <Button variant="outline" onClick={() => setImportOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
                <Button variant="outline" onClick={handleExportExcel}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <CloneSalaryCostDialog onClone={cloneSalaryCosts} />
                <Button variant="destructive" onClick={() => setBulkDeleteOpen(true)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete by Month
                </Button>
                <Button onClick={addNewRow}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Row
                </Button>
              </div>
            </div>
            <SalaryCostsTable
              costs={searchedSalaryCosts}
              updateCost={updateSalaryCost}
              deleteCost={deleteCost}
              openDialog={openDialog}
              insertRowBelow={insertRowBelow}
              cloneRow={cloneRow}
              companies={companies}
              divisions={divisions}
              customers={customers}
            />
            
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={totalRecords}
              startIndex={startIndex}
              endIndex={endIndex}
              pageSize={pageSize}
              position="bottom"
            />
          </CardContent>
        </Card>
      </div>

      <ExcelImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Customer Cost"
        schema={salaryCostSchema}
        templateFileName="customer-cost-import-template.xlsx"
        errorFileName="customer-cost-import-errors.xlsx"
        onImport={handleImportExcel}
      />

      <BulkDeleteByMonthDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        defaultYear={Number(selectedYear) || new Date().getFullYear()}
        entityLabel="customer cost"
        onConfirm={async (year, months) => {
          try {
            const { deleted } = await bulkDeleteSalaryCosts(year, months);
            toast({ title: "Đã xoá", description: `Đã xoá ${deleted} dòng customer cost.` });
            queryClient.invalidateQueries({ queryKey: ["salaryCosts"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-primitives"] });
          } catch (err: any) {
            toast({ variant: "destructive", title: "Xoá thất bại", description: err?.message || "Lỗi" });
          }
        }}
      />

      <SalaryCostDialogs
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        dialogMode={dialogMode}
        selectedCost={selectedCost}
        setSelectedCost={setSelectedCost}
        saveChanges={saveChanges}
        isDeleteDialogOpen={isDeleteDialogOpen}
        setIsDeleteDialogOpen={setIsDeleteDialogOpen}
        confirmDelete={confirmDelete}
        setCostToDelete={setCostToDelete}
        companies={companies}
        divisions={divisions}
        customers={customers}
        getMonthName={getMonthName}
        getMasterDataName={getMasterDataName}
      />
    </div>
  );
};

export default SalaryCosts;
