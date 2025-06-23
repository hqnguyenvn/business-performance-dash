import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { BonusByDivision } from "@/services/bonusByDivisionService";
import { MasterData } from "@/services/masterDataService";
import { formatNumberWithDecimals } from "@/lib/format";
import { FormattedNumberInput } from "./FormattedNumberInput";
import { Plus, Trash2 } from "lucide-react";

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
    if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      handleCellSave(field, tempValue);

      // Navigate to next cell
      const fields: (keyof BonusByDivision)[] = ['year', 'division_id', 'bn_bmm', 'notes'];
      const currentIndex = fields.indexOf(field);
      if (currentIndex < fields.length - 1) {
        const nextField = fields[currentIndex + 1];
        setTimeout(() => onEditCell(row.id, nextField), 50);
      }
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

  const handlePaste = (event: React.ClipboardEvent, field: keyof BonusByDivision) => {
    const pasteData = event.clipboardData.getData('text');
    if (field === 'bn_bmm') {
      const num = parseFloat(pasteData.replace(/[^\d.-]/g, ''));
      if (!isNaN(num)) {
        setTempValue(num);
        handleCellSave(field, num);
      }
    }
  };

  return (
    <TableRow className="group h-[53px]">
      <TableCell className="text-center font-medium border border-gray-300 p-1">{idx + 1}</TableCell>

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
          <Select
            value={tempValue ?? ""}
            onValueChange={value => {
              setTempValue(value);
              handleCellSave("division_id", value);
            }}
            open={true}
          >
            <SelectTrigger className="h-8 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {divisions.map(d => (
                <SelectItem key={d.id} value={d.id}>{d.code}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            onKeyDown={e => handleKeyDown(e as any, "bn_bmm")}
            onPaste={e => handlePaste(e, "bn_bmm")}
            uniqueKey={`${row.id}-bn-bmm`}
            className="w-full"
            allowDecimals={true}
            decimals={2}
          />
        ) : (
          <div className="cursor-pointer h-8 flex items-center justify-end pr-2" onClick={() => handleCellClick("bn_bmm")}>
            {formatNumberWithDecimals(row.bn_bmm, 2)}
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
            onPaste={e => handlePaste(e, "notes")}
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
            variant="outline"
            className="h-6 w-6"
            title="Add row after"
            onClick={e => {
              e.stopPropagation();
              onAddRowAfter(row.id);
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="icon"
                variant="destructive"
                className="h-6 w-6"
                title="Delete"
                onClick={e => e.stopPropagation()}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this bonus entry? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(row.id)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default BonusByDivisionRow;