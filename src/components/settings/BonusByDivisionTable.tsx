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
import BonusByDivisionNewRow from "./BonusByDivisionNewRow";

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

  // Handler khi nhấn Enter hoặc Escape tại dòng new-row: gọi handleSaveNewRow nếu valid, huỷ nếu Escape
  const useHandleNewRowKeyDown = () =>
    React.useCallback(
      (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
        if (e.key === "Enter") {
          handleSaveNewRow();
        }
        if (e.key === "Escape") {
          onCancelNewRow();
        }
      },
      [handleSaveNewRow, onCancelNewRow]
    );
  const handleNewRowKeyDown = useHandleNewRowKeyDown();

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
                      <BonusByDivisionNewRow
                        newRowCache={newRowCache}
                        idx={idx}
                        divisions={divisions}
                        editingCell={editingCell}
                        onFieldChange={onNewRowFieldChange}
                        onSave={handleSaveNewRow}
                        onCancel={onCancelNewRow}
                        thisYear={thisYear}
                        onKeyDown={handleNewRowKeyDown}
                      />
                    )}
                  </React.Fragment>
                );
              })}
              {/* Thêm dòng ở đầu bảng nếu addingBelowIdx === -1 */}
              {addingBelowIdx === -1 && (
                <BonusByDivisionNewRow
                  newRowCache={newRowCache}
                  idx={null}
                  divisions={divisions}
                  editingCell={editingCell}
                  onFieldChange={onNewRowFieldChange}
                  onSave={handleSaveNewRow}
                  onCancel={onCancelNewRow}
                  thisYear={thisYear}
                  onKeyDown={handleNewRowKeyDown}
                />
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default BonusByDivisionTable;
