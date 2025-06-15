
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
import BonusByDivisionRow from "./BonusByDivisionRow";
import BonusByDivisionEditRow from "./BonusByDivisionEditRow";
import BonusByDivisionNewRow from "./BonusByDivisionNewRow";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MasterData } from "@/services/masterDataService";
import { BonusByDivision } from "@/services/bonusByDivisionService";
import { useBonusByDivisionFilter } from "./useBonusByDivisionFilter";
import { useBonusByDivisionEdit } from "./useBonusByDivisionEdit";

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
    filterRows
  } = useBonusByDivisionFilter(data, divisions);

  const {
    editingRowId,
    editCache,
    addingBelowIdx,
    onEdit,
    onAddNew,
    onInsertBelow,
    onCancel,
    onFieldChange,
    handleSave,
    handleDelete
  } = useBonusByDivisionEdit(data, setter, divisions, thisYear);

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle>Bonus by D</CardTitle>
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
                <TableHead className="border border-gray-300 text-center w-28">
                  <div className="flex items-center justify-center gap-1">
                    <span>Actions</span>
                    {editingRowId === null && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="ml-1 h-6 w-6 p-0"
                        onClick={onAddNew}
                        title="Add new row"
                      >
                        <Plus size={16} />
                      </Button>
                    )}
                  </div>
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
