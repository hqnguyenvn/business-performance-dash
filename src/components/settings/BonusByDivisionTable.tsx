
import React, { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MasterData } from "@/services/masterDataService";
import { BonusByDivision, bonusByDivisionService } from "@/services/bonusByDivisionService";
import { useBonusByDivisionFilter } from "./useBonusByDivisionFilter";
import BonusByDivisionRow from "./BonusByDivisionRow";
import { useToast } from "@/hooks/use-toast";
import { exportToCsv } from "@/utils/exportCsv";
import ImportCsvDialog from "@/components/ImportCsvDialog";

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
  const [userModified, setUserModified] = useState(false);

  const sortedData = useMemo(() => {
    if (userModified) return data;
    return [...data].sort((a, b) => b.year - a.year);
  }, [data, userModified]);

  const {
    setFilter,
    getActiveFilters,
    filterData,
    filterRows,
  } = useBonusByDivisionFilter(sortedData, divisions);

  const [editingCell, setEditingCell] = useState<{ id: string; field: keyof BonusByDivision } | null>(null);

  const handleEditCell = useCallback((id: string, field: keyof BonusByDivision) => {
    setEditingCell({ id, field });
  }, []);

  const handleBlurCell = useCallback(() => {
    setEditingCell(null);
  }, []);

  const handleAddRow = useCallback(() => {
    setUserModified(true);
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

  const handleAddRowAfter = useCallback((afterId: string) => {
    setUserModified(true);
    const anchorRow = data.find(r => r.id === afterId);
    if (!anchorRow) return;

    const newId = `new-${Date.now()}`;
    const newRow: BonusByDivision = {
      id: newId,
      year: anchorRow.year,
      division_id: anchorRow.division_id,
      bn_bmm: 0,
      notes: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const anchorIndexInData = data.findIndex(r => r.id === afterId);

    if (anchorIndexInData !== -1) {
      setter(prev => {
        const newData = [...prev];
        newData.splice(anchorIndexInData + 1, 0, newRow);
        return newData;
      });
      setTimeout(() => handleEditCell(newId, 'bn_bmm'), 50);
    }
  }, [data, setter, handleEditCell]);

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

  const filteredData = filterRows(sortedData);

  const [importOpen, setImportOpen] = useState(false);

  const handleExport = () => {
    const exportData = data.map((row) => ({
      ...row,
      division_name: divisions.find((d) => d.id === row.division_id)?.name || "",
    }));
    exportToCsv(exportData, "Bonus_by_Division", [
      { key: "year", header: "Year" },
      { key: "division_name", header: "Division" },
      { key: "bn_bmm", header: "BN_BMM" },
      { key: "notes", header: "Notes" },
    ]);
  };

  const handleImport = useCallback(async (rows: Record<string, string>[]) => {
    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const row of rows) {
      const year = parseInt(row["Year"] || "");
      const divisionName = (row["Division"] || "").trim();
      const bn_bmm = parseFloat(row["BN_BMM"] || "0");
      const notes = (row["Notes"] || "").trim();

      if (!year || !divisionName) {
        errors.push(`Skipped invalid row: Year=${row["Year"]}, Division=${divisionName}`);
        continue;
      }

      const division = divisions.find(
        (d) => d.name.toLowerCase() === divisionName.toLowerCase() || d.code.toLowerCase() === divisionName.toLowerCase()
      );
      if (!division) {
        errors.push(`Division "${divisionName}" not found.`);
        continue;
      }

      const existing = data.find(
        (item) => item.year === year && item.division_id === division.id
      );

      try {
        if (existing) {
          const updatedItem = await bonusByDivisionService.update(existing.id, { bn_bmm, notes });
          setter((prev) => prev.map((item) => (item.id === existing.id ? { ...item, ...updatedItem } : item)));
          updated++;
        } else {
          const newItem = await bonusByDivisionService.add({ year, division_id: division.id, bn_bmm, notes });
          setter((prev) => [newItem, ...prev]);
          created++;
        }
      } catch (error: any) {
        errors.push(`Year=${year}, Division=${divisionName}: ${error.message || "Unknown error"}`);
      }
    }
    return { created, updated, errors };
  }, [data, divisions, setter]);

  return (
    <Card className="bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Bonus by Division</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)} className="flex items-center gap-1">
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Button onClick={handleAddRow} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Bonus
            </Button>
          </div>
        </div>
      </CardHeader>
      <ImportCsvDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Bonus by Division"
        expectedColumns={["Year", "Division", "BN_BMM", "Notes"]}
        onImport={handleImport}
      />
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
                  Actions
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
                  onAddRowAfter={handleAddRowAfter}
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
