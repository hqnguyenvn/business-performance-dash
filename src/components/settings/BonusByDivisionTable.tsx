
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { bonusByDivisionService, BonusByDivision } from "@/services/bonusByDivisionService";
import { MasterData } from "@/services/masterDataService";
import { useToast } from "@/hooks/use-toast";
import BonusByDivisionRow from "./BonusByDivisionRow";
import BonusByDivisionEditRow from "./BonusByDivisionEditRow";
import BonusByDivisionNewRow from "./BonusByDivisionNewRow";

// Helper để hiển thị tên division từ division_id.
const getDivisionDisplay = (divisions: MasterData[], id: string) => {
  const found = divisions.find((d) => d.id === id);
  return found ? `${found.code} - ${found.name}` : "";
};

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

const columns = [
  { key: "year", label: "Year" },
  { key: "division_id", label: "Division" },
  { key: "bn_bmm", label: "BN_BMM" },
  { key: "notes", label: "Notes" },
];

const BonusByDivisionTable: React.FC<BonusByDivisionTableProps> = ({
  data,
  setter,
  divisions,
}) => {
  const { toast } = useToast();
  // Track row editing states (by id, or "" for new)
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editCache, setEditCache] = useState<Partial<BonusByDivision>>({});
  const [addingBelowIdx, setAddingBelowIdx] = useState<number | null>(null);

  // --- FILTER LOGIC ---
  const [filters, setFilters] = useState<{ [key: string]: string[] }>({});

  // Trả về giá trị đang lọc theo trường
  const getActiveFilters = (field: string) => filters[field] || [];
  // Chuyển mảng value filter cập nhật vào state
  const setFilter = (field: string, values: string[]) => {
    setFilters((prev) => ({ ...prev, [field]: values }));
  };

  // Áp dụng bộ lọc vào data
  const filterRows = (rows: BonusByDivision[]) => {
    return rows.filter((r) => {
      // Year
      if (
        filters.year &&
        filters.year.length > 0 &&
        !filters.year.includes(String(r.year))
      )
        return false;
      // Division
      if (
        filters.division_id &&
        filters.division_id.length > 0 &&
        !filters.division_id.includes(r.division_id)
      )
        return false;
      // BN_BMM
      if (
        filters.bn_bmm &&
        filters.bn_bmm.length > 0 &&
        !filters.bn_bmm.includes(String(r.bn_bmm))
      )
        return false;
      // Notes
      if (
        filters.notes &&
        filters.notes.length > 0 &&
        !filters.notes.includes(r.notes ?? "")
      )
        return false;
      return true;
    });
  };

  // --- CRUD & Inline edit logic giữ nguyên ---
  const onEdit = (row: BonusByDivision) => {
    setEditingRowId(row.id);
    setEditCache({ ...row });
  };

  const onAddNew = () => {
    setEditingRowId(""); // Empty id means "new"
    setEditCache(emptyRow(divisions));
  };

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
    setEditCache((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      if (editingRowId === "") {
        // Add new row
        if (
          typeof editCache.year === "number" &&
          typeof editCache.division_id === "string" &&
          editCache.division_id &&
          typeof editCache.bn_bmm === "number"
        ) {
          const added = await bonusByDivisionService.add({
            year: editCache.year,
            division_id: editCache.division_id,
            bn_bmm: editCache.bn_bmm,
            notes: editCache.notes ?? "",
          });
          if (addingBelowIdx !== null) {
            const newArr = [...data];
            newArr.splice(addingBelowIdx + 1, 0, added);
            setter(newArr);
          } else {
            setter((prev) => [added, ...prev]);
          }
          toast({ title: "Success", description: "Created new entry" });
        } else {
          toast({
            title: "Error",
            description: "Fill all required fields",
            variant: "destructive",
          });
          return;
        }
      } else if (editingRowId) {
        // Save edited row
        if (
          typeof editCache.year === "number" &&
          typeof editCache.division_id === "string" &&
          editCache.division_id &&
          typeof editCache.bn_bmm === "number"
        ) {
          const updated = await bonusByDivisionService.update(editingRowId, {
            year: editCache.year,
            division_id: editCache.division_id,
            bn_bmm: editCache.bn_bmm,
            notes: editCache.notes ?? "",
          });
          setter((prev) =>
            prev.map((item) => (item.id === editingRowId ? updated : item))
          );
          toast({ title: "Success", description: "Updated entry" });
        } else {
          toast({
            title: "Error",
            description: "Fill all required fields",
            variant: "destructive",
          });
          return;
        }
      }
      setEditingRowId(null);
      setEditCache({});
      setAddingBelowIdx(null);
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await bonusByDivisionService.delete(id);
      setter((prev) => prev.filter((item) => item.id !== id));
      toast({ title: "Success", description: "Deleted entry" });
      if (editingRowId === id) {
        setEditingRowId(null);
        setEditCache({});
        setAddingBelowIdx(null);
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  // Chuẩn bị data & division cho filter grid
  const filterDivisionData = divisions.map((d) => ({
    ...d,
    value: d.id,
    displayValue: `${d.code} - ${d.name}`,
  }));

  // Chuẩn bị dữ liệu cho filter từng cột
  const filterData = {
    year: Array.from(new Set(data.map((r) => r.year))).map((y) => ({
      value: String(y),
      displayValue: String(y),
    })),
    division_id: filterDivisionData,
    bn_bmm: Array.from(new Set(data.map((r) => r.bn_bmm))).map((b) => ({
      value: String(b),
      displayValue: String(b),
    })),
    notes: Array.from(new Set(data.map((r) => r.notes ?? ""))).map((note) => ({
      value: note ?? "",
      displayValue: note ?? "",
    })),
  };

  // Render
  return (
    <Card className="bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Bonus by Division</CardTitle>
          <Button onClick={onAddNew} variant="outline" size="sm">
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="border border-gray-300 w-12 text-center">
                  No.
                </TableHead>
                <TableHead
                  className="border border-gray-300"
                  showFilter={true}
                  filterData={filterData.year}
                  filterField="year"
                  onFilter={setFilter}
                  activeFilters={getActiveFilters("year")}
                >
                  Year
                </TableHead>
                <TableHead
                  className="border border-gray-300"
                  showFilter={true}
                  filterData={filterData.division_id}
                  filterField="division_id"
                  onFilter={setFilter}
                  activeFilters={getActiveFilters("division_id")}
                >
                  Division
                </TableHead>
                <TableHead
                  className="border border-gray-300"
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
                <TableHead className="border border-gray-300 text-center">
                  Actions
                </TableHead>
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
              {filterRows(data).map((row, idx) =>
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

