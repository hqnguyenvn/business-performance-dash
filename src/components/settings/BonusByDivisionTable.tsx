
import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MasterData } from "@/services/masterDataService";
import { BonusByDivision, bonusByDivisionService } from "@/services/bonusByDivisionService";
import { useBonusByDivisionFilter } from "./useBonusByDivisionFilter";
import BonusByDivisionRow from "./BonusByDivisionRow";
import { useToast } from "@/hooks/use-toast";

interface BonusByDivisionTableProps {
  data: BonusByDivision[];
  setter: React.Dispatch<React.SetStateAction<BonusByDivision[]>>;
  divisions: MasterData[];
}

const thisYear = new Date().getFullYear();

const BonusByDivisionTable: React.FC<BonusByDivisionTableProps> = ({
  data,
  setter,
  divisions,
}) => {
  const { toast } = useToast();
  const {
    setFilter,
    getActiveFilters,
    filterData,
    filterRows,
  } = useBonusByDivisionFilter(data, divisions);

  const [editingCell, setEditingCell] = useState<{ id: string; field: keyof BonusByDivision } | null>(null);

  const handleEditCell = useCallback((id: string, field: keyof BonusByDivision) => {
    setEditingCell({ id, field });
  }, []);

  const handleBlurCell = useCallback(() => {
    setEditingCell(null);
  }, []);

  const handleAddRow = useCallback(() => {
    const newId = `new-${Date.now()}`;
    const newRow: BonusByDivision = {
      id: newId,
      year: thisYear,
      division_id: divisions.length > 0 ? divisions[0].id : '',
      bn_bmm: 0,
      notes: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setter(prev => [newRow, ...prev]);
    setTimeout(() => handleEditCell(newId, 'year'), 50);
  }, [setter, divisions, handleEditCell]);

  const handleDelete = useCallback(async (id: string) => {
    const isNew = id.toString().startsWith('new-');
    if (isNew) {
      setter(prev => prev.filter(row => row.id !== id));
      return;
    }
    try {
      await bonusByDivisionService.delete(id);
      setter(prev => prev.filter(row => row.id !== id));
      toast({ title: "Success", description: "Deleted entry" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  }, [setter, toast]);

  const saveCell = useCallback(async (id: string, field: keyof BonusByDivision, value: any) => {
    const isNew = id.toString().startsWith('new-');
    const originalRow = data.find(r => r.id === id);
    if (!originalRow) return;

    setter(prev => prev.map(row => (row.id === id ? { ...row, [field]: value } : row)));

    const updatedRow = { ...originalRow, [field]: value };
    const { year, division_id, bn_bmm, notes } = updatedRow;
    
    if (!division_id) return;
    
    try {
        if (isNew) {
            if (year && division_id) { // Only add if required fields are present
                const newRecord = await bonusByDivisionService.add({ year, division_id, bn_bmm, notes: notes ?? '' });
                setter(prev => prev.map(row => (row.id === id ? newRecord : row)));
                toast({ title: "Success", description: "Created new entry" });
            }
        } else {
            const updatedRecord = await bonusByDivisionService.update(id, { [field]: value });
            setter(prev => prev.map(row => (row.id === id ? updatedRecord : row)));
            toast({ title: "Success", description: "Updated entry" });
        }
    } catch (e: any) {
        setter(prev => prev.map(r => r.id === id ? originalRow : r)); // Revert on error
        toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  }, [data, setter, toast]);

  const filteredData = filterRows(data);

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle>Bonus by Division</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="border border-gray-300 w-12 text-center">No.</TableHead>
                <TableHead
                  className="border border-gray-300 text-center"
                  showFilter={true}
                  filterData={filterData.year}
                  filterField="year"
                  onFilter={setFilter}
                  activeFilters={getActiveFilters("year")}
                >
                  Year
                </TableHead>
                <TableHead
                  className="border border-gray-300 text-center"
                  showFilter={true}
                  filterData={filterData.division_id}
                  filterField="division_id"
                  onFilter={setFilter}
                  activeFilters={getActiveFilters("division_id")}
                >
                  Division
                </TableHead>
                <TableHead
                  className="border border-gray-300 text-right"
                  showFilter={true}
                  filterData={filterData.bn_bmm}
                  filterField="bn_bmm"
                  onFilter={setFilter}
                  activeFilters={getActiveFilters("bn_bmm")}
                >
                  BN_BMM
                </TableHead>
                <TableHead
                  className="border border-gray-300"
                  showFilter={true}
                  filterData={filterData.notes}
                  filterField="notes"
                  onFilter={setFilter}
                  activeFilters={getActiveFilters("notes")}
                >
                  Notes
                </TableHead>
                <TableHead className="border border-gray-300 text-center w-28">
                  <div className="flex items-center justify-center gap-1">
                    <span>Actions</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="ml-1 h-6 w-6 p-0"
                      onClick={handleAddRow}
                      title="Add new row"
                    >
                      <Plus size={16} />
                    </Button>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((row, idx) => (
                <BonusByDivisionRow
                  key={row.id}
                  row={row}
                  idx={idx}
                  divisions={divisions}
                  editingCell={editingCell}
                  onEditCell={handleEditCell}
                  onBlurCell={handleBlurCell}
                  saveCell={saveCell}
                  onDelete={handleDelete}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default BonusByDivisionTable;
