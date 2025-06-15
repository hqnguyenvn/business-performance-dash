
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MasterData } from "@/services/masterDataService";
import { BonusByDivision } from "@/services/bonusByDivisionService";
import { useBonusByDivisionFilter } from "./useBonusByDivisionFilter";
// Sử dụng hook sửa grid mới
import { useBonusByDivisionGridEdit } from "./useBonusByDivisionGridEdit";
import BonusByDivisionRow from "./BonusByDivisionRow";

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
  const {
    setFilter,
    getActiveFilters,
    filterData,
    filterRows,
  } = useBonusByDivisionFilter(data, divisions);

  const {
    editingCell,
    handleEditCell,
    handleBlurCell,
    saveCell,
    addingBelowIdx,
    onInsertBelow,
    newRowCache,
    onNewRowFieldChange,
    handleSaveNewRow,
    onCancelNewRow,
    handleDelete,
  } = useBonusByDivisionGridEdit(data, setter, divisions, thisYear);

  // Dữ liệu đã được filter và mapping lại index cho "No."
  const filteredData = filterRows(data);

  // Handler khi nhấn Enter tại dòng new-row: gọi handleSaveNewRow nếu valid
  const handleNewRowKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.key === "Enter") {
      handleSaveNewRow();
    }
    if (e.key === "Escape") {
      onCancelNewRow();
    }
  };

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
                      onClick={() => onInsertBelow(-1)}
                      title="Add new row"
                    >
                      <Plus size={16} />
                    </Button>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((row, idx) => {
                const isInsertBelow = addingBelowIdx === idx;

                return (
                  <React.Fragment key={row.id}>
                    <BonusByDivisionRow
                      row={row}
                      idx={idx}
                      divisions={divisions}
                      editingCell={editingCell}
                      onEditCell={handleEditCell}
                      onBlurCell={handleBlurCell}
                      saveCell={saveCell}
                      onInsertBelow={onInsertBelow}
                      onDelete={handleDelete}
                    />
                    {isInsertBelow && (
                      <TableRow>
                        {/* Số thứ tự: idx+2 vì thêm dưới idx */}
                        <TableCell className="text-center font-medium">{idx + 2}</TableCell>
                        <TableCell className="p-1 text-center">
                          <input
                            type="number"
                            className="h-8 w-full border rounded text-center px-2"
                            value={newRowCache.year ?? thisYear}
                            onChange={e => onNewRowFieldChange("year", Number(e.target.value))}
                            autoFocus={editingCell?.id === "new" && editingCell.field === "year"}
                            onKeyDown={handleNewRowKeyDown}
                          />
                        </TableCell>
                        <TableCell className="p-1 text-center">
                          <select
                            className="h-8 w-full border rounded px-2"
                            value={newRowCache.division_id ?? ''}
                            onChange={e => onNewRowFieldChange("division_id", e.target.value)}
                            onKeyDown={handleNewRowKeyDown}
                          >
                            <option value="">Select</option>
                            {divisions.map(d => (
                              <option key={d.id} value={d.id}>{d.code}</option>
                            ))}
                          </select>
                        </TableCell>
                        <TableCell className="p-1 text-right">
                          {/* Định dạng số với dấu phẩy, có thể nhập Enter để lưu */}
                          <input
                            type="text"
                            inputMode="decimal"
                            className="h-8 w-full border rounded text-right px-2"
                            value={(newRowCache.bn_bmm ?? "")?.toLocaleString?.() ?? ""}
                            onChange={e => {
                              // Giữ số, bỏ dấu phẩy khi lưu vào cache
                              const val = e.target.value.replace(/,/g, "");
                              onNewRowFieldChange("bn_bmm", Number(val));
                            }}
                            onKeyDown={handleNewRowKeyDown}
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <input
                            className="h-8 w-full border rounded px-2"
                            value={newRowCache.notes ?? ""}
                            onChange={e => onNewRowFieldChange("notes", e.target.value)}
                            onKeyDown={handleNewRowKeyDown}
                          />
                        </TableCell>
                        <TableCell className="p-1 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button size="icon" variant="outline" className="h-8 w-8" title="Save" onClick={handleSaveNewRow}>
                              <Plus size={18} />
                            </Button>
                            <Button variant="destructive" size="icon" className="h-8 w-8" title="Cancel" onClick={onCancelNewRow}>
                              {/* trash-2 icon */}
                              <svg width="18" height="18" stroke="currentColor" fill="none" strokeWidth={2}><path d="M3 6h12M8 6v8m4-8v8M9 2h2a2 2 0 012 2v0H7v0a2 2 0 012-2z" /><path d="M5 6v8a2 2 0 002 2h6a2 2 0 002-2V6" /></svg>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
              {addingBelowIdx === -1 && (
                <TableRow>
                  {/* Số thứ tự: 1 */}
                  <TableCell className="text-center font-medium">1</TableCell>
                  <TableCell className="p-1 text-center">
                    <input
                      type="number"
                      className="h-8 w-full border rounded text-center px-2"
                      value={newRowCache.year ?? thisYear}
                      onChange={e => onNewRowFieldChange("year", Number(e.target.value))}
                      autoFocus={editingCell?.id === "new" && editingCell.field === "year"}
                      onKeyDown={handleNewRowKeyDown}
                    />
                  </TableCell>
                  <TableCell className="p-1 text-center">
                    <select
                      className="h-8 w-full border rounded px-2"
                      value={newRowCache.division_id ?? ''}
                      onChange={e => onNewRowFieldChange("division_id", e.target.value)}
                      onKeyDown={handleNewRowKeyDown}
                    >
                      <option value="">Select</option>
                      {divisions.map(d => (
                        <option key={d.id} value={d.id}>{d.code}</option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell className="p-1 text-right">
                    <input
                      type="text"
                      inputMode="decimal"
                      className="h-8 w-full border rounded text-right px-2"
                      value={(newRowCache.bn_bmm ?? "")?.toLocaleString?.() ?? ""}
                      onChange={e => {
                        const val = e.target.value.replace(/,/g, "");
                        onNewRowFieldChange("bn_bmm", Number(val));
                      }}
                      onKeyDown={handleNewRowKeyDown}
                    />
                  </TableCell>
                  <TableCell className="p-1">
                    <input
                      className="h-8 w-full border rounded px-2"
                      value={newRowCache.notes ?? ""}
                      onChange={e => onNewRowFieldChange("notes", e.target.value)}
                      onKeyDown={handleNewRowKeyDown}
                    />
                  </TableCell>
                  <TableCell className="p-1 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button size="icon" variant="outline" className="h-8 w-8" title="Save" onClick={handleSaveNewRow}>
                        <Plus size={18} />
                      </Button>
                      <Button variant="destructive" size="icon" className="h-8 w-8" title="Cancel" onClick={onCancelNewRow}>
                        {/* trash-2 icon */}
                        <svg width="18" height="18" stroke="currentColor" fill="none" strokeWidth={2}><path d="M3 6h12M8 6v8m4-8v8M9 2h2a2 2 0 012 2v0H7v0a2 2 0 012-2z" /><path d="M5 6v8a2 2 0 002 2h6a2 2 0 002-2V6" /></svg>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default BonusByDivisionTable;

