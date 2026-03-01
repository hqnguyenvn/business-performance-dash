import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableHeader, TableRow, TableHead } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Plus, Upload } from "lucide-react";
import { useEmployeeData } from "@/hooks/useEmployeeData";
import { EmployeeTableRow } from "./EmployeeTableRow";
import { Employee, EMPLOYEE_TYPES, EMPLOYEE_CATEGORIES, EMPLOYEE_STATUSES } from "@/types/employee";
import { exportToCsv } from "@/utils/exportCsv";

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
  } = useEmployeeData();

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
      division_name: divisions.find((d) => d.id === e.division_id)?.name || "",
      role_name: roles.find((r) => r.id === e.role_id)?.code || "",
    }));
    exportToCsv(exportData, "Employees", columns);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <Card className="bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Employee List</CardTitle>
          <div className="flex items-center gap-2">
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
              <TableRow className="bg-gray-50">
                <TableHead className="border border-gray-300 w-12 text-center">No.</TableHead>
                <TableHead className="border border-gray-300">Year</TableHead>
                <TableHead className="border border-gray-300">Month</TableHead>
                <TableHead className="border border-gray-300">User name</TableHead>
                <TableHead className="border border-gray-300">Name</TableHead>
                <TableHead className="border border-gray-300">Type</TableHead>
                <TableHead className="border border-gray-300">Division</TableHead>
                <TableHead className="border border-gray-300">Role</TableHead>
                <TableHead className="border border-gray-300">Category</TableHead>
                <TableHead className="border border-gray-300">Status</TableHead>
                <TableHead className="border border-gray-300">Working Day</TableHead>
                <TableHead className="border border-gray-300 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-4 text-center text-gray-500">
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
    </Card>
  );
}
