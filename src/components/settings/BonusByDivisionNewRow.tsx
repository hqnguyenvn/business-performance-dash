
import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { MasterData } from "@/services/masterDataService";

interface NewRowProps {
  newRowCache: any;
  idx: number | null; // null nếu add ở đầu
  divisions: MasterData[];
  editingCell: { id: string; field: string } | null;
  onFieldChange: (field: string, val: any) => void;
  onSave: () => void;
  onCancel: () => void;
  thisYear: number;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

const BonusByDivisionNewRow: React.FC<NewRowProps> = ({
  newRowCache,
  idx,
  divisions,
  editingCell,
  onFieldChange,
  onSave,
  onCancel,
  thisYear,
  onKeyDown,
}) => (
  <TableRow>
    <TableCell className="text-center font-medium">{idx !== null && idx >= 0 ? idx + 2 : 1}</TableCell>
    <TableCell className="p-1 text-center">
      <input
        type="number"
        className="h-8 w-full border rounded text-center px-2"
        value={newRowCache.year ?? thisYear}
        onChange={e => onFieldChange("year", Number(e.target.value))}
        autoFocus={editingCell?.id === "new" && editingCell.field === "year"}
        onKeyDown={onKeyDown}
      />
    </TableCell>
    <TableCell className="p-1 text-center">
      <select
        className="h-8 w-full border rounded px-2"
        value={newRowCache.division_id ?? ''}
        onChange={e => onFieldChange("division_id", e.target.value)}
        onKeyDown={onKeyDown}
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
        value={
          (typeof newRowCache.bn_bmm === 'number' && !isNaN(newRowCache.bn_bmm))
            ? newRowCache.bn_bmm.toLocaleString()
            : ''
        }
        onChange={e => {
          const val = e.target.value.replace(/,/g, "");
          onFieldChange("bn_bmm", Number(val));
        }}
        onKeyDown={onKeyDown}
      />
    </TableCell>
    <TableCell className="p-1">
      <input
        className="h-8 w-full border rounded px-2"
        value={newRowCache.notes ?? ""}
        onChange={e => onFieldChange("notes", e.target.value)}
        onKeyDown={onKeyDown}
      />
    </TableCell>
    <TableCell className="p-1 text-center">
      <div className="flex items-center justify-center gap-2">
        <Button size="icon" variant="outline" className="h-8 w-8" title="Save" onClick={onSave}>
          <Plus size={18} />
        </Button>
        <Button variant="destructive" size="icon" className="h-8 w-8" title="Cancel" onClick={onCancel}>
          <svg width="18" height="18" stroke="currentColor" fill="none" strokeWidth={2}><path d="M3 6h12M8 6v8m4-8v8M9 2h2a2 2 0 012 2v0H7v0a2 2 0 012-2z" /><path d="M5 6v8a2 2 0 002 2h6a2 2 0 002-2V6" /></svg>
        </Button>
      </div>
    </TableCell>
  </TableRow>
);

export default BonusByDivisionNewRow;
