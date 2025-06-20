
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Parameter, parameterService } from "@/services/parameterService";
import { ParameterRow } from "./ParameterRow";
import { useParameterEdit } from "./useParameterEdit";
import { useParameterFilter } from "./useParameterFilter";
import { TableFilter } from "@/components/ui/table-filter";

interface ParameterTableProps {
  data: Parameter[];
  setter: React.Dispatch<React.SetStateAction<Parameter[]>>;
}

export const ParameterTable: React.FC<ParameterTableProps> = ({ data, setter }) => {
  const { toast } = useToast();
  const { editingCell, onEditCell, onBlurCell } = useParameterEdit();
  const {
    filteredData,
    yearFilter,
    setYearFilter,
    codeFilter,
    setCodeFilter,
    availableYears,
    availableCodes,
  } = useParameterFilter(data);

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

  return (
    <Card className="bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Parameter List</CardTitle>
          <Button onClick={addNewRow} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Parameter
          </Button>
        </div>
      </CardHeader>
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
