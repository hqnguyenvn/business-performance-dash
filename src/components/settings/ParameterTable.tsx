
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
import { exportToCsv } from "@/utils/exportCsv";
import ImportCsvDialog from "@/components/ImportCsvDialog";

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

  const handleImport = useCallback(async (rows: Record<string, string>[]) => {
    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const row of rows) {
      const year = parseInt(row["Year"] || "");
      const code = (row["Code"] || "").trim();
      const value = parseFloat(row["Value"] || "0");
      const descriptions = (row["Descriptions"] || "").trim();

      if (!year || !code) {
        errors.push(`Skipped invalid row: Year=${row["Year"]}, Code=${code}`);
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
        errors.push(`Year=${year}, Code=${code}: ${error.message || "Unknown error"}`);
      }
    }
    return { created, updated, errors };
  }, [data, setter]);

  return (
    <Card className="bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Parameter List</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => {
              exportToCsv(data, "Parameters", [
                { key: "year", header: "Year" },
                { key: "code", header: "Code" },
                { key: "value", header: "Value" },
                { key: "descriptions", header: "Descriptions" },
              ]);
            }} className="flex items-center gap-1">
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
      <ImportCsvDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Parameters"
        expectedColumns={["Year", "Code", "Value", "Descriptions"]}
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
