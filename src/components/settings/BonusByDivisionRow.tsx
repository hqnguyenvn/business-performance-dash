
import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { BonusByDivision } from "@/services/bonusByDivisionService";
import { MasterData } from "@/services/masterDataService";

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
      <TableCell>{row.year}</TableCell>
      <TableCell>
        {divisions.find(d => d.id === row.division_id)?.code ?? ""}
      </TableCell>
      <TableCell>{row.bn_bmm}</TableCell>
      <TableCell>{row.notes}</TableCell>
      <TableCell className="p-1 text-center">
        <div className="flex items-center justify-center gap-1">
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
          <Button size="icon" variant="outline" className="h-8 w-8" title="Edit" onClick={() => onEdit(row)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
              className="h-4 w-4">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19.5 3 21l1.5-4L16.5 3.5z"></path>
            </svg>
          </Button>
          <Button
            variant="destructive"
            size="icon"
            className="h-8 w-8"
            title="Delete"
            onClick={() => onDelete(row.id)}
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
  );
};

export default BonusByDivisionRow;
