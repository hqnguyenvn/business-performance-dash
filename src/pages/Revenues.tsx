
import React, { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import RevenueFilters from "@/components/RevenueFilters";
import RevenueTable from "@/components/RevenueTable";
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
import { exportRevenueCSV } from "@/utils/csvExport";
import { Revenue } from "@/types/revenue";
import { MasterData } from "@/services/masterDataService"; // Added MasterData import
import { useClientRevenueFilter } from "@/hooks/useClientRevenueFilter";
import { useRevenueInlineEntry } from "@/hooks/useRevenueInlineEntry";

const Revenues = () => {
  const { toast } = useToast();
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
    return (typeof searchParams.pageSize === 'number' ? searchParams.pageSize : 5);
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

  const handleSearch = () => {};

  const handleCombinedCellEdit = (id: string, field: keyof Revenue, value: any) => {
    // The handleCellEdit from inlineEntryUtils is already designed to call handleCellEditDb internally.
    handleCellEdit(id, field, value, handleCellEditDb as any);
  };

  const handleExportCSV = () => {
    try {
      exportRevenueCSV({
        revenues: filteredRevenues,
        customers,
        companies,
        divisions,
        projects,
        projectTypes,
        resources,
        currencies,
        getMonthName,
        calculateVNDRevenue,
      });
      toast({
        title: "CSV exported successfully!",
        description: "Revenue data has been downloaded as CSV file.",
      });
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "There was an error exporting the CSV file.",
      });
    }
  };

  const monthNameToNumber = (name: string | undefined | null): number | null => {
    if (!name) return null;
    const map: Record<string, number> = {
      jan: 1, feb: 2, mar: 3, apr: 4,
      may: 5, jun: 6, jul: 7, aug: 8,
      sep: 9, oct: 10, nov: 11, dec: 12,
    };
    const key = (name + "").substring(0,3).toLowerCase();
    return map[key] || null;
  };
  
  function findIdByCode(arr: MasterData[], code: string | undefined | null): string | null {
    if (!code) return null;
    const obj = arr.find((item) => (item.code || "").toString().trim().toLowerCase() === (code || "").toString().trim().toLowerCase());
    return obj ? obj.id : null;
  }
  
  const handleImportCSV = async (
    data: any[],
    masterDataRefs: { 
      customers: MasterData[],
      companies: MasterData[],
      divisions: MasterData[],
      projects: MasterData[],
      projectTypes: MasterData[],
      resources: MasterData[],
      currencies: MasterData[],
    }
  ) => {
    let successCount = 0;
    let errorRows: { row: number; reason: string }[] = [];
    const requiredFields = ['Year', 'Month', 'Original Amount']; // VND Revenue is calculated

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      let missingRequiredFields: string[] = [];
      requiredFields.forEach(rf => {
        const keyVariations = [rf, rf.toLowerCase(), rf.replace(/\s+/g, ''), rf.replace(/\s+/g, '_').toLowerCase()];
        if (!keyVariations.some(k => row[k] !== undefined && row[k] !== null && row[k] !== '')) {
          missingRequiredFields.push(rf);
        }
      });

      if (missingRequiredFields.length > 0) {
        errorRows.push({ row: i + 2, reason: `Thiếu dữ liệu bắt buộc: ${missingRequiredFields.join(", ")}`});
        continue;
      }
      
      const customer_code = row["Customer"] || row["customer"];
      const company_code = row["Company"] || row["company"];
      const division_code = row["Division"] || row["division"];
      const project_code = row["Project"] || row["project"];
      const project_type_code = row["Project Type"] || row["project_type"];
      const resource_code = row["Resource"] || row["resource"];
      const currency_code = row["Currency"] || row["currency"];

      const customer_id = findIdByCode(masterDataRefs.customers, customer_code);
      const company_id = findIdByCode(masterDataRefs.companies, company_code);
      const division_id = findIdByCode(masterDataRefs.divisions, division_code);
      const project_id = findIdByCode(masterDataRefs.projects, project_code);
      const project_type_id = findIdByCode(masterDataRefs.projectTypes, project_type_code);
      const resource_id = findIdByCode(masterDataRefs.resources, resource_code);
      const currency_id = findIdByCode(masterDataRefs.currencies, currency_code);
      
      let mappingErrors: string[] = [];
      if (customer_code && !customer_id) mappingErrors.push(`Customer ('${customer_code}')`);
      if (company_code && !company_id) mappingErrors.push(`Company ('${company_code}')`);
      if (division_code && !division_id) mappingErrors.push(`Division ('${division_code}')`);
      if (project_code && !project_id) mappingErrors.push(`Project ('${project_code}')`);
      if (project_type_code && !project_type_id) mappingErrors.push(`Project Type ('${project_type_code}')`);
      if (resource_code && !resource_id) mappingErrors.push(`Resource ('${resource_code}')`);
      if (currency_code && !currency_id) mappingErrors.push(`Currency ('${currency_code}')`);

      if (mappingErrors.length > 0) {
        errorRows.push({ row: i + 2, reason: `Không tìm thấy mã tương ứng cho: ${mappingErrors.join(", ")}` });
        continue;
      }
      
      try {
        const fileMonthRaw = row["Month"] || row["month"];
        let monthValue: number | null = null;
        if (fileMonthRaw) {
          if (typeof fileMonthRaw === "string" && isNaN(Number(fileMonthRaw))) {
            monthValue = monthNameToNumber(fileMonthRaw);
          } else {
            monthValue = Number(fileMonthRaw);
          }
        }
        if (!monthValue || monthValue < 1 || monthValue > 12) {
           errorRows.push({ row: i + 2, reason: `Tháng không hợp lệ: ${fileMonthRaw}` });
           continue;
        }
        
        const originalAmountRaw = row["Original Amount"] || row["original_amount"] || row["originalamount"];
        const original_amount = Number(originalAmountRaw);
        if (isNaN(original_amount)) {
          errorRows.push({ row: i + 2, reason: `Số tiền gốc không hợp lệ: ${originalAmountRaw}` });
          continue;
        }
        
        const newRevenuePartial: Partial<Revenue> = {
          year: Number(row["Year"] || row["year"]),
          month: monthValue,
          customer_id: customer_id || undefined,
          company_id: company_id || undefined,
          division_id: division_id || undefined,
          project_id: project_id || undefined,
          project_type_id: project_type_id || undefined,
          resource_id: resource_id || undefined,
          currency_id: currency_id || undefined,
          unit_price: row["Unit Price"] !== undefined ? Number(row["Unit Price"]) : (row["unit_price"] !== undefined ? Number(row["unit_price"]) : undefined),
          quantity: row["Quantity"] !== undefined ? Number(row["Quantity"]) : (row["quantity"] !== undefined ? Number(row["quantity"]) : undefined),
          original_amount: original_amount,
          notes: row["Notes"] || row["notes"] || undefined,
          project_name: row["Project Name"] || row["project_name"] || "",
        };
        
        const vnd_revenue = calculateVNDRevenue(newRevenuePartial);

        const finalNewRevenue: Omit<Revenue, 'id'> = {
            ...newRevenuePartial,
            year: newRevenuePartial.year!,
            month: newRevenuePartial.month!,
            original_amount: newRevenuePartial.original_amount!,
            project_name: newRevenuePartial.project_name || "", 
            vnd_revenue: vnd_revenue,
        };
        
        if (!finalNewRevenue.year) {
          errorRows.push({ row: i + 2, reason: "Thiếu dữ liệu năm" });
          continue;
        }

        await (await import("@/services/revenueApi")).createRevenue(finalNewRevenue);
        successCount++;
      } catch (err: any) {
        errorRows.push({ row: i + 2, reason: `Lỗi khi insert: ${err.message}` });
      }
    }
    fetchData();
    let msg = `Đã import thành công ${successCount} dòng dữ liệu.`;
    if (errorRows.length > 0) {
      const errorDetails = errorRows.map(e => `- Dòng ${e.row}: ${e.reason}`).join("\n");
      msg += `\n\nCác dòng lỗi (${errorRows.length}):\n${errorDetails}`;
      toast({
        title: "Kết quả Import CSV",
        description: <pre className="whitespace-pre-wrap max-h-60 overflow-y-auto">{msg}</pre>,
        variant: "destructive",
        duration: errorRows.length > 5 ? 15000 : 9000,
      });
    } else {
       toast({
        title: "Kết quả Import CSV",
        description: msg,
      });
    }
  };

  const handleCloneData = async (
    sourceYear: number,
    sourceMonth: number,
    targetYear: number,
    targetMonth: number
  ) => {
    try {
      const { data: sourceRevenues } = await (await import("@/services/revenueApi")).getRevenues({
        year: sourceYear,
        months: [sourceMonth],
        pageSize: 'all',
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

          await (await import("@/services/revenueApi")).createRevenue(clonedEntry);
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
      <PageHeader
        title="Revenue Management"
        description="Manage revenue information"
      />
      <div className="p-6">
        <RevenueFilters
          selectedYear={searchParams.year || new Date().getFullYear()}
          selectedMonths={searchParams.months || []}
          onYearChange={handleYearChange}
          onMonthChange={handleMonthChange}
        />

        <Card>
          <CardHeader>
            <CardTitle>Revenue Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
              <RevenueSearch
                searchTerm={searchTerm}
                onSearchTermChange={setSearchTerm}
                onSearch={handleSearch}
              />
              <div className="flex items-center gap-4 flex-wrap">
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  onNextPage={() => { if (currentPage < totalPages) handlePageChange(currentPage + 1);}}
                  onPreviousPage={() => { if (currentPage > 1) handlePageChange(currentPage - 1);}}
                  totalItems={total}
                  startIndex={startIndex}
                  endIndex={endIndex}
                  pageSize={itemsPerPage}
                  onPageSizeChange={handlePageSizeChange}
                  position="top"
                />
                <RevenueActions
                  onImportCSV={(data) => handleImportCSV(data, {customers, companies, divisions, projects, projectTypes, resources, currencies})}
                  onExportCSV={handleExportCSV}
                  onCloneData={handleCloneData}
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
              onCellEdit={handleCombinedCellEdit} // Use the correctly wired handler
              editingCell={editingCell}
              setEditingCell={setEditingCell}
              onInsertRowBelow={handleInsertRowBelow}
              onCloneRevenue={originalHandleCloneRevenue} // Use the original one from crudOperations
              onOpenDialog={handleOpenDialog}
              onDeleteRevenue={handleDeleteRevenue}
              tempRow={tempRow}
              onCommitTempRow={handleCommitTempRow}
            />
          </CardContent>
        </Card>
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
