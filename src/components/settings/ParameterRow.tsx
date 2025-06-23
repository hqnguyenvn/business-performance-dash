import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Parameter } from "@/services/parameterService";
import { formatNumberWithDecimals } from "@/lib/format";
import { FormattedNumberInput } from "./FormattedNumberInput";
import { Plus, Trash2 } from "lucide-react";

interface ParameterRowProps {
  row: Parameter;
  idx: number;
  editingCell: { id: string; field: keyof Parameter } | null;
  onEditCell: (id: string, field: keyof Parameter) => void;
  onBlurCell: () => void;
  saveCell: (id: string, field: keyof Parameter, value: any) => void;
  onDelete: (id: string) => void;
  onAddRowAfter: (id: string) => void;
}

export const ParameterRow: React.FC<ParameterRowProps> = ({
  row, idx, editingCell, onEditCell, onBlurCell, saveCell, onDelete, onAddRowAfter
}) => {
  const isEditing = (field: keyof Parameter) => editingCell?.id === row.id && editingCell.field === field;

  const [tempValue, setTempValue] = React.useState<string | number>('');

  React.useEffect(() => {
    if (editingCell?.id === row.id) {
      setTempValue(row[editingCell.field] ?? '');
    } else {
      setTempValue('');
    }
  }, [editingCell, row]);

  const handleCellSave = (field: keyof Parameter, value: any) => {
    let processedValue = value;

    // Đảm bảo giá trị số được xử lý đúng kiểu
    if (field === 'value') {
      processedValue = typeof value === 'string' ? parseFloat(value) : value;
      // Đảm bảo là số hợp lệ
      if (isNaN(processedValue)) {
        processedValue = 0;
      }
    } else if (field === 'year') {
      processedValue = typeof value === 'string' ? parseInt(value) : value;
      if (isNaN(processedValue)) {
        processedValue = new Date().getFullYear();
      }
    }

    if (processedValue !== row[field]) {
      saveCell(row.id, field, processedValue);
    }
    onBlurCell();
  };

  const handleKeyDown = (event: React.KeyboardEvent, field: keyof Parameter) => {
    if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();

      // Lấy giá trị trực tiếp từ input thay vì dùng tempValue
      const inputElement = event.target as HTMLInputElement;
      let finalValue: string | number = inputElement.value;

      // Xử lý kiểu dữ liệu tương tự như trong handleCellSave
      if (field === 'value') {
        const numValue = parseFloat(String(finalValue));
        finalValue = isNaN(numValue) ? 0 : numValue;
      } else if (field === 'year') {
        const numValue = parseInt(String(finalValue));
        finalValue = isNaN(numValue) ? new Date().getFullYear() : numValue;
      }

      handleCellSave(field, finalValue);

      // Navigate to next cell
      const fields: (keyof Parameter)[] = ['year', 'code', 'value', 'descriptions'];
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

  const handleCellClick = (field: keyof Parameter) => {
    if (!isEditing(field)) {
      onEditCell(row.id, field);
    }
  };

  const handlePaste = (event: React.ClipboardEvent, field: keyof Parameter) => {
    const pasteData = event.clipboardData.getData('text');
    if (field === 'value') {
      const num = parseFloat(pasteData.replace(/[^\d.-]/g, ''));
      if (!isNaN(num)) {
        setTempValue(num);
        handleCellSave(field, num);
      }
    }
  };

  return (
    <TableRow className="group h-[40px]">
      <TableCell className="text-center font-medium border border-gray-300">{idx + 1}</TableCell>

      <TableCell className="text-center p-1 border border-gray-300">
        {isEditing("year") ? (
          <input
            type="number"
            className="h-8 w-full border rounded text-center px-2"
            value={String(tempValue)}
            onChange={e => setTempValue(e.target.value)}
            onBlur={() => handleCellSave("year", tempValue)}
            onKeyDown={e => handleKeyDown(e, "year")}
            autoFocus
          />
        ) : (
          <div className="cursor-pointer h-8 flex items-center justify-center" onClick={() => handleCellClick("year")}>{row.year}</div>
        )}
      </TableCell>

      <TableCell className="text-center p-1 border border-gray-300">
        {isEditing("code") ? (
          <input
            className="h-8 w-full border rounded px-2"
            value={String(tempValue)}
            onChange={e => setTempValue(e.target.value)}
            onBlur={() => handleCellSave("code", tempValue)}
            onKeyDown={e => handleKeyDown(e, "code")}
            autoFocus
          />
        ) : (
          <div className="cursor-pointer h-8 flex items-center justify-center" onClick={() => handleCellClick("code")}>
            {row.code}
          </div>
        )}
      </TableCell>

      <TableCell className="text-right p-1 border border-gray-300">
        {isEditing("value") ? (
          <FormattedNumberInput
            value={typeof tempValue === "number" ? tempValue : 0}
            onChange={v => setTempValue(v)}
            onBlur={v => {
              handleCellSave("value", v);
            }}
            onKeyDown={e => handleKeyDown(e as any, "value")}
            onPaste={e => handlePaste(e, "value")}
            uniqueKey={`${row.id}-value`}
            className="w-full"
            allowDecimals={true}
            decimals={2}
          />
        ) : (
          <div className="cursor-pointer h-8 flex items-center justify-end pr-2" onClick={() => handleCellClick("value")}>
            {formatNumberWithDecimals(row.value, 2)}
          </div>
        )}
      </TableCell>

      <TableCell className="p-1 border border-gray-300">
        {isEditing("descriptions") ? (
          <input
            className="h-8 w-full border rounded px-2"
            value={String(tempValue)}
            onChange={e => setTempValue(e.target.value)}
            onBlur={() => handleCellSave("descriptions", tempValue)}
            onKeyDown={e => handleKeyDown(e, "descriptions")}
            onPaste={e => handlePaste(e, "descriptions")}
            autoFocus
          />
        ) : (
          <div className="cursor-pointer h-8 flex items-center px-2" onClick={() => handleCellClick("descriptions")}>
            {row.descriptions}
          </div>
        )}
      </TableCell>

      <TableCell className="p-1 text-center border border-gray-300">
        <div className="flex items-center justify-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
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
                className="h-8 w-8"
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
                  Are you sure you want to delete this parameter entry? This action cannot be undone.
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

export default ParameterRow;