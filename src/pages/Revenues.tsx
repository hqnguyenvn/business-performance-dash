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
import { useRevenueCrudOperations } from "@/hooks/useRevenueCrudOperations";
import { exportRevenueCSV } from "@/utils/csvExport";
import { Revenue } from "@/services/revenueService";
import RevenueInlineRow from "@/components/RevenueInlineRow";
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

  const {
    handleAddNewRow,
    handleInsertRowBelow,
    handleCloneRevenue,
    handleCellEdit: handleCellEditDb
  } = useRevenueCrudOperations(
    { revenues, setRevenues, fetchData, searchParams },
    { getMonthNumber, calculateVNDRevenue }
  );

  // Hook for inline entry
  const {
    editingCell,
    setEditingCell,
    tempRow,
    handleAddNewRowInline,
    handleEditTempRow,
    handleCommitTempRow,
    handleCellEdit,
  } = useRevenueInlineEntry(fetchData);

  const [searchTerm, setSearchTerm] = useState("");

  // Filtering with custom hook
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
    return Math.ceil(total / itemsPerPage);
  }, [total, itemsPerPage, searchParams.pageSize]);
  const startIndex = useMemo(() => {
    if (searchParams.pageSize === 'all') return 1;
    return (currentPage - 1) * itemsPerPage + 1;
  }, [currentPage, itemsPerPage, searchParams.pageSize]);
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
    const effectivePageSize = itemsPerPage;
    const calculatedTotalPages = Math.ceil(total / effectivePageSize);
    let newPage = page;
    if (page < 1) {
      newPage = 1;
    } else if (page > calculatedTotalPages && calculatedTotalPages > 0) {
      newPage = calculatedTotalPages;
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

  // Export CSV handler unchanged
  const handleExportCSV = () => {
    try {
      exportRevenueCSV({
        revenues,
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

  // Clone and Import handlers remain the same as before
  const monthNameToNumber = (name: string | undefined | null) => {
    if (!name) return null;
    const map: Record<string, number> = {
      jan: 1, feb: 2, mar: 3, apr: 4,
      may: 5, jun: 6, jul: 7, aug: 8,
      sep: 9, oct: 10, nov: 11, dec: 12,
    };
    return map[(name + "").substring(0,3).toLowerCase()] || null;
  };

  // Hàm tìm id từ code
  function findIdByCode(arr: any[], code: string | undefined | null) {
    if (!code) return null;
    const obj = arr.find((item) => (item.code || "").toString().trim() === (code || "").toString().trim());
    return obj ? obj.id : null;
  }

  // MAIN: Handle import csv with mapping
  const handleImportCSV = async (
    data: any[],
    masterData: {
      customers: any[],
      companies: any[],
      divisions: any[],
      projects: any[],
      projectTypes: any[],
      resources: any[],
      currencies: any[],
    }
  ) => {
    let successCount = 0;
    let errorRows: { row: number; reason: string }[] = [];
    for (let i = 0; i < data.length; i++) {
      const row = data[i];

      // Defensive: Normalize field names (viết hoa/thường, tiếng Anh...)
      // Kỳ vọng tên trong file csv: year, month, customer, company, division, project, project_type, resource, currency, unit_price, quantity, original_amount, vnd_revenue, notes, project_name
      // Map code -> id
      const customer_id = findIdByCode(masterData.customers, row["Customer"] || row["customer"]);
      const company_id = findIdByCode(masterData.companies, row["Company"] || row["company"]);
      const division_id = findIdByCode(masterData.divisions, row["Division"] || row["division"]);
      const project_id = findIdByCode(masterData.projects, row["Project"] || row["project"]);
      const project_type_id = findIdByCode(masterData.projectTypes, row["Project Type"] || row["project_type"]);
      const resource_id = findIdByCode(masterData.resources, row["Resource"] || row["resource"]);
      const currency_id = findIdByCode(masterData.currencies, row["Currency"] || row["currency"]);
      // Những trường bắt buộc: year, month, original_amount, vnd_revenue (?)
      // Trả lỗi nếu thiếu thông tin mapping Id (user sẽ kiểm tra)
      // Có thể cho phép null nếu trường không bắt buộc

      // Nếu file import thiếu code (không khớp) sẽ bỏ qua và báo lỗi
      let missingFields: string[] = [];
      if ((row["Customer"] || row["customer"]) && !customer_id) missingFields.push("Customer");
      if ((row["Company"] || row["company"]) && !company_id) missingFields.push("Company");
      if ((row["Division"] || row["division"]) && !division_id) missingFields.push("Division");
      if ((row["Project"] || row["project"]) && !project_id) missingFields.push("Project");
      if ((row["Project Type"] || row["project_type"]) && !project_type_id) missingFields.push("Project Type");
      if ((row["Resource"] || row["resource"]) && !resource_id) missingFields.push("Resource");
      if ((row["Currency"] || row["currency"]) && !currency_id) missingFields.push("Currency");

      if (missingFields.length > 0) {
        errorRows.push({
          row: i + 2, // +2 vì có header và index bắt đầu từ 0
          reason: `Không tìm thấy code cho các cột: ${missingFields.join(", ")}`
        });
        continue;
      }

      // Build object data cho Revenue
      try {
        // Convert month: 'Jan' -> 1
        const fileMonthRaw = row["Month"] || row["month"];
        let monthValue: number | null = null;
        // If month value is string (Jan ...) convert. Else keep number
        if (fileMonthRaw && typeof fileMonthRaw === "string" && isNaN(Number(fileMonthRaw))) {
          monthValue = monthNameToNumber(fileMonthRaw);
        } else if (fileMonthRaw) {
          monthValue = Number(fileMonthRaw);
        }

        const newRevenue = {
          // Bắt buộc: year, month, original_amount, vnd_revenue
          year: Number(row["Year"] || row["year"]),
          month: monthValue,
          customer_id,
          company_id,
          division_id,
          project_id,
          project_type_id,
          resource_id,
          currency_id,
          unit_price: row["Unit Price"] !== undefined ? Number(row["Unit Price"]) : (row["unit_price"] !== undefined ? Number(row["unit_price"]) : undefined),
          quantity: row["Quantity"] !== undefined ? Number(row["Quantity"]) : (row["quantity"] !== undefined ? Number(row["quantity"]) : undefined),
          original_amount: Number(row["Original Amount"] || row["original_amount"] || 0),
          vnd_revenue: Number(row["VND Revenue"] || row["vnd_revenue"] || 0),
          notes: row["Notes"] || row["notes"] || null,
          project_name: row["Project Name"] || row["project_name"] || "",
        };
        // Validate year, month
        if (!newRevenue.year || !newRevenue.month) {
          errorRows.push({ row: i + 2, reason: "Thiếu dữ liệu năm hoặc tháng" });
          continue;
        }
        // Validate số tiền
        if (isNaN(newRevenue.original_amount) || isNaN(newRevenue.vnd_revenue)) {
          errorRows.push({ row: i + 2, reason: "Dữ liệu số tiền không hợp lệ" });
          continue;
        }
        // Tạo mới record trong Supabase
        await (await import("@/services/revenueService")).createRevenue(newRevenue as any);
        successCount++;
      } catch (err: any) {
        errorRows.push({ row: i + 2, reason: `Lỗi khi insert: ${err.message}` });
      }
    }
    // Sau khi import xong thì reload
    fetchData();
    let msg = `Đã import thành công ${successCount} dòng dữ liệu.`;
    if (errorRows.length > 0) {
      msg += "\nCác dòng lỗi:\n" + errorRows.map(e => `- Dòng ${e.row}: ${e.reason}`).join("\n");
    }
    toast({
      title: "Kết quả Import CSV",
      description: msg,
      variant: errorRows.length > 0 ? "destructive" : undefined,
    });
  };

  const handleCloneData = async (
    sourceYear: number,
    sourceMonth: number,
    targetYear: number,
    targetMonth: number
  ) => {
    try {
      const sourceRevenues = await (await import("@/services/revenueService")).revenueService.getByFilters({
        year: sourceYear,
        month: sourceMonth,
      });

      if (sourceRevenues.length === 0) {
        toast({
          variant: "destructive",
          title: "Không có dữ liệu nguồn.",
          description: `Không tìm thấy dữ liệu nguồn cho ${sourceMonth}/${sourceYear}.`
        });
        return;
      }

      let cloneSuccess = 0;
      let cloneFail = 0;
      let failReasons: string[] = [];

      for (const rev of sourceRevenues) {
        try {
          // Only destructure id to remove it, do NOT try to destructure created_at/updated_at
          const { id, ...cloneBase } = rev;

          await (await import("@/services/revenueService")).createRevenue({
            ...cloneBase,
            year: targetYear,
            month: targetMonth,
          });

          cloneSuccess++;
        } catch (err: any) {
          cloneFail++;
          failReasons.push(`- Project "${rev.project_name || ""}": ${err?.message || err}`);
        }
      }
      fetchData();
      toast({
        title: "Đã clone dữ liệu thành công!",
        description:
          `Tạo mới ${cloneSuccess} dòng dữ liệu từ ${sourceMonth}/${sourceYear} sang ${targetMonth}/${targetYear}.` +
          (cloneFail > 0 ? `\n${cloneFail} dòng bị lỗi:\n${failReasons.join("\n")}` : ""),
        variant: cloneFail > 0 ? "destructive" : undefined,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Lỗi khi clone dữ liệu.",
        description: err?.message || "Có lỗi xảy ra khi clone dữ liệu.",
      });
    }
  };

  // Compose rows
  const tableRows = useMemo(() => {
    if (tempRow) {
      return [tempRow, ...filteredRevenues];
    }
    return filteredRevenues;
  }, [tempRow, filteredRevenues]);

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
              <div className="flex items-center gap-4">
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
                  onImportCSV={handleImportCSV}
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
            {/* ĐÃ BỎ PHẦN DƯỚI: KHÔNG render <RevenueInlineRow /> ở đây nữa */}

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
              onCellEdit={(id, field, value) => handleCellEdit(id, field, value, handleCellEditDb)}
              editingCell={editingCell}
              setEditingCell={setEditingCell}
              onInsertRowBelow={handleInsertRowBelow}
              onCloneRevenue={handleCloneRevenue}
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
