import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableHeader, TableRow, TableHead } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Plus, Upload } from "lucide-react";
import { useEmployeeData } from "@/hooks/useEmployeeData";
import { EmployeeTableRow } from "./EmployeeTableRow";
import { Employee, EMPLOYEE_TYPES, EMPLOYEE_CATEGORIES, EMPLOYEE_STATUSES, MONTH_LABELS } from "@/types/employee";
import { exportToCsv } from "@/utils/exportCsv";
import ImportCsvDialog from "@/components/ImportCsvDialog";
import { employeeService } from "@/services/employeeService";

const IMPORT_COLUMNS = ["Year", "Month", "User name", "Name", "Type", "Division", "Role", "Category", "Status", "Working Day"];

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
    reload,
  } = useEmployeeData();

  const [importOpen, setImportOpen] = useState(false);

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
    ];
    const exportData = employees.map((e) => ({
      ...e,
      month: MONTH_LABELS[(e.month || 1) - 1] || e.month,
      division_name: divisions.find((d) => d.id === e.division_id)?.name || "",
      role_name: roles.find((r) => r.id === e.role_id)?.code || "",
    }));
    exportToCsv(exportData, "Employees", columns);
  };

  const handleImport = useCallback(async (rows: Record<string, string>[]) => {
    let created = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        // Resolve month from label
        const monthStr = (row["Month"] || "").trim().toUpperCase();
        const monthIndex = MONTH_LABELS.findIndex((m) => m === monthStr);
        const month = monthIndex >= 0 ? monthIndex + 1 : parseInt(row["Month"]) || 1;

        // Resolve division by name
        const divName = (row["Division"] || "").trim();
        const div = divisions.find((d) => d.name.toLowerCase() === divName.toLowerCase());

        // Resolve role by code
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

        await employeeService.create(item);
        created++;
      } catch (err: any) {
        errors.push(`Row ${i + 1}: ${err.message || "Failed"}`);
      }
    }

    if (reload) reload();
    return { created, updated: 0, errors };
  }, [divisions, roles, reload]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="ml-3 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <Card className="bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Employee List</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)} className="flex items-center gap-1">
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button onClick={addNewItem} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Employee
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
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
                <TableHead className="border border-border text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-4 text-center text-muted-foreground">
                    No employees found.
                  </td>
                </tr>
              ) : (
                employees.map((emp, idx) => (
                  <EmployeeTableRow
                    key={emp.id}
                    item={emp}
                    index={idx}
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
      </CardContent>

      <ImportCsvDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Employees"
        expectedColumns={IMPORT_COLUMNS}
        onImport={handleImport}
      />
    </Card>
  );
}
