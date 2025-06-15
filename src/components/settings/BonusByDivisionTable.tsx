import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { bonusByDivisionService, BonusByDivision } from "@/services/bonusByDivisionService";
import { MasterData } from "@/services/masterDataService";
import { useToast } from "@/hooks/use-toast";
import BonusByDivisionRow from "./BonusByDivisionRow";
import BonusByDivisionEditRow from "./BonusByDivisionEditRow";
import BonusByDivisionNewRow from "./BonusByDivisionNewRow";

interface BonusByDivisionTableProps {
  data: BonusByDivision[];
  setter: React.Dispatch<React.SetStateAction<BonusByDivision[]>>;
  divisions: MasterData[];
}

const thisYear = new Date().getFullYear();

const emptyRow = (divisions: MasterData[]): BonusByDivision => ({
  id: "",
  year: thisYear,
  division_id: divisions.length ? divisions[0].id : "",
  bn_bmm: 0,
  notes: "",
});

const BonusByDivisionTable: React.FC<BonusByDivisionTableProps> = ({
  data,
  setter,
  divisions
}) => {
  const { toast } = useToast();
  // Track row editing states (by id, or "" for new)
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editCache, setEditCache] = useState<Partial<BonusByDivision>>({});
  const [addingBelowIdx, setAddingBelowIdx] = useState<number | null>(null);

  // Enable inline edit mode for a row
  const onEdit = (row: BonusByDivision) => {
    setEditingRowId(row.id);
    setEditCache({ ...row });
  };

  // Start add new row at bottom
  const onAddNew = () => {
    setEditingRowId(""); // Empty id means "new"
    setEditCache(emptyRow(divisions));
  };

  // Insert row below an index
  const onInsertBelow = (idx: number) => {
    setAddingBelowIdx(idx);
    setEditingRowId("");
    setEditCache(emptyRow(divisions));
  };

  const onCancel = () => {
    setEditingRowId(null);
    setEditCache({});
    setAddingBelowIdx(null);
  };

  const onFieldChange = (field: keyof BonusByDivision, value: any) => {
    setEditCache(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      if (editingRowId === "") {
        // Add new row
        // Basic check
        if (
          typeof editCache.year === "number" &&
          typeof editCache.division_id === "string" && editCache.division_id &&
          typeof editCache.bn_bmm === "number"
        ) {
          const added = await bonusByDivisionService.add({
            year: editCache.year,
            division_id: editCache.division_id,
            bn_bmm: editCache.bn_bmm,
            notes: editCache.notes ?? "",
          });
          // insert at desired place or at top
          if (addingBelowIdx !== null) {
            const newArr = [...data];
            newArr.splice(addingBelowIdx + 1, 0, added);
            setter(newArr);
          } else {
            setter(prev => [added, ...prev]);
          }
          toast({ title: "Success", description: "Created new entry" });
        } else {
          toast({ title: "Error", description: "Fill all required fields", variant: "destructive" });
          return;
        }
      } else if (editingRowId) {
        // Save edited row
        if (
          typeof editCache.year === "number" &&
          typeof editCache.division_id === "string" && editCache.division_id &&
          typeof editCache.bn_bmm === "number"
        ) {
          const updated = await bonusByDivisionService.update(editingRowId, {
            year: editCache.year,
            division_id: editCache.division_id,
            bn_bmm: editCache.bn_bmm,
            notes: editCache.notes ?? "",
          });
          setter(prev =>
            prev.map(item => (item.id === editingRowId ? updated : item))
          );
          toast({ title: "Success", description: "Updated entry" });
        } else {
          toast({ title: "Error", description: "Fill all required fields", variant: "destructive" });
          return;
        }
      }
      setEditingRowId(null);
      setEditCache({});
      setAddingBelowIdx(null);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await bonusByDivisionService.delete(id);
      setter(prev => prev.filter(item => item.id !== id));
      toast({ title: "Success", description: "Deleted entry" });
      if (editingRowId === id) {
        setEditingRowId(null);
        setEditCache({});
        setAddingBelowIdx(null);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  // UI/UX similar to MasterDataTable
  return (
    <Card className="bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Bonus by Division</CardTitle>
          <Button onClick={onAddNew} variant="outline" size="sm">Add</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="border border-gray-300 w-12 text-center">No.</TableHead>
                <TableHead className="border border-gray-300">Year</TableHead>
                <TableHead className="border border-gray-300">Division</TableHead>
                <TableHead className="border border-gray-300">BN_BMM</TableHead>
                <TableHead className="border border-gray-300">Notes</TableHead>
                <TableHead className="border border-gray-300 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* New Row (add at top or below) */}
              {editingRowId === "" && (
                <BonusByDivisionNewRow
                  divisions={divisions}
                  editCache={editCache}
                  thisYear={thisYear}
                  onFieldChange={onFieldChange}
                  onSave={handleSave}
                  onCancel={onCancel}
                />
              )}
              {/* Data Rows */}
              {data.map((row, idx) =>
                editingRowId === row.id ? (
                  <BonusByDivisionEditRow
                    key={row.id}
                    idx={idx}
                    editCache={editCache}
                    row={row}
                    divisions={divisions}
                    onFieldChange={onFieldChange}
                    onSave={handleSave}
                    onCancel={onCancel}
                  />
                ) : (
                  <BonusByDivisionRow
                    key={row.id}
                    row={row}
                    idx={idx}
                    divisions={divisions}
                    onEdit={onEdit}
                    onInsertBelow={onInsertBelow}
                    onDelete={handleDelete}
                  />
                )
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default BonusByDivisionTable;
