import React, { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import RevenueFilters from "@/components/RevenueFilters";
import RevenueTable from "@/components/RevenueTable";
import { Skeleton } from "@/components/ui/skeleton";
import RevenueSearch from "@/components/RevenueSearch";
import RevenueActions from "@/components/RevenueActions";
import RevenueDialog from "@/components/RevenueDialog";
import PaginationControls from "@/components/PaginationControls";
import { useToast } from "@/hooks/use-toast";
import { useRevenueData } from "@/hooks/useRevenueData";
import { useRevenueCalculations } from "@/hooks/useRevenueCalculations";
import { useRevenueDialog } from "@/hooks/useRevenueDialog";
import { useRevenueUpdate } from "@/hooks/useRevenueUpdate";
import { useRevenueCreation } from "@/hooks/useRevenueCreation";
import { getRevenues, batchCreateRevenues, createRevenue, bulkDeleteRevenues } from "@/services/revenueApi";
import { Revenue } from "@/types/revenue";
import { MasterData } from "@/services/masterDataService";
import { useClientRevenueFilter } from "@/hooks/useClientRevenueFilter";
import { useRevenueInlineEntry } from "@/hooks/useRevenueInlineEntry";
import { useQueryClient } from "@tanstack/react-query";
import { exportExcel, normalizeLookupKey, type ImportError } from "@/utils/excelIO";
import {
  buildRevenueImportSchema,
  buildRevenueExportSchema,
} from "@/utils/revenueExcelSchema";
import type { ImportResult, ImportProgress } from "@/components/ExcelImportDialog";

const Revenues = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const {
    revenues,
    setRevenues,
    customers,
    companies,
    divisions,
    projects,
    projectTypes,
    resources,
    currencies,
    exchangeRates,
    searchParams,
    setSearchParams,
    total,
    loading,
    fetching,
    fetchData,
    handleSaveRevenue,
    handleDeleteRevenue,
  } = useRevenueData();

  const revenueCalculations = useRevenueCalculations(currencies, exchangeRates);
  const { getMonthName, getMonthNumber, calculateVNDRevenue } = revenueCalculations;

  const {
    revenueInDialog,
    isDialogOpen,
    dialogMode,
    handleOpenDialog,
    setIsDialogOpen,
  } = useRevenueDialog();

  const { handleCellEdit: handleCellEditDb } = useRevenueUpdate(
    { revenues, setRevenues, fetchData },
    { calculateVNDRevenue }
  );

  const { 
    handleInsertRowBelow, 
    handleCloneRevenue: originalHandleCloneRevenue 
  } = useRevenueCreation(
    { revenues, setRevenues, fetchData },
    { calculateVNDRevenue }
  );
  
  const inlineEntryUtils = useRevenueInlineEntry(fetchData, calculateVNDRevenue);
  const {
    editingCell,
    setEditingCell,
    tempRow,
    // Removed handleEditTempRow from destructuring as it's internal to the hook
    handleAddNewRowInline,
    handleCommitTempRow,
    handleCellEdit // This is the combined one from inlineEntryUtils
  } = inlineEntryUtils;

  const [searchTerm, setSearchTerm] = useState("");

  const filteredRevenues = useClientRevenueFilter({
    revenues,
    searchTerm,
    customers,
    companies,
    divisions,
    projects,
    projectTypes,
    resources,
    currencies
  });

  const currentPage = useMemo(() => searchParams.page || 1, [searchParams.page]);
  const itemsPerPage = useMemo(() => {
    if (searchParams.pageSize === 'all') {
      return total || 1;
    }
    return (typeof searchParams.pageSize === 'number' ? searchParams.pageSize : 25);
  }, [searchParams.pageSize, total]);
  const totalPages = useMemo(() => {
    if (searchParams.pageSize === 'all') return 1;
    if (total === 0) return 1;
    return Math.ceil(total / itemsPerPage);
  }, [total, itemsPerPage, searchParams.pageSize]);
  const startIndex = useMemo(() => {
    if (searchParams.pageSize === 'all') return total > 0 ? 1 : 0;
    return (currentPage - 1) * itemsPerPage + (total > 0 ? 1 : 0);
  }, [currentPage, itemsPerPage, searchParams.pageSize, total]);
  const endIndex = useMemo(() => {
    if (searchParams.pageSize === 'all') return total;
    return Math.min(currentPage * itemsPerPage, total);
  }, [currentPage, itemsPerPage, total, searchParams.pageSize]);

  const handleYearChange = (year: number) => {
    setSearchParams((prev) => ({ ...prev, year, page: 1 }));
  };
  const handleMonthChange = (months: number[]) => {
    setSearchParams((prev) => ({ ...prev, months, page: 1 }));
  };
  const handlePageChange = (page: number) => {
    const effectivePageSize = itemsPerPage > 0 ? itemsPerPage : 1;
    const calculatedTotalPages = Math.ceil(total / effectivePageSize);
    let newPage = page;
    if (page < 1) {
      newPage = 1;
    } else if (page > calculatedTotalPages && calculatedTotalPages > 0) {
      newPage = calculatedTotalPages;
    } else if (calculatedTotalPages === 0 && page > 1) {
      newPage = 1;
    }
    if (searchParams.page !== newPage) {
      setSearchParams((prev) => ({ ...prev, page: newPage }));
    }
  };
  const handlePageSizeChange = (newPageSize: number | 'all') => {
    setSearchParams((prev) => ({
      ...prev,
      pageSize: newPageSize,
      page: 1
    }));
  };

  const handleCombinedCellEdit = (id: string, field: keyof Revenue, value: any) => {
    // The handleCellEdit from inlineEntryUtils is already designed to call handleCellEditDb internally.
    handleCellEdit(id, field, value, handleCellEditDb as any);
  };

  const codeOf = (arr: MasterData[], id: string | undefined | null): string => {
    if (!id) return "";
    return arr.find((m) => m.id === id)?.code || "";
  };

  const handleExportExcel = async () => {
    try {
      const allData = await getRevenues({
        year: searchParams.year,
        months: searchParams.months,
        pageSize: 'all',
      });
      const schema = buildRevenueExportSchema({
        customers, companies, divisions, projects, projectTypes, resources, currencies,
      });
      const rows = allData.data.map((r) => ({
        year: r.year,
        month: r.month,
        customer_code: codeOf(customers, r.customer_id),
        company_code: codeOf(companies, r.company_id),
        division_code: codeOf(divisions, r.division_id),
        project_code: codeOf(projects, r.project_id),
        project_name: r.project_name || "",
        project_type_code: codeOf(projectTypes, r.project_type_id),
        resource_code: codeOf(resources, r.resource_id),
        currency_code: codeOf(currencies, r.currency_id),
        unit_price: r.unit_price ?? "",
        bmm: r.quantity ?? "",
        original_amount: r.original_amount,
        notes: r.notes || "",
      }));
      const fileName = `revenue-${searchParams.year ?? "all"}.xlsx`;
      await exportExcel({ schema, rows, fileName });
      toast({ title: "Export thành công", description: `Đã xuất ${rows.length} dòng ra ${fileName}` });
    } catch (error: any) {
      console.error("Error exporting Excel:", error);
      toast({ variant: "destructive", title: "Export thất bại", description: error?.message || "Có lỗi xảy ra." });
    }
  };

  const monthNameToNumber = (name: string | undefined | null): number | null => {
    if (!name) return null;
    const full: Record<string, number> = {
      jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
      apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7,
      aug: 8, august: 8, sep: 9, sept: 9, september: 9,
      oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
    };
    const key = String(name).trim().toLowerCase();
    return full[key] ?? null;
  };
  
  const parseNum = (v: any): number => {
    if (typeof v === "number") return v;
    if (v === null || v === undefined || v === "") return NaN;
    return Number(String(v).replace(/,/g, ""));
  };

  const handleImportExcel = async (
    rows: Record<string, any>[],
    onProgress?: ImportProgress,
  ): Promise<ImportResult> => {
    const errors: ImportError[] = [];
    const validRevenues: { index: number; rowNumber: number; data: Omit<Revenue, "id"> }[] = [];

    rows.forEach((row, idx) => {
      const rowNumber: number = row.__rowNumber || idx + 2;
      const errCols: string[] = [];
      const reasons: string[] = [];

      const year = parseNum(row.year);
      if (!Number.isFinite(year) || year < 2000 || year > 2100) {
        errCols.push("Year");
        reasons.push(`Năm không hợp lệ: "${row.year ?? ""}"`);
      }

      let monthValue: number | null = null;
      if (row.month != null && row.month !== "") {
        if (typeof row.month === "string" && isNaN(Number(row.month))) {
          monthValue = monthNameToNumber(row.month);
        } else {
          monthValue = Number(row.month);
        }
      }
      if (!monthValue || monthValue < 1 || monthValue > 12) {
        errCols.push("Month");
        reasons.push(`Tháng không hợp lệ: "${row.month ?? ""}" (nhập 1–12)`);
      }

      const mapFK = (code: any, list: MasterData[], header: string): string | null => {
        if (!code) return null;
        // Whitespace-insensitive lookup: NBSP / em-space / tab from Excel
        // copy-paste won't break the match.
        const key = normalizeLookupKey(String(code));
        const found = list.find((m) => normalizeLookupKey(m.code) === key);
        if (!found) {
          errCols.push(header);
          reasons.push(`Không tìm thấy mã ${header}: "${code}" — dùng dropdown từ file mẫu`);
          return null;
        }
        return found.id;
      };

      // Project bắt buộc — customer_id và project_name suy ra từ đây.
      const projectCodeRaw = row.project_code;
      let project_id: string | undefined = undefined;
      let project: MasterData | undefined = undefined;
      if (!projectCodeRaw) {
        errCols.push("Project");
        reasons.push("Project bắt buộc");
      } else {
        const id = mapFK(projectCodeRaw, projects, "Project");
        if (id) {
          project_id = id;
          project = projects.find((p) => p.id === id);
        }
      }

      const company_id = mapFK(row.company_code, companies, "Company") || undefined;
      const division_id = mapFK(row.division_code, divisions, "Division") || undefined;
      const project_type_id = mapFK(row.project_type_code, projectTypes, "Project Type") || undefined;
      const resource_id = mapFK(row.resource_code, resources, "Resource") || undefined;
      const currency_id = mapFK(row.currency_code, currencies, "Currency") || undefined;

      // Unit Price + BMM bắt buộc — original_amount = unit_price × bmm.
      const unit_price = parseNum(row.unit_price);
      if (!Number.isFinite(unit_price)) {
        errCols.push("Unit Price");
        reasons.push("Unit Price bắt buộc và phải là số");
      }
      const quantity = parseNum(row.bmm);
      if (!Number.isFinite(quantity)) {
        errCols.push("BMM");
        reasons.push("BMM bắt buộc và phải là số");
      }

      if (errCols.length > 0) {
        errors.push({ rowIndex: rowNumber, columns: errCols, reason: reasons.join("; ") });
        return;
      }

      const original_amount = unit_price * quantity;
      // customer_id và project_name auto từ master Project
      const customer_id = (project as any)?.customer_id || undefined;
      const project_name = project?.name || project?.code || "";

      const partial: Partial<Revenue> = {
        year: Number(year),
        month: monthValue!,
        customer_id, company_id, division_id, project_id,
        project_type_id, resource_id, currency_id,
        project_name,
        unit_price: Number.isFinite(unit_price as number) ? (unit_price as number) : undefined,
        quantity: Number.isFinite(quantity as number) ? (quantity as number) : undefined,
        original_amount,
        notes: row.notes ? String(row.notes) : undefined,
      };
      const vnd_revenue = calculateVNDRevenue(partial);

      validRevenues.push({
        index: idx,
        rowNumber,
        data: {
          ...partial,
          year: partial.year!,
          month: partial.month!,
          original_amount: partial.original_amount!,
          project_name: partial.project_name || "",
          vnd_revenue,
        },
      });
    });

    let created = 0;
    const total = validRevenues.length;
    onProgress?.(0, total);
    const CHUNK = 200;
    for (let i = 0; i < validRevenues.length; i += CHUNK) {
      const chunk = validRevenues.slice(i, i + CHUNK);
      try {
        const result = await batchCreateRevenues(chunk.map((v) => v.data));
        created += result.success;
        result.errors.forEach((e) => {
          const src = chunk[e.index];
          errors.push({
            rowIndex: src?.rowNumber ?? i + e.index + 2,
            columns: [],
            reason: e.error,
          });
        });
      } catch (err: any) {
        errors.push({ rowIndex: 0, columns: [], reason: `Lỗi batch import: ${err.message}` });
      }
      onProgress?.(Math.min(i + chunk.length, total), total);
    }

    fetchData();
    return { created, updated: 0, errors };
  };

  const handleCloneData = async (
    sourceYear: number,
    sourceMonth: number,
    targetYear: number,
    targetMonth: number
  ) => {
    try {
      const { data: sourceRevenues } = await getRevenues({
        year: sourceYear,
        months: [sourceMonth],
        pageSize: "all",
      });

      if (sourceRevenues.length === 0) {
        toast({
          variant: "destructive",
          title: "Không có dữ liệu nguồn.",
          description: `Không tìm thấy dữ liệu nguồn cho ${getMonthName(sourceMonth)}/${sourceYear}.`
        });
        return;
      }

      let cloneSuccess = 0;
      let cloneFail = 0;
      let failReasons: string[] = [];

      for (const rev of sourceRevenues) {
        try {
          // The Revenue type does not include created_at/updated_at.
          // We only need to exclude 'id' when creating a new record.
          const { id, ...cloneBase } = rev; 
          const clonedEntry: Omit<Revenue, 'id'> = {
            ...cloneBase,
            year: targetYear,
            month: targetMonth,
          };
          clonedEntry.vnd_revenue = calculateVNDRevenue(clonedEntry);

          await createRevenue(clonedEntry);
          cloneSuccess++;
        } catch (err: any) {
          cloneFail++;
          failReasons.push(`- Project "${rev.project_name || "N/A"}": ${err?.message || String(err)}`);
        }
      }
      fetchData(); 
      
      let description = `Tạo mới ${cloneSuccess} dòng dữ liệu từ ${getMonthName(sourceMonth)}/${sourceYear} sang ${getMonthName(targetMonth)}/${targetYear}.`;
      if (cloneFail > 0) {
        description += `\n\n${cloneFail} dòng bị lỗi:\n` + failReasons.join("\n");
      }

      toast({
        title: "Đã clone dữ liệu thành công!",
        description: <pre className="whitespace-pre-wrap max-h-60 overflow-y-auto">{description}</pre>,
        variant: cloneFail > 0 ? "destructive" : undefined,
        duration: cloneFail > 0 ? 9000: 5000,
      });

    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Lỗi khi clone dữ liệu.",
        description: err?.message || "Có lỗi xảy ra khi clone dữ liệu.",
      });
    }
  };
  
  const tableRows = useMemo(() => {
    const rowsToDisplay = searchTerm ? filteredRevenues : revenues;
    if (tempRow) {
      const displayTempRow = {
        ...tempRow,
        year: tempRow.year || 0,
        month: tempRow.month || 0,
        original_amount: tempRow.original_amount || 0,
        vnd_revenue: tempRow.vnd_revenue || 0,
        project_name: tempRow.project_name || "",
        id: tempRow.id || "temp-id",
      } as Revenue; // Cast to Revenue, ensuring all required fields are present
      return [displayTempRow, ...rowsToDisplay];
    }
    return rowsToDisplay;
  }, [tempRow, revenues, filteredRevenues, searchTerm]);

  return (
    <div>
      <PageHeader title="Revenue Management" />
      <div className="p-4 space-y-3">
        <RevenueFilters
          selectedYear={searchParams.year || new Date().getFullYear()}
          selectedMonths={searchParams.months || []}
          onYearChange={handleYearChange}
          onMonthChange={handleMonthChange}
        />

        <div className="flex items-center gap-3 flex-wrap justify-between">
          <RevenueSearch
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
          />
          <div className="flex items-center gap-3 flex-wrap">
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              onNextPage={() => { if (currentPage < totalPages) handlePageChange(currentPage + 1);}}
              onPreviousPage={() => { if (currentPage > 1) handlePageChange(currentPage - 1);}}
              totalItems={total}
              startIndex={startIndex}
              endIndex={endIndex}
              pageSize={searchParams.pageSize}
              onPageSizeChange={handlePageSizeChange}
              position="top"
            />
            <RevenueActions
              onImportExcel={handleImportExcel}
              onExportExcel={handleExportExcel}
              onCloneData={handleCloneData}
              onBulkDelete={async (year, months) => {
                try {
                  const { deleted } = await bulkDeleteRevenues(year, months);
                  toast({ title: "Đã xoá", description: `Đã xoá ${deleted} dòng revenue.` });
                  fetchData();
                  queryClient.invalidateQueries({ queryKey: ["dashboard-primitives"] });
                } catch (err: any) {
                  toast({ variant: "destructive", title: "Xoá thất bại", description: err?.message || "Lỗi" });
                }
              }}
              defaultYear={searchParams.year || new Date().getFullYear()}
              onAddNewRow={handleAddNewRowInline}
              customers={customers}
              companies={companies}
              divisions={divisions}
              projects={projects}
              projectTypes={projectTypes}
              resources={resources}
              currencies={currencies}
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-2 py-4" aria-busy="true">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : (
          <>
            <RevenueTable
              revenues={tableRows}
              customers={customers}
              companies={companies}
              divisions={divisions}
              projects={projects}
              projectTypes={projectTypes}
              resources={resources}
              currencies={currencies}
              searchParams={searchParams}
              getMonthName={getMonthName}
              calculateVNDRevenue={calculateVNDRevenue}
              onCellEdit={handleCombinedCellEdit}
              editingCell={editingCell}
              setEditingCell={setEditingCell}
              onInsertRowBelow={handleInsertRowBelow}
              onCloneRevenue={originalHandleCloneRevenue}
              onOpenDialog={handleOpenDialog}
              onDeleteRevenue={handleDeleteRevenue}
              tempRow={tempRow}
              onCommitTempRow={handleCommitTempRow}
            />
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              onNextPage={() => { if (currentPage < totalPages) handlePageChange(currentPage + 1);}}
              onPreviousPage={() => { if (currentPage > 1) handlePageChange(currentPage - 1);}}
              totalItems={total}
              startIndex={startIndex}
              endIndex={endIndex}
              pageSize={searchParams.pageSize}
              position="bottom"
            />
          </>
        )}
      </div>

      <RevenueDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        revenue={revenueInDialog}
        mode={dialogMode}
        customers={customers}
        companies={companies}
        divisions={divisions}
        projects={projects}
        projectTypes={projectTypes}
        resources={resources}
        currencies={currencies}
        onSave={handleSaveRevenue}
      />

    </div>
  );
};

export default Revenues;
