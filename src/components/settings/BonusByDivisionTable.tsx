
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { bonusByDivisionService, BonusByDivision } from "@/services/bonusByDivisionService";
import { MasterData } from "@/services/masterDataService";
import { useToast } from "@/hooks/use-toast";

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
                <TableRow>
                  <TableCell />
                  <TableCell className="p-1">
                    <Input
                      type="number"
                      value={editCache.year ?? thisYear}
                      min={2020}
                      onChange={e => onFieldChange("year", Number(e.target.value))}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell className="p-1">
                    <Select
                      value={editCache.division_id ?? ""}
                      onValueChange={v => onFieldChange("division_id", v)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select Division" />
                      </SelectTrigger>
                      <SelectContent>
                        {divisions.map(d => (
                          <SelectItem key={d.id} value={d.id}>{d.code} - {d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="p-1">
                    <Input
                      type="number"
                      value={editCache.bn_bmm ?? 0}
                      min={0}
                      step={0.01}
                      onChange={e => onFieldChange("bn_bmm", Number(e.target.value))}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell className="p-1">
                    <Input
                      value={editCache.notes ?? ""}
                      onChange={e => onFieldChange("notes", e.target.value)}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell className="p-1 text-center">
                    <Button size="sm" className="mr-2" onClick={handleSave}>Save</Button>
                    <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
                  </TableCell>
                </TableRow>
              )}
              {/* Data Rows */}
              {data.map((row, idx) =>
                editingRowId === row.id ? (
                  <TableRow key={row.id}>
                    <TableCell className="text-center font-medium">{idx + 1}</TableCell>
                    <TableCell className="p-1">
                      <Input
                        type="number"
                        value={editCache.year ?? row.year}
                        min={2020}
                        onChange={e => onFieldChange("year", Number(e.target.value))}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell className="p-1">
                      <Select
                        value={editCache.division_id ?? row.division_id}
                        onValueChange={v => onFieldChange("division_id", v)}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select Division" />
                        </SelectTrigger>
                        <SelectContent>
                          {divisions.map(d => (
                            <SelectItem key={d.id} value={d.id}>{d.code} - {d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="p-1">
                      <Input
                        type="number"
                        value={editCache.bn_bmm ?? row.bn_bmm}
                        min={0}
                        step={0.01}
                        onChange={e => onFieldChange("bn_bmm", Number(e.target.value))}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell className="p-1">
                      <Input
                        value={editCache.notes ?? row.notes ?? ""}
                        onChange={e => onFieldChange("notes", e.target.value)}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell className="p-1 text-center">
                      <Button size="sm" className="mr-2" onClick={handleSave}>Save</Button>
                      <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow key={row.id} className="hover:bg-gray-50">
                    <TableCell className="text-center font-medium">{idx + 1}</TableCell>
                    <TableCell>{row.year}</TableCell>
                    <TableCell>
                      {divisions.find(d => d.id === row.division_id)?.code ?? ""}
                    </TableCell>
                    <TableCell>{row.bn_bmm}</TableCell>
                    <TableCell>{row.notes}</TableCell>
                    <TableCell className="p-1 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* Insert row below */}
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          title="Insert new row below"
                          onClick={() => onInsertBelow(idx)}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                            strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                            <line x1="12" x2="12" y1="5" y2="19" />
                            <line x1="5" x2="19" y1="12" y2="12" />
                          </svg>
                        </Button>
                        {/* Edit */}
                        <Button size="icon" variant="outline" className="h-8 w-8" title="Edit" onClick={() => onEdit(row)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2"
                            strokeLinecap="round" strokeLinejoin="round"
                            className="h-4 w-4">
                            <path d="M12 20h9"></path>
                            <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19.5 3 21l1.5-4L16.5 3.5z"></path>
                          </svg>
                        </Button>
                        {/* Delete */}
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8"
                          title="Delete"
                          onClick={() => handleDelete(row.id)}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                            strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" x2="10" y1="11" y2="17"></line>
                            <line x1="14" x2="14" y1="11" y2="17"></line>
                          </svg>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
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
