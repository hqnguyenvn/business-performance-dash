
import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { BonusByDivision } from "@/services/bonusByDivisionService";
import { MasterData } from "@/services/masterDataService";
import { Plus } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { FormattedNumberInput } from "./FormattedNumberInput";

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

  // State local mỗi khi bắt đầu edit một cell
  const [tempValue, setTempValue] = React.useState<any>(null);

  React.useEffect(() => {
    // Khi row id hoặc trường edit đổi, lấy lại giá trị gốc để show vào input
    if (editingCell?.id === row.id) {
      switch (editingCell.field) {
        case "year":
          setTempValue(row.year);
          break;
        case "division_id":
          setTempValue(row.division_id);
          break;
        case "bn_bmm":
          setTempValue(row.bn_bmm);
          break;
        case "notes":
          setTempValue(row.notes ?? "");
          break;
        default:
          setTempValue(null);
      }
    } else {
      setTempValue(null);
    }
  }, [editingCell, row]);

  // Handler chung cho sự kiện blur: save giá trị và thoát edit
  const handleCellBlur = (field: keyof BonusByDivision) => {
    if (editingCell?.id === row.id && editingCell.field === field) {
      // BN_BMM cần parse về number nếu cần
      let value = tempValue;
      if (field === "bn_bmm") {
        value = typeof value === "number" ? value : Number(value);
      }
      saveCell(row.id, field, value);
      onBlurCell();
    }
  };

  // Handler cho nhấn Enter để save (giống Exchange Rate)
  const handleKeyDown = (event: React.KeyboardEvent, field: keyof BonusByDivision) => {
    if (event.key === "Enter") {
      handleCellBlur(field);
    }
    if (event.key === "Escape") {
      onBlurCell();
    }
  };

  return (
    <TableRow className={`group`}>
      <TableCell className="text-center font-medium">{idx + 1}</TableCell>
      <TableCell className="text-center p-1">
        {isEditing("year") ? (
          <input
            type="number"
            className="h-8 w-full border rounded text-center px-2"
            value={tempValue ?? ""}
            onChange={e => setTempValue(Number(e.target.value))}
            onBlur={() => handleCellBlur("year")}
            onKeyDown={e => handleKeyDown(e, "year")}
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
            value={tempValue ?? ""}
            onChange={e => setTempValue(e.target.value)}
            onBlur={() => handleCellBlur("division_id")}
            onKeyDown={e => handleKeyDown(e as any, "division_id")}
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
          <FormattedNumberInput
            value={typeof tempValue === "number" ? tempValue : 0}
            onChange={v => setTempValue(v)}
            onBlur={v => {
              setTempValue(v); // Sync lại nếu có thay đổi ở input
              handleCellBlur("bn_bmm");
            }}
            uniqueKey={row.id + "-bn-bmm"}
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
            value={tempValue ?? ""}
            onChange={e => setTempValue(e.target.value)}
            onBlur={() => handleCellBlur("notes")}
            onKeyDown={e => handleKeyDown(e, "notes")}
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

