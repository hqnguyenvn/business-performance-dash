
import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { BonusByDivision } from "@/services/bonusByDivisionService";
import { MasterData } from "@/services/masterDataService";
import { Plus } from "lucide-react";
import { formatNumber } from "@/lib/format";

interface BonusByDivisionRowProps {
  row: BonusByDivision;
  idx: number;
  divisions: MasterData[];
  editingCell: { id: string; field: keyof BonusByDivision } | null;
  onEditCell: (id: string, field: keyof BonusByDivision) => void;
  onBlurCell: () => void;
  saveCell: (id: string, field: keyof BonusByDivision, value: string | number) => void;
  onInsertBelow: (idx: number) => void;
  onDelete: (id: string) => void;
}

export const BonusByDivisionRow: React.FC<BonusByDivisionRowProps> = ({
  row, idx, divisions, editingCell, onEditCell, onBlurCell, saveCell, onInsertBelow, onDelete
}) => {
  const isEditing = (field: keyof BonusByDivision) => editingCell?.id === row.id && editingCell.field === field;

  // State tạm cho từng cell editing
  const [editYear, setEditYear] = React.useState(row.year);
  const [editDivision, setEditDivision] = React.useState(row.division_id);
  const [editBnm, setEditBnm] = React.useState(row.bn_bmm);
  const [editNotes, setEditNotes] = React.useState(row.notes ?? "");

  // Reset khi sang row khác
  React.useEffect(() => {
    setEditYear(row.year);
    setEditDivision(row.division_id);
    setEditBnm(row.bn_bmm);
    setEditNotes(row.notes ?? "");
    // eslint-disable-next-line
  }, [row.id]);

  return (
    <TableRow className={`group`}>
      <TableCell className="text-center font-medium">{idx + 1}</TableCell>

      <TableCell className="text-center p-1">
        {isEditing("year") ? (
          <input
            type="number"
            className="h-8 w-full border rounded text-center px-2"
            value={editYear}
            onChange={e => setEditYear(Number(e.target.value))}
            onBlur={(e) => { saveCell(row.id, "year", editYear); onBlurCell(); }}
            autoFocus
          />
        ) : (
          <div className="cursor-pointer" tabIndex={0} onClick={() => onEditCell(row.id, "year")}>{row.year}</div>
        )}
      </TableCell>
      <TableCell className="text-center p-1">
        {isEditing("division_id") ? (
          <select
            className="h-8 w-full border rounded px-2"
            value={editDivision}
            onChange={e => setEditDivision(e.target.value)}
            onBlur={() => { saveCell(row.id, "division_id", editDivision); onBlurCell(); }}
            autoFocus
          >
            {divisions.map(d => (
              <option key={d.id} value={d.id}>{d.code}</option>
            ))}
          </select>
        ) : (
          <div className="cursor-pointer" tabIndex={0} onClick={() => onEditCell(row.id, "division_id")}>
            {divisions.find(d => d.id === row.division_id)?.code ?? ""}
          </div>
        )}
      </TableCell>
      <TableCell className="text-right p-1">
        {isEditing("bn_bmm") ? (
          <input
            type="text"
            inputMode="decimal"
            className="h-8 w-full border rounded text-right px-2"
            value={editBnm}
            onChange={e => setEditBnm(Number(e.target.value.replace(/,/g, '')))}
            onBlur={() => { saveCell(row.id, "bn_bmm", editBnm); onBlurCell(); }}
            autoFocus
          />
        ) : (
          <div className="cursor-pointer" tabIndex={0} onClick={() => onEditCell(row.id, "bn_bmm")}>
            {formatNumber(row.bn_bmm)}
          </div>
        )}
      </TableCell>
      <TableCell className="p-1">
        {isEditing("notes") ? (
          <input
            className="h-8 w-full border rounded px-2"
            value={editNotes}
            onChange={e => setEditNotes(e.target.value)}
            onBlur={() => { saveCell(row.id, "notes", editNotes); onBlurCell(); }}
            autoFocus
          />
        ) : (
          <div className="cursor-pointer" tabIndex={0} onClick={() => onEditCell(row.id, "notes")}>
            {row.notes}
          </div>
        )}
      </TableCell>
      <TableCell className="p-1 text-center">
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
            {/* trash-2 icon */}
            <svg width="18" height="18" stroke="currentColor" fill="none" strokeWidth={2}><path d="M3 6h12M8 6v8m4-8v8M9 2h2a2 2 0 012 2v0H7v0a2 2 0 012-2z" /><path d="M5 6v8a2 2 0 002 2h6a2 2 0 002-2V6" /></svg>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default BonusByDivisionRow;
