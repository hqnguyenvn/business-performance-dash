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
}

const BonusByDivisionRow: React.FC<BonusByDivisionRowProps> = ({
  row, idx, divisions, onEdit, onInsertBelow, onDelete
}) => {
  return (
    <TableRow className="hover:bg-gray-50">
      <TableCell className="text-center font-medium">{idx + 1}</TableCell>
      <TableCell className="text-center">{row.year}</TableCell>
      <TableCell className="text-center">
        {divisions.find(d => d.id === row.division_id)?.code ?? ""}
      </TableCell>
      <TableCell className="text-right">{formatNumber(row.bn_bmm)}</TableCell>
      <TableCell className="">{row.notes}</TableCell>
      <TableCell className="p-1 text-center">
        <div className="flex items-center justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            title="Insert new row below"
            onClick={() => onInsertBelow(idx)}
          >
            <Plus size={18} />
          </Button>
          <Button
            size="icon"
            variant="destructive"
            className="h-8 w-8"
            title="Delete"
            onClick={() => onDelete(row.id)}
          >
            <Trash size={18} />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default BonusByDivisionRow;
