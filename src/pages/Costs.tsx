
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { useCosts } from "@/hooks/useCosts";
import { CostsHeader } from "@/components/costs/CostsHeader";
import { CostsToolbar } from "@/components/costs/CostsToolbar";
import { CostsTable } from "@/components/costs/CostsTable";
import RevenueSearch from "@/components/RevenueSearch";
import { CostDialogs } from "@/components/costs/CostDialogs";
import { CostsImportStatus } from "@/components/costs/CostsImportStatus";
import PaginationControls from "@/components/PaginationControls";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Download, Trash2 } from "lucide-react";
import CloneCostDialog from "@/components/costs/CloneCostDialog";
import BulkDeleteByMonthDialog from "@/components/BulkDeleteByMonthDialog";
import { bulkDeleteCosts, getCosts, type NewCost, batchCreateCosts } from "@/services/costApi";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo } from "react";
import ExcelImportDialog, { type ImportResult, type ImportProgress } from "@/components/ExcelImportDialog";
import { exportExcel, type ImportError } from "@/utils/excelIO";
import { buildCostSchema } from "@/utils/costExcelSchema";
import type { MasterData } from "@/services/masterDataService";
import { monthShort, MONTHS } from "@/lib/months";

const Costs = () => {
  const {
    costs,
    selectedYear,
    selectedMonths,
    setSelectedMonths,
    isDialogOpen,
    setIsDialogOpen,
    selectedCost,
    setSelectedCost,
    dialogMode,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    costToDelete,
    setCostToDelete,
    isLoading,
    costTypes,
    availableYears,
    filteredCosts,
    currentPage,
    pageSize,
    totalCount,
    totalPages,
    handlePageChange,
    handlePageSizeChange,
    addNewRow,
    updateCost,
    openDialog,
    deleteCost,
    confirmDelete,
    saveChanges,
    cloneCosts,
    exportToCSV,
    importFromCSV,
    handleYearChange,
    handleMonthToggle,
    getMonthName,
    getMonthNumber,
    getCostTypeName,
    insertRowBelow,
    cloneRow,
  } = useCosts();

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const costSchema = useMemo(() => buildCostSchema({ costTypes }), [costTypes]);

  const [searchTerm, setSearchTerm] = useState("");

  const searchedCosts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return filteredCosts;
    return filteredCosts.filter((c) => {
      const monthName = getMonthName(c.month)?.toLowerCase() || "";
      const categoryCode = costTypes.find((ct) => ct.id === c.cost_type)?.code?.toLowerCase() || "";
      return (
        (c.description || "").toLowerCase().includes(term) ||
        (c.notes || "").toLowerCase().includes(term) ||
        monthName.includes(term) ||
        categoryCode.includes(term) ||
        String(c.cost ?? "").includes(term)
      );
    });
  }, [filteredCosts, searchTerm, costTypes, getMonthName]);

  const handleExportExcel = async () => {
    try {
      const all = await getCosts({
        year: parseInt(selectedYear),
        months: selectedMonths,
        pageSize: "all",
      });
      const rows = all.data.map((c) => ({
        year: c.year,
        month: monthShort(c.month),
        description: c.description || "",
        cost: c.cost,
        category_code: costTypes.find((ct) => ct.id === c.cost_type)?.code || "",
        is_cost: c.is_cost === false ? "FALSE" : "TRUE",
        is_checked: c.is_checked ? "TRUE" : "FALSE",
        notes: c.notes || "",
      }));
      await exportExcel({ schema: costSchema, rows, fileName: `cost-${selectedYear}.xlsx` });
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
    const valid: { rowNumber: number; data: NewCost }[] = [];

    rows.forEach((row) => {
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

      const categoryCodeRaw = String(row.category_code || "").trim();
      let cost_type = "";
      if (!categoryCodeRaw) {
        errCols.push("Category"); reasons.push("Category không được để trống");
      } else {
        const found = costTypes.find((m) => m.code.toLowerCase() === categoryCodeRaw.toLowerCase());
        if (!found) { errCols.push("Category"); reasons.push(`Không tìm thấy Category: "${categoryCodeRaw}"`); }
        else cost_type = found.id;
      }

      const cost = Number(row.cost);
      if (!Number.isFinite(cost)) { errCols.push("Cost"); reasons.push("Cost phải là số"); }

      if (errCols.length > 0) {
        errors.push({ rowIndex: rowNumber, columns: errCols, reason: reasons.join("; ") });
        return;
      }

      valid.push({
        rowNumber,
        data: {
          year, month,
          cost_type,
          company_id: null,
          division_id: null,
          project_id: null,
          resource_id: null,
          description: String(row.description || ""),
          price: null,
          volume: null,
          cost,
          is_cost: String(row.is_cost || "TRUE").toUpperCase() !== "FALSE",
          is_checked: String(row.is_checked || "FALSE").toUpperCase() === "TRUE",
          notes: String(row.notes || ""),
        },
      });
    });

    let created = 0;
    const total = valid.length;
    onProgress?.(0, total);
    const CHUNK = 200;
    for (let i = 0; i < valid.length; i += CHUNK) {
      const chunk = valid.slice(i, i + CHUNK);
      try {
        const result = await batchCreateCosts(chunk.map((x) => x.data));
        created += result.success;
        result.errors.forEach((e) => {
          const src = chunk[e.index];
          errors.push({ rowIndex: src?.rowNumber ?? 0, columns: [], reason: e.error });
        });
      } catch (err: any) {
        errors.push({ rowIndex: 0, columns: [], reason: `Lỗi batch: ${err.message || "Unknown"}` });
      }
      onProgress?.(Math.min(i + chunk.length, total), total);
    }

    queryClient.invalidateQueries({ queryKey: ["costs"] });
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

  const effectivePageSize = typeof pageSize === 'number' ? pageSize : totalCount;
  const startIndex = totalCount > 0 ? (currentPage - 1) * effectivePageSize + 1 : 0;
  const endIndex = pageSize === 'all' ? totalCount : Math.min(currentPage * effectivePageSize, totalCount);

  return (
    <div className="min-h-screen bg-gray-50">
      <CostsHeader />

      <div className="p-6">
        <CostsToolbar
          selectedYear={selectedYear}
          handleYearChange={handleYearChange}
          availableYears={availableYears}
          selectedMonths={selectedMonths}
          handleMonthToggle={handleMonthToggle}
          setSelectedMonths={setSelectedMonths}
        />

        <Card>
          <CardContent className="pt-4">
          <CostsImportStatus 
            isImporting={false}
          />
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
            <RevenueSearch searchTerm={searchTerm} onSearchTermChange={setSearchTerm} />
            <div className="flex items-center gap-2 flex-wrap">
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={totalCount}
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
              <CloneCostDialog onClone={cloneCosts} />
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
          <CostsTable
            costs={costs}
            filteredCosts={searchedCosts}
            costTypes={costTypes}
            updateCost={updateCost}
            openDialog={openDialog}
            deleteCost={deleteCost}
            addNewRow={addNewRow}
            insertRowBelow={insertRowBelow}
            cloneRow={cloneRow}
          />
          
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            pageSize={pageSize}
            totalItems={totalCount}
            startIndex={startIndex}
            endIndex={endIndex}
            position="bottom"
          />
          </CardContent>
        </Card>
      </div>

      <ExcelImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Cost"
        schema={costSchema}
        templateFileName="cost-import-template.xlsx"
        errorFileName="cost-import-errors.xlsx"
        onImport={handleImportExcel}
      />

      <BulkDeleteByMonthDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        defaultYear={Number(selectedYear) || new Date().getFullYear()}
        entityLabel="cost"
        onConfirm={async (year, months) => {
          try {
            const { deleted } = await bulkDeleteCosts(year, months);
            toast({ title: "Đã xoá", description: `Đã xoá ${deleted} dòng cost.` });
            queryClient.invalidateQueries({ queryKey: ["costs"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-primitives"] });
          } catch (err: any) {
            toast({ variant: "destructive", title: "Xoá thất bại", description: err?.message || "Lỗi" });
          }
        }}
      />

      <CostDialogs
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
        costTypes={costTypes}
        getMonthName={getMonthName}
        getCostTypeName={getCostTypeName}
      />
    </div>
  );
};

export default Costs;
