import React from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Revenue } from "@/services/revenueService"; // For keyof Revenue
import { MasterData } from "@/services/masterDataService"; // For options

interface EditableCellProps {
  revenueId: string;
  field: keyof Revenue;
  initialValue: any;
  type: 'text' | 'number' | 'select' | 'month';
  options?: MasterData[];
  isCurrentlyEditingThisCell: boolean;
  onCellEdit: (id: string, field: keyof Revenue, value: any) => void;
  setEditingCell: (cell: { id: string; field: string } | null) => void;
  getMonthName: (monthNumber: number) => string;
  maxLength?: number;
  step?: string; // Explicitly pass step from parent
}

const EditableCell: React.FC<EditableCellProps> = ({
  revenueId,
  field,
  initialValue,
  type,
  options,
  isCurrentlyEditingThisCell,
  onCellEdit,
  setEditingCell,
  getMonthName,
  maxLength,
  step,
}) => {
  // Edit mode rendering
  if (isCurrentlyEditingThisCell) {
    if (type === 'select' && options) {
      return (
        <Select
          value={initialValue || ''}
          onValueChange={(newValue) => onCellEdit(revenueId, field, newValue)}
          onOpenChange={(open) => {
            if (!open) setEditingCell(null);
          }}
          open={true} // Keep select open while editing
        >
          <SelectTrigger className="w-full h-full text-sm" autoFocus>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.id} value={option.id} className="text-sm">
                {option.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (type === 'month') {
      const monthOptions = [
        { value: 1, label: 'Jan' }, { value: 2, label: 'Feb' }, { value: 3, label: 'Mar' },
        { value: 4, label: 'Apr' }, { value: 5, label: 'May' }, { value: 6, label: 'Jun' },
        { value: 7, label: 'Jul' }, { value: 8, label: 'Aug' }, { value: 9, label: 'Sep' },
        { value: 10, label: 'Oct' }, { value: 11, label: 'Nov' }, { value: 12, label: 'Dec' }
      ];
      return (
        <Select
          value={initialValue?.toString() || ''}
          onValueChange={(newValue) => onCellEdit(revenueId, field, parseInt(newValue))}
          onOpenChange={(open) => {
            if (!open) setEditingCell(null);
          }}
          open={true}
        >
          <SelectTrigger className="w-full h-full text-sm" autoFocus>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((option) => (
              <SelectItem key={option.value} value={option.value.toString()} className="text-sm">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (type === 'number') {
      return (
        <Input
          type="number"
          step={step} // Use step passed from parent
          value={initialValue || 0}
          onChange={(e) => {
            const newValue = parseFloat(e.target.value) || 0;
            onCellEdit(revenueId, field, newValue);
          }}
          onBlur={(e) => { 
            const newValue = parseFloat(e.target.value) || 0;
            onCellEdit(revenueId, field, newValue);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const newValue = parseFloat((e.target as HTMLInputElement).value) || 0;
              onCellEdit(revenueId, field, newValue);
              setEditingCell(null); 
            } else if (e.key === 'Escape') {
              setEditingCell(null); 
            }
          }}
          className="w-full h-full text-right text-sm px-2 py-1"
          autoFocus
        />
      );
    }

    if (type === 'text') {
      return (
        <Input
          value={initialValue || ''}
          onChange={(e) => onCellEdit(revenueId, field, e.target.value)}
          onBlur={(e) => { 
            onCellEdit(revenueId, field, e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onCellEdit(revenueId, field, (e.target as HTMLInputElement).value);
              setEditingCell(null); 
            } else if (e.key === 'Escape') {
              setEditingCell(null); 
            }
          }}
          className="w-full h-full text-sm px-2 py-1"
          maxLength={maxLength}
          autoFocus
        />
      );
    }
  }

  // Display mode rendering
  const displayValue = () => {
    if (type === 'select' && options) {
      const option = options.find(opt => opt.id === initialValue);
      return option?.code || '';
    }
    if (field === 'year') {
      return initialValue?.toString() || '';
    }
    if (field === 'month') {
      return getMonthName(initialValue as number);
    }
    if (type === 'number') {
      if (field === 'quantity') {
        // Ensure initialValue is treated as number for toFixed
        const numValue = typeof initialValue === 'number' ? initialValue : parseFloat(initialValue);
        return (numValue || 0).toFixed(1);
      }
      // Ensure initialValue is treated as number for toLocaleString
      const numValue = typeof initialValue === 'number' ? initialValue : parseFloat(initialValue);
      return (numValue || 0).toLocaleString();
    }
    return initialValue || '';
  };

  const alignmentClass = (type === 'number' || field === 'unit_price' || field === 'quantity' || field === 'original_amount' || field === 'vnd_revenue') ? 'justify-end' : 'justify-start';

  return (
    <div
      className={`w-full h-full px-2 py-1 cursor-pointer hover:bg-gray-100 flex items-center ${alignmentClass} text-sm`}
      onClick={() => {
        setEditingCell({ id: revenueId, field });
      }}
    >
      {displayValue() || (type === 'select' ? <span className="text-muted-foreground italic">Select...</span> : '')}
    </div>
  );
};

export default EditableCell;
