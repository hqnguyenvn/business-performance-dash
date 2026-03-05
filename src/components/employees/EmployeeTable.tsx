import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableHeader, TableRow, TableHead } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Plus, Upload } from "lucide-react";
import { useEmployeeData } from "@/hooks/useEmployeeData";
import { EmployeeTableRow } from "./EmployeeTableRow";
import { Employee, EMPLOYEE_TYPES, EMPLOYEE_CATEGORIES, EMPLOYEE_STATUSES, MONTH_LABELS, getConvertFactor } from "@/types/employee";
import { exportToCsv } from "@/utils/exportCsv";
import ImportCsvDialog from "@/components/ImportCsvDialog";
import { employeeService } from "@/services/employeeService";
import RevenueFilters from "@/components/RevenueFilters";
import RevenueSearch from "@/components/RevenueSearch";
import PaginationControls from "@/components/PaginationControls";
import CloneEmployeeDialog from "./CloneEmployeeDialog";

const IMPORT_COLUMNS = ["Year", "Month", "User name", "Name", "Type", "Division", "Role", "Category", "Status", "Working Day"];

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

  const [importOpen, setImportOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonths, setSelectedMonths] = useState<number[]>(getDefaultMonths());
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(25);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (emp.year !== selectedYear) return false;
      if (selectedMonths.length > 0 && !selectedMonths.includes(emp.month)) return false;
      if (appliedSearch) {
        const term = appliedSearch.toLowerCase();
        const divName = divisions.find((d) => d.id === emp.division_id)?.name || "";
        const roleName = roles.find((r) => r.id === emp.role_id)?.code || "";
        const searchable = [emp.username, emp.name, emp.type, emp.category, emp.status, divName, roleName]
          .join(" ")
          .toLowerCase();
        if (!searchable.includes(term)) return false;
      }
      return true;
    });
  }, [employees, selectedYear, selectedMonths, appliedSearch, divisions, roles]);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [selectedYear, selectedMonths, appliedSearch]);

  const totalItems = filteredEmployees.length;
  const totalPages = pageSize === 'all' ? 1 : Math.ceil(totalItems / pageSize);
  const paginatedEmployees = useMemo(() => {
    if (pageSize === 'all') return filteredEmployees;
    const start = (currentPage - 1) * pageSize;
    return filteredEmployees.slice(start, start + pageSize);
  }, [filteredEmployees, currentPage, pageSize]);
  const startIndex = pageSize === 'all' ? 1 : (currentPage - 1) * (pageSize as number) + 1;
  const endIndex = pageSize === 'all' ? totalItems : Math.min(currentPage * (pageSize as number), totalItems);

  const handleExport = () => {
    const columns = [
      { key: "year", header: "Year" },
      { key: "month", header: "Month" },
      { key: "username", header: "User name" },
      { key: "name", header: "Name" },
      { key: "type", header: "Type" },
      { key: "division_name", header: "Division" },
      { key: "role_name", header: "Role" },
      { key: "category", header: "Category" },
      { key: "status", header: "Status" },
      { key: "working_day", header: "Working Day" },
      { key: "convert_working_day", header: "Convert Working Day" },
    ];
    const exportData = filteredEmployees.map((e) => ({
      ...e,
      month: MONTH_LABELS[(e.month || 1) - 1] || e.month,
      division_name: divisions.find((d) => d.id === e.division_id)?.name || "",
      role_name: roles.find((r) => r.id === e.role_id)?.code || "",
      convert_working_day: (Number(e.working_day) * getConvertFactor(e.type || "")).toFixed(2),
    }));
    exportToCsv(exportData, "Employees", columns);
  };

  const handleImport = useCallback(async (rows: Record<string, string>[]) => {
    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    // Build lookup map for upsert by (year, month, username)
    const existingMap = new Map<string, Employee>();
    for (const emp of employees) {
      if (!emp.id.startsWith("tmp-")) {
        const key = `${emp.year}-${emp.month}-${emp.username.toLowerCase()}`;
        existingMap.set(key, emp);
      }
    }

    // Phase 1: Classify rows into creates vs updates
    const toCreate: Omit<Employee, "id" | "created_at" | "updated_at">[] = [];
    const toUpdate: { id: string; data: Omit<Employee, "id" | "created_at" | "updated_at"> }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const monthStr = (row["Month"] || "").trim().toUpperCase();
        const monthIndex = MONTH_LABELS.findIndex((m) => m === monthStr);
        const month = monthIndex >= 0 ? monthIndex + 1 : parseInt(row["Month"]) || 1;

        const divCode = (row["Division"] || "").trim();
        const div = divisions.find((d) => d.code.toLowerCase() === divCode.toLowerCase());

        const roleCode = (row["Role"] || "").trim();
        const role = roles.find((r) => r.code.toLowerCase() === roleCode.toLowerCase());

        const item: Omit<Employee, "id" | "created_at" | "updated_at"> = {
          year: parseInt(row["Year"]) || new Date().getFullYear(),
          month,
          username: (row["User name"] || "").trim(),
          name: (row["Name"] || "").trim(),
          type: (row["Type"] || "").trim(),
          division_id: div?.id || null,
          role_id: role?.id || null,
          category: (row["Category"] || "").trim(),
          status: (row["Status"] || "Working").trim(),
          working_day: parseFloat(row["Working Day"]) || 0,
        };

        const key = `${item.year}-${month}-${item.username.toLowerCase()}`;
        const existing = existingMap.get(key);

        if (existing) {
          toUpdate.push({ id: existing.id, data: item });
        } else {
          toCreate.push(item);
        }
      } catch (err: any) {
        errors.push(`Row ${i + 1}: ${err.message || "Failed"}`);
      }
    }

    // Phase 2: Batch create in one request
    if (toCreate.length > 0) {
      const { error } = await supabase.from('employees').insert(toCreate);
      if (error) {
        errors.push(`Batch create failed: ${error.message}`);
      } else {
        created = toCreate.length;
      }
    }

    // Phase 3: Parallel updates
    if (toUpdate.length > 0) {
      const results = await Promise.allSettled(
        toUpdate.map(({ id, data }) => employeeService.update(id, data))
      );
      for (const result of results) {
        if (result.status === 'fulfilled') updated++;
        else errors.push(`Update failed: ${(result as PromiseRejectedResult).reason?.message || 'Unknown'}`);
      }
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
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle>Employee working days</CardTitle>
            <div className="flex items-center gap-2">
              <RevenueSearch
                searchTerm={searchTerm}
                onSearchTermChange={setSearchTerm}
                onSearch={() => setAppliedSearch(searchTerm)}
              />
              <CloneEmployeeDialog onClone={cloneData} />
              <Button variant="outline" size="sm" onClick={() => setImportOpen(true)} className="flex items-center gap-1">
                <Upload className="h-4 w-4" />
                Import
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport} className="flex items-center gap-1">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button onClick={() => addNewItem(selectedYear, selectedMonths.length > 0 ? selectedMonths[0] : undefined)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Employee
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
          <div className="overflow-x-auto mt-4">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="border border-border w-12 text-center">No.</TableHead>
                  <TableHead className="border border-border">Year</TableHead>
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
                    <td colSpan={13} className="p-4 text-center text-muted-foreground">
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

        <ImportCsvDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          title="Employees"
          expectedColumns={IMPORT_COLUMNS}
          onImport={handleImport}
        />
      </Card>
    </div>
  );
}
