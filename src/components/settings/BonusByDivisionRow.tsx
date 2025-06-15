
import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { BonusByDivision } from "@/services/bonusByDivisionService";
import { MasterData } from "@/services/masterDataService";
import { Plus, Trash } from "lucide-react";
import { formatNumber } from "@/lib/format";

interface BonusByDivisionRowProps {
  row: BonusByDivision;
  idx: number;
  divisions: MasterData[];
  onEdit: (row: BonusByDivision) => void;
  onInsertBelow: (idx: number) => void;
  onDelete: (id: string) => void;
  editingRowId: string | null;
}

const BonusByDivisionRow: React.FC<BonusByDivisionRowProps> = ({
  row, idx, divisions, onEdit, onInsertBelow, onDelete, editingRowId
}) => {
  // Hiện Action nếu không có dòng đang edit/new
  const showActions = editingRowId === null;

  return (
    <TableRow
      className={`hover:bg-blue-50 cursor-pointer group`}
      onClick={showActions ? () => onEdit(row) : undefined}
      style={{ opacity: showActions ? 1 : 0.7 }}
      tabIndex={0}
      aria-disabled={!showActions}
      title={showActions ? "Click để sửa" : undefined}
    >
      <TableCell className="text-center font-medium">{idx + 1}</TableCell>
      <TableCell className="text-center">{row.year}</TableCell>
      <TableCell className="text-center">
        {divisions.find(d => d.id === row.division_id)?.code ?? ""}
      </TableCell>
      <TableCell className="text-right">
        {formatNumber(row.bn_bmm)}
      </TableCell>
      <TableCell className="">{row.notes}</TableCell>
      <TableCell className="p-1 text-center">
        {showActions && (
          <div className="flex items-center justify-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              title="Insert new row below"
              onClick={e => {
                e.stopPropagation();
                onInsertBelow(idx);
              }}
            >
              <Plus size={18} />
            </Button>
            <Button
              size="icon"
              variant="destructive"
              className="h-8 w-8"
              title="Delete"
              onClick={e => {
                e.stopPropagation();
                onDelete(row.id);
              }}
            >
              <Trash size={18} />
            </Button>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
};

export default BonusByDivisionRow;
