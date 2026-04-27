import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableHeader, TableRow, TableHead } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Plus, Upload, Trash2 } from "lucide-react";
import { useEmployeeData } from "@/hooks/useEmployeeData";
import { EmployeeTableRow } from "./EmployeeTableRow";
import { Employee, EMPLOYEE_TYPES, EMPLOYEE_CATEGORIES, EMPLOYEE_STATUSES, MONTH_LABELS, getConvertFactor } from "@/types/employee";
import { exportExcel, type ImportError, type ExcelSchema } from "@/utils/excelIO";
import ExcelImportDialog, { type ImportResult, type ImportProgress } from "@/components/ExcelImportDialog";
import { employeeService } from "@/services/employeeService";
import RevenueFilters from "@/components/RevenueFilters";
import RevenueSearch from "@/components/RevenueSearch";
import PaginationControls from "@/components/PaginationControls";
import BulkDeleteByMonthDialog from "@/components/BulkDeleteByMonthDialog";
import CloneEmployeeDialog from "./CloneEmployeeDialog";
import { useToast } from "@/hooks/use-toast";

function getDefaultMonths(): number[] {
  const currentMonth = new Date().getMonth(); // 0-indexed
  return Array.from({ length: currentMonth }, (_, i) => i + 1);
}

export function EmployeeTable() {
  const {
    employees,
    divisions,
    roles,
    loading,
    handleCellEdit,
    addNewItem,
    addRowBelow,
    deleteItem,
    cloneData,
    reload,
  } = useEmployeeData();

  const { toast } = useToast();
  const [importOpen, setImportOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonths, setSelectedMonths] = useState<number[]>(getDefaultMonths());
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(25);

  const filteredEmployees = useMemo(() => {
    return employees
      .filter((emp) => {
      if (emp.year !== selectedYear) return false;
      if (selectedMonths.length > 0 && !selectedMonths.includes(emp.month)) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const divName = divisions.find((d) => d.id === emp.division_id)?.name || "";
        const roleName = roles.find((r) => r.id === emp.role_id)?.code || "";
        const searchable = [emp.username, emp.name, emp.type, emp.category, emp.status, divName, roleName]
          .join(" ")
          .toLowerCase();
        if (!searchable.includes(term)) return false;
      }
      return true;
    })
      .sort((a, b) => (b.year - a.year) || (b.month - a.month));
  }, [employees, selectedYear, selectedMonths, searchTerm, divisions, roles]);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [selectedYear, selectedMonths, searchTerm]);

  const totalItems = filteredEmployees.length;
  const totalPages = pageSize === 'all' ? 1 : Math.ceil(totalItems / pageSize);
  const paginatedEmployees = useMemo(() => {
    if (pageSize === 'all') return filteredEmployees;
    const start = (currentPage - 1) * pageSize;
    return filteredEmployees.slice(start, start + pageSize);
  }, [filteredEmployees, currentPage, pageSize]);
  const startIndex = pageSize === 'all' ? 1 : (currentPage - 1) * (pageSize as number) + 1;
  const endIndex = pageSize === 'all' ? totalItems : Math.min(currentPage * (pageSize as number), totalItems);

  const schema = useMemo<ExcelSchema>(() => ({
    sheetName: "Employees",
    lookups: {
      months: MONTH_LABELS.map((m) => ({ code: m })),
      divisions: divisions.map((d) => ({ code: d.code, name: d.name })),
      roles: roles.map((r) => ({ code: r.code })),
      types: EMPLOYEE_TYPES.map((t) => ({ code: t })),
      categories: EMPLOYEE_CATEGORIES.map((c) => ({ code: c })),
      statuses: EMPLOYEE_STATUSES.map((s) => ({ code: s })),
    },
    columns: [
      { key: "year", header: "Year", type: "integer", required: true, width: 8 },
      { key: "month", header: "Month", lookup: "months", required: true, width: 10 },
      { key: "username", header: "User name", required: true, width: 18 },
      { key: "name", header: "Name", width: 24 },
      { key: "type", header: "Type", lookup: "types", width: 14 },
      { key: "division_code", header: "Division", lookup: "divisions", width: 14 },
      { key: "role_code", header: "Role", lookup: "roles", width: 14 },
      { key: "category", header: "Category", lookup: "categories", width: 14 },
      { key: "status", header: "Status", lookup: "statuses", width: 14 },
      { key: "working_day", header: "Working Day", type: "number", width: 12 },
    ],
  }), [divisions, roles]);

  const handleExport = async () => {
    try {
      const rows = filteredEmployees.map((e) => ({
        year: e.year,
        month: MONTH_LABELS[(e.month || 1) - 1] || "",
        username: e.username || "",
        name: e.name || "",
        type: e.type || "",
        division_code: divisions.find((d) => d.id === e.division_id)?.code || "",
        role_code: roles.find((r) => r.id === e.role_id)?.code || "",
        category: e.category || "",
        status: e.status || "",
        working_day: Number(e.working_day) || 0,
      }));
      await exportExcel({ schema, rows, fileName: `employees-${selectedYear}.xlsx` });
      toast({ title: "Export thành công", description: `Đã xuất ${rows.length} dòng.` });
    } catch (err: any) {
      toast({ title: "Export thất bại", description: err.message, variant: "destructive" });
    }
  };

  const handleImport = useCallback(async (
    rows: Record<string, any>[],
    onProgress?: ImportProgress,
  ): Promise<ImportResult> => {
    const errors: ImportError[] = [];

    const existingByKey = new Map<string, Employee>();
    for (const emp of employees) {
      if (!emp.id.startsWith("tmp-")) {
        existingByKey.set(`${emp.year}|${emp.month}|${(emp.username || "").toLowerCase()}`, emp);
      }
    }

    type Validated = {
      rowNumber: number;
      year: number;
      monthStr: string;
      username: string;
      payload: Partial<Employee> & Omit<Employee, "id" | "created_at" | "updated_at">;
    };
    const validated: Validated[] = [];

    for (const row of rows) {
      const rowNumber: number = row.__rowNumber || 0;
      const errCols: string[] = [];
      const reasons: string[] = [];

      const year = Number(row.year);
      if (!Number.isFinite(year) || year < 2000 || year > 2100) {
        errCols.push("Year"); reasons.push(`Năm không hợp lệ: "${row.year ?? ""}"`);
      }
      const monthStr = String(row.month || "").trim().toUpperCase();
      const monthIndex = MONTH_LABELS.findIndex((m) => m === monthStr);
      if (monthIndex < 0) {
        errCols.push("Month"); reasons.push(`Tháng không hợp lệ (${MONTH_LABELS.join("/")})`);
      }
      const month = monthIndex + 1;
      const username = String(row.username || "").trim();
      if (!username) {
        errCols.push("User name"); reasons.push("User name bắt buộc");
      }

      const divCode = String(row.division_code || "").trim();
      const div = divCode ? divisions.find((d) => d.code.toLowerCase() === divCode.toLowerCase()) : null;
      if (divCode && !div) { errCols.push("Division"); reasons.push(`Không tìm thấy Division: "${divCode}"`); }

      const roleCode = String(row.role_code || "").trim();
      const role = roleCode ? roles.find((r) => r.code.toLowerCase() === roleCode.toLowerCase()) : null;
      if (roleCode && !role) { errCols.push("Role"); reasons.push(`Không tìm thấy Role: "${roleCode}"`); }

      const workingDayRaw = row.working_day;
      const working_day = workingDayRaw != null && workingDayRaw !== "" ? Number(workingDayRaw) : 0;
      if (workingDayRaw != null && workingDayRaw !== "" && !Number.isFinite(working_day)) {
        errCols.push("Working Day"); reasons.push("Working Day phải là số");
      }

      if (errCols.length > 0) {
        errors.push({ rowIndex: rowNumber, columns: errCols, reason: reasons.join("; ") });
        continue;
      }

      const key = `${year}|${month}|${username.toLowerCase()}`;
      const existing = existingByKey.get(key);
      const payload: Partial<Employee> & Omit<Employee, "id" | "created_at" | "updated_at"> = {
        year,
        month,
        username,
        name: String(row.name || "").trim(),
        type: String(row.type || "").trim(),
        division_id: div?.id || null,
        role_id: role?.id || null,
        category: String(row.category || "").trim(),
        status: String(row.status || "Working").trim(),
        working_day,
      };
      if (existing) payload.id = existing.id;
      validated.push({ rowNumber, year, monthStr, username, payload });
    }

    let created = 0;
    let updated = 0;
    const total = validated.length;
    onProgress?.(0, total);

    const CHUNK = 200;
    for (let i = 0; i < validated.length; i += CHUNK) {
      const chunk = validated.slice(i, i + CHUNK);
      try {
        const res = await employeeService.bulkUpsert(chunk.map((v) => v.payload));
        created += res.created;
        updated += res.updated;
        for (const err of res.errors) {
          const v = chunk[err.index];
          errors.push({
            rowIndex: v?.rowNumber ?? 0,
            columns: [],
            reason: v ? `${v.year}/${v.monthStr}/${v.username}: ${err.error}` : err.error,
          });
        }
      } catch (err: any) {
        for (const v of chunk) {
          errors.push({
            rowIndex: v.rowNumber,
            columns: [],
            reason: `${v.year}/${v.monthStr}/${v.username}: ${err.message || "Lỗi"}`,
          });
        }
      }
      onProgress?.(Math.min(i + chunk.length, total), total);
    }

    if (reload) reload();
    return { created, updated, errors };
  }, [employees, divisions, roles, reload]);

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
              <CloneEmployeeDialog onClone={cloneData} />
              <Button variant="outline" size="sm" onClick={() => setImportOpen(true)} className="flex items-center gap-1">
                <Upload className="h-4 w-4" />
                Import
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport} className="flex items-center gap-1">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)} className="flex items-center gap-1">
                <Trash2 className="h-4 w-4" />
                Delete by Month
              </Button>
              <Button onClick={() => addNewItem(selectedYear, selectedMonths.length > 0 ? selectedMonths[0] : undefined)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Employee
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto mt-4">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="border border-border w-12 text-center">No.</TableHead>
                  <TableHead className="border border-border">Month</TableHead>
                  <TableHead className="border border-border">User name</TableHead>
                  <TableHead className="border border-border">Name</TableHead>
                  <TableHead className="border border-border">Type</TableHead>
                  <TableHead className="border border-border">Division</TableHead>
                  <TableHead className="border border-border">Role</TableHead>
                  <TableHead className="border border-border">Category</TableHead>
                  <TableHead className="border border-border">Status</TableHead>
                  <TableHead className="border border-border">Working Day</TableHead>
                  <TableHead className="border border-border">Convert Working Day</TableHead>
                  <TableHead className="border border-border text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="p-4 text-center text-muted-foreground">
                      No employees found.
                    </td>
                  </tr>
                ) : (
                  paginatedEmployees.map((emp, idx) => (
                    <EmployeeTableRow
                      key={emp.id}
                      item={emp}
                      index={startIndex - 1 + idx}
                      divisions={divisions}
                      roles={roles}
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
          entityLabel="employee"
          onConfirm={async (year, months) => {
            try {
              const { deleted } = await employeeService.bulkDelete(year, months);
              toast({ title: "Đã xoá", description: `Đã xoá ${deleted} dòng employee.` });
              if (reload) reload();
            } catch (err: any) {
              toast({ variant: "destructive", title: "Xoá thất bại", description: err?.message || "Lỗi" });
            }
          }}
        />

        <ExcelImportDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          title="Employees"
          schema={schema}
          templateFileName="employees-template.xlsx"
          errorFileName="employees-errors.xlsx"
          onImport={handleImport}
        />
      </Card>
    </div>
  );
}
