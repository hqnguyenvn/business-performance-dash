
import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { BonusByDivision } from "@/services/bonusByDivisionService";
import { MasterData } from "@/services/masterDataService";
import { formatNumber } from "@/lib/format";
import { FormattedNumberInput } from "./FormattedNumberInput";
import { Plus } from "lucide-react";

interface BonusByDivisionRowProps {
  row: BonusByDivision;
  idx: number;
  divisions: MasterData[];
  editingCell: { id: string; field: keyof BonusByDivision } | null;
  onEditCell: (id: string, field: keyof BonusByDivision) => void;
  onBlurCell: () => void;
  saveCell: (id: string, field: keyof BonusByDivision, value: any) => void;
  onDelete: (id: string) => void;
  onAddRowAfter: (id: string) => void;
}

export const BonusByDivisionRow: React.FC<BonusByDivisionRowProps> = ({
  row, idx, divisions, editingCell, onEditCell, onBlurCell, saveCell, onDelete, onAddRowAfter
}) => {
  const isEditing = (field: keyof BonusByDivision) => editingCell?.id === row.id && editingCell.field === field;

  const [tempValue, setTempValue] = React.useState<any>(null);

  React.useEffect(() => {
    if (editingCell?.id === row.id) {
      setTempValue(row[editingCell.field] ?? '');
    } else {
      setTempValue(null);
    }
  }, [editingCell, row]);

  const handleCellSave = (field: keyof BonusByDivision, value: any) => {
    if (value !== row[field]) {
      saveCell(row.id, field, value);
    }
    onBlurCell();
  };
  
  const handleKeyDown = (event: React.KeyboardEvent, field: keyof BonusByDivision) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleCellSave(field, tempValue);
    }
    if (event.key === "Escape") {
      onBlurCell();
    }
  };
  
  const handleCellClick = (field: keyof BonusByDivision) => {
    if (!isEditing(field)) {
      onEditCell(row.id, field);
    }
  };

  return (
    <TableRow className={`group`}>
      <TableCell className="text-center font-medium border border-gray-300">{idx + 1}</TableCell>
      
      <TableCell className="text-center p-1 border border-gray-300">
        {isEditing("year") ? (
          <input
            type="number"
            className="h-8 w-full border rounded text-center px-2"
            value={tempValue ?? ""}
            onChange={e => setTempValue(Number(e.target.value))}
            onBlur={() => handleCellSave("year", Number(tempValue))}
            onKeyDown={e => handleKeyDown(e, "year")}
            autoFocus
          />
        ) : (
          <div className="cursor-pointer h-8 flex items-center justify-center" onClick={() => handleCellClick("year")}>{row.year}</div>
        )}
      </TableCell>

      <TableCell className="text-center p-1 border border-gray-300">
        {isEditing("division_id") ? (
          <select
            className="h-8 w-full border rounded px-2"
            value={tempValue ?? ""}
            onChange={e => setTempValue(e.target.value)}
            onBlur={() => handleCellSave("division_id", tempValue)}
            onKeyDown={e => handleKeyDown(e as any, "division_id")}
            autoFocus
          >
            {divisions.map(d => (
              <option key={d.id} value={d.id}>{d.code}</option>
            ))}
          </select>
        ) : (
          <div className="cursor-pointer h-8 flex items-center justify-center" onClick={() => handleCellClick("division_id")}>
            {divisions.find(d => d.id === row.division_id)?.code ?? ""}
          </div>
        )}
      </TableCell>

      <TableCell className="text-right p-1 border border-gray-300">
        {isEditing("bn_bmm") ? (
          <FormattedNumberInput
            value={typeof tempValue === "number" ? tempValue : 0}
            onChange={v => setTempValue(v)}
            onBlur={v => {
              handleCellSave("bn_bmm", v);
            }}
            uniqueKey={`${row.id}-bn-bmm`}
            className="w-full"
          />
        ) : (
          <div className="cursor-pointer h-8 flex items-center justify-end pr-2" onClick={() => handleCellClick("bn_bmm")}>
            {formatNumber(row.bn_bmm)}
          </div>
        )}
      </TableCell>
      
      <TableCell className="p-1 border border-gray-300">
        {isEditing("notes") ? (
          <input
            className="h-8 w-full border rounded px-2"
            value={tempValue ?? ""}
            onChange={e => setTempValue(e.target.value)}
            onBlur={() => handleCellSave("notes", tempValue)}
            onKeyDown={e => handleKeyDown(e, "notes")}
            autoFocus
          />
        ) : (
          <div className="cursor-pointer h-8 flex items-center px-2" onClick={() => handleCellClick("notes")}>
            {row.notes}
          </div>
        )}
      </TableCell>
      
      <TableCell className="p-1 text-center border border-gray-300">
        <div className="flex items-center justify-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            title="Add row after"
            onClick={e => {
              e.stopPropagation();
              onAddRowAfter(row.id);
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
            <svg width="18" height="18" stroke="currentColor" fill="none" strokeWidth={2}><path d="M3 6h12M8 6v8m4-8v8M9 2h2a2 2 0 012 2v0H7v0a2 2 0 012-2z" /><path d="M5 6v8a2 2 0 002 2h6a2 2 0 002-2V6" /></svg>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default BonusByDivisionRow;
