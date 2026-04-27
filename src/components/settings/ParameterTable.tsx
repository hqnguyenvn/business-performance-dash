
import React, { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Download, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Parameter, parameterService } from "@/services/parameterService";
import { ParameterRow } from "./ParameterRow";
import { useParameterEdit } from "./useParameterEdit";
import { useParameterFilter } from "./useParameterFilter";
import { TableFilter } from "@/components/ui/table-filter";
import { exportExcel, type ImportError, type ExcelSchema } from "@/utils/excelIO";
import ExcelImportDialog, { type ImportResult, type ImportProgress } from "@/components/ExcelImportDialog";
import { reportRowProgress } from "@/utils/importProgress";

interface ParameterTableProps {
  data: Parameter[];
  setter: React.Dispatch<React.SetStateAction<Parameter[]>>;
}

export const ParameterTable: React.FC<ParameterTableProps> = ({ data, setter }) => {
  const { toast } = useToast();
  const [userModified, setUserModified] = useState(false);

  const sortedData = useMemo(() => {
    if (userModified) return data;
    return [...data].sort((a, b) => b.year - a.year);
  }, [data, userModified]);

  const { editingCell, onEditCell, onBlurCell } = useParameterEdit();
  const {
    filteredData,
    yearFilter,
    setYearFilter,
    codeFilter,
    setCodeFilter,
    availableYears,
    availableCodes,
  } = useParameterFilter(sortedData);

  const saveCell = async (id: string, field: keyof Parameter, value: any) => {
    try {
      const updates: Partial<Parameter> = { [field]: value };
      const updatedRow = await parameterService.update(id, updates);
      setter(prev => prev.map(row => row.id === id ? updatedRow : row));
      toast({
        title: "Success",
        description: "Parameter updated successfully",
      });
    } catch (error) {
      console.error("Error updating parameter:", error);
      toast({
        title: "Error",
        description: "Failed to update parameter",
        variant: "destructive",
      });
    }
  };

  const addNewRow = async () => {
    setUserModified(true);
    try {
      const currentYear = new Date().getFullYear();
      const newRow = await parameterService.add({
        year: currentYear,
        code: "",
        value: 0,
        descriptions: "",
      });
      setter(prev => [newRow, ...prev]);
      toast({
        title: "Success",
        description: "New parameter added",
      });
    } catch (error) {
      console.error("Error adding parameter:", error);
      toast({
        title: "Error",
        description: "Failed to add parameter",
        variant: "destructive",
      });
    }
  };

  const addRowAfter = async (afterId: string) => {
    setUserModified(true);
    try {
      const afterRow = data.find(row => row.id === afterId);
      const newRow = await parameterService.add({
        year: afterRow?.year || new Date().getFullYear(),
        code: "",
        value: 0,
        descriptions: "",
      });
      
      const afterIndex = data.findIndex(row => row.id === afterId);
      setter(prev => {
        const newData = [...prev];
        newData.splice(afterIndex + 1, 0, newRow);
        return newData;
      });
      
      toast({
        title: "Success",
        description: "New parameter added",
      });
    } catch (error) {
      console.error("Error adding parameter:", error);
      toast({
        title: "Error",
        description: "Failed to add parameter",
        variant: "destructive",
      });
    }
  };

  const deleteRow = async (id: string) => {
    try {
      await parameterService.delete(id);
      setter(prev => prev.filter(row => row.id !== id));
      toast({
        title: "Success",
        description: "Parameter deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting parameter:", error);
      toast({
        title: "Error",
        description: "Failed to delete parameter",
        variant: "destructive",
      });
    }
  };

  const handleYearFilter = (field: string, values: string[]) => {
    setYearFilter(values.map(v => parseInt(v)));
  };

  const handleCodeFilter = (field: string, values: string[]) => {
    setCodeFilter(values);
  };

  const [importOpen, setImportOpen] = useState(false);

  const schema = useMemo<ExcelSchema>(() => ({
    sheetName: "Parameters",
    columns: [
      { key: "year", header: "Year", type: "integer", required: true, width: 8 },
      { key: "code", header: "Code", required: true, width: 20 },
      { key: "value", header: "Value", type: "number", width: 14 },
      { key: "descriptions", header: "Descriptions", width: 40 },
    ],
  }), []);

  const handleExport = async () => {
    try {
      const rows = data.map((r) => ({
        year: r.year,
        code: r.code,
        value: r.value,
        descriptions: r.descriptions || "",
      }));
      await exportExcel({ schema, rows, fileName: "parameters.xlsx" });
      toast({ title: "Export thành công", description: `Đã xuất ${rows.length} dòng.` });
    } catch (err: any) {
      toast({ title: "Export thất bại", description: err.message, variant: "destructive" });
    }
  };

  const handleImport = useCallback(async (
    rows: Record<string, any>[],
    onProgress?: ImportProgress,
  ): Promise<ImportResult> => {
    let created = 0;
    let updated = 0;
    const errors: ImportError[] = [];
    const total = rows.length;
    onProgress?.(0, total);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber: number = row.__rowNumber || 0;
      const errCols: string[] = [];
      const reasons: string[] = [];

      const year = Number(row.year);
      if (!Number.isFinite(year) || year < 2000 || year > 2100) {
        errCols.push("Year"); reasons.push(`Năm không hợp lệ: "${row.year ?? ""}"`);
      }
      const code = String(row.code || "").trim();
      if (!code) {
        errCols.push("Code"); reasons.push("Code bắt buộc");
      }
      const valueRaw = row.value;
      const value = valueRaw != null && valueRaw !== "" ? Number(valueRaw) : 0;
      if (valueRaw != null && valueRaw !== "" && !Number.isFinite(value)) {
        errCols.push("Value"); reasons.push("Value phải là số");
      }
      const descriptions = String(row.descriptions || "").trim();

      if (errCols.length > 0) {
        errors.push({ rowIndex: rowNumber, columns: errCols, reason: reasons.join("; ") });
        reportRowProgress(i + 1, total, onProgress);
        continue;
      }

      const existing = data.find(
        (item) => item.year === year && item.code.toLowerCase() === code.toLowerCase()
      );

      try {
        if (existing) {
          const updatedItem = await parameterService.update(existing.id, { value, descriptions });
          setter((prev) => prev.map((item) => (item.id === existing.id ? { ...item, ...updatedItem } : item)));
          updated++;
        } else {
          const newItem = await parameterService.add({ year, code, value, descriptions });
          setter((prev) => [newItem, ...prev]);
          created++;
        }
      } catch (error: any) {
        errors.push({ rowIndex: rowNumber, columns: [], reason: `${year}/${code}: ${error.message || "Lỗi"}` });
      }
      reportRowProgress(i + 1, total, onProgress);
    }
    return { created, updated, errors };
  }, [data, setter]);

  return (
    <Card className="bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Parameter List</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)} className="flex items-center gap-1">
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Button onClick={addNewRow} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Parameter
            </Button>
          </div>
        </div>
      </CardHeader>
      <ExcelImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Parameters"
        schema={schema}
        templateFileName="parameters-template.xlsx"
        errorFileName="parameters-errors.xlsx"
        onImport={handleImport}
      />
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center border border-gray-300 w-16">#</TableHead>
                <TableHead className="text-center border border-gray-300">
                  <div className="flex items-center justify-between">
                    <span>Year</span>
                    <TableFilter
                      data={availableYears.map(y => ({ value: y.toString(), label: y.toString() }))}
                      field="year"
                      onFilter={handleYearFilter}
                      activeFilters={yearFilter.map(y => y.toString())}
                    />
                  </div>
                </TableHead>
                <TableHead className="text-center border border-gray-300">
                  <div className="flex items-center justify-between">
                    <span>Code</span>
                    <TableFilter
                      data={availableCodes.map(c => ({ value: c, label: c }))}
                      field="code"
                      onFilter={handleCodeFilter}
                      activeFilters={codeFilter}
                    />
                  </div>
                </TableHead>
                <TableHead className="text-right border border-gray-300">Value</TableHead>
                <TableHead className="text-left border border-gray-300">Descriptions</TableHead>
                <TableHead className="text-center border border-gray-300 w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((row, idx) => (
                <ParameterRow
                  key={row.id}
                  row={row}
                  idx={idx}
                  editingCell={editingCell}
                  onEditCell={onEditCell}
                  onBlurCell={onBlurCell}
                  saveCell={saveCell}
                  onDelete={deleteRow}
                  onAddRowAfter={addRowAfter}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ParameterTable;
