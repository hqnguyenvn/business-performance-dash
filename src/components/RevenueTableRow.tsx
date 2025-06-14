import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Copy, Eye, Edit, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Revenue } from "@/services/revenueService";
import { MasterData } from "@/services/masterDataService";

interface RevenueTableRowProps {
  revenue: Revenue;
  index: number;
  pageIndex: number;
  pageSize: number;
  editingCell: { id: string; field: string } | null;
  customers: MasterData[];
  companies: MasterData[];
  divisions: MasterData[];
  projects: MasterData[];
  projectTypes: MasterData[];
  resources: MasterData[];
  currencies: MasterData[];
  getMonthName: (monthNumber: number) => string;
  calculateVNDRevenue: (revenue: Revenue) => number;
  onCellEdit: (id: string, field: keyof Revenue, value: any) => void;
  setEditingCell: (cell: { id: string; field: string } | null) => void;
  onInsertRowBelow: (index: number) => void;
  onCloneRevenue: (revenue: Revenue, index: number) => void;
  onOpenDialog: (revenue: Revenue, mode: 'view' | 'edit') => void;
  onDeleteRevenue: (id: string) => void;
}

const RevenueTableRow: React.FC<RevenueTableRowProps> = ({
  revenue,
  index,
  pageIndex,
  pageSize,
  editingCell,
  customers,
  companies,
  divisions,
  projects,
  projectTypes,
  resources,
  currencies,
  getMonthName,
  calculateVNDRevenue,
  onCellEdit,
  setEditingCell,
  onInsertRowBelow,
  onCloneRevenue,
  onOpenDialog,
  onDeleteRevenue,
}) => {
  const renderEditableCell = (field: keyof Revenue, value: any, type: 'text' | 'number' | 'select' | 'month', options?: any[]) => {
    const isEditing = editingCell?.id === revenue.id && editingCell?.field === field;
    
    if (isEditing && type === 'select' && options) {
      return (
        <Select 
          value={value || ''} 
          onValueChange={(newValue) => onCellEdit(revenue.id, field, newValue)}
          onOpenChange={(open) => {
            if (!open) setEditingCell(null);
          }}
          open={true}
        >
          <SelectTrigger className="w-full h-8">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (isEditing && type === 'month') {
      const monthOptions = [
        { value: 1, label: 'Jan' }, { value: 2, label: 'Feb' }, { value: 3, label: 'Mar' },
        { value: 4, label: 'Apr' }, { value: 5, label: 'May' }, { value: 6, label: 'Jun' },
        { value: 7, label: 'Jul' }, { value: 8, label: 'Aug' }, { value: 9, label: 'Sep' },
        { value: 10, label: 'Oct' }, { value: 11, label: 'Nov' }, { value: 12, label: 'Dec' }
      ];
      
      return (
        <Select 
          value={value?.toString() || ''} 
          onValueChange={(newValue) => onCellEdit(revenue.id, field, parseInt(newValue))}
          onOpenChange={(open) => {
            if (!open) setEditingCell(null);
          }}
          open={true}
        >
          <SelectTrigger className="w-full h-8">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((option) => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    
    if (isEditing && type === 'number') {
      return (
        <Input
          type="number"
          step={field === 'quantity' ? "0.1" : "1"}
          value={value || 0}
          onChange={(e) => {
            const newValue = parseFloat(e.target.value) || 0;
            onCellEdit(revenue.id, field, newValue);
          }}
          onBlur={(e) => {
            const newValue = parseFloat(e.target.value) || 0;
            onCellEdit(revenue.id, field, newValue);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const newValue = parseFloat((e.target as HTMLInputElement).value) || 0;
              onCellEdit(revenue.id, field, newValue);
            }
          }}
          className="w-full h-8 text-right"
          autoFocus
        />
      );
    }
    
    if (isEditing && type === 'text') {
      return (
        <Input
          value={value || ''}
          onChange={(e) => onCellEdit(revenue.id, field, e.target.value)}
          onBlur={(e) => onCellEdit(revenue.id, field, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onCellEdit(revenue.id, field, (e.target as HTMLInputElement).value);
            }
          }}
          className="w-full h-8"
          maxLength={field === 'project_name' ? 50 : undefined}
          autoFocus
        />
      );
    }
    
    // Display mode
    const displayValue = () => {
      if (type === 'select' && options) {
        const option = options.find(opt => opt.id === value);
        return option?.code || '';
      }
      if (field === 'year') {
        return value?.toString() || '';
      }
      if (field === 'month') {
        return getMonthName(value);
      }
      if (type === 'number') {
        if (field === 'quantity') {
          return (value || 0).toFixed(1);
        }
        return (value || 0).toLocaleString();
      }
      return value || '';
    };
    
    const alignmentClass = (type === 'number' || field === 'unit_price' || field === 'quantity') ? 'text-right' : '';
    
    return (
      <div 
        className={`w-full h-8 px-2 py-1 cursor-pointer hover:bg-gray-50 flex items-center ${alignmentClass}`}
        onClick={() => setEditingCell({ id: revenue.id, field })}
      >
        {displayValue()}
      </div>
    );
  };

  return (
    <TableRow key={revenue.id}>
      <TableCell className="font-medium border-r">{(pageIndex - 1) * pageSize + index + 1}</TableCell>
      <TableCell className="border-r">
        {renderEditableCell('year', revenue.year, 'number')}
      </TableCell>
      <TableCell className="border-r">
        {renderEditableCell('month', revenue.month, 'month')}
      </TableCell>
      <TableCell className="border-r">
        {renderEditableCell('customer_id', revenue.customer_id, 'select', customers)}
      </TableCell>
      <TableCell className="border-r">
        {renderEditableCell('company_id', revenue.company_id, 'select', companies)}
      </TableCell>
      <TableCell className="border-r">
        {renderEditableCell('division_id', revenue.division_id, 'select', divisions)}
      </TableCell>
      <TableCell className="border-r">
        {renderEditableCell('project_id', revenue.project_id, 'select', projects)}
      </TableCell>
      <TableCell className="border-r">
        {renderEditableCell('project_name', revenue.project_name, 'text')}
      </TableCell>
      <TableCell className="border-r">
        {renderEditableCell('project_type_id', revenue.project_type_id, 'select', projectTypes)}
      </TableCell>
      <TableCell className="border-r">
        {renderEditableCell('resource_id', revenue.resource_id, 'select', resources)}
      </TableCell>
      <TableCell className="border-r">
        {renderEditableCell('currency_id', revenue.currency_id, 'select', currencies)}
      </TableCell>
      <TableCell className="text-right border-r">
        {renderEditableCell('unit_price', revenue.unit_price, 'number')}
      </TableCell>
      <TableCell className="text-right border-r">
        {renderEditableCell('quantity', revenue.quantity, 'number')}
      </TableCell>
      <TableCell className="text-right border-r">
        <div className="px-2 py-1">
          {(revenue.original_amount || 0).toLocaleString()}
        </div>
      </TableCell>
      <TableCell className="text-right border-r">
        <div className="px-2 py-1">
          {calculateVNDRevenue(revenue).toLocaleString()}
        </div>
      </TableCell>
      <TableCell className="border-r">
        {renderEditableCell('notes', revenue.notes, 'text')}
      </TableCell>
    </TableRow>
  );
};

// Create separate component for action buttons
export const RevenueRowActions: React.FC<{
  revenue: Revenue;
  index: number;
  onInsertRowBelow: (index: number) => void;
  onCloneRevenue: (revenue: Revenue, index: number) => void;
  onOpenDialog: (revenue: Revenue, mode: 'view' | 'edit') => void;
  onDeleteRevenue: (id: string) => void;
}> = ({
  revenue,
  index,
  onInsertRowBelow,
  onCloneRevenue,
  onOpenDialog,
  onDeleteRevenue,
}) => {
  return (
    <div className="flex justify-center gap-1">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onInsertRowBelow(index)}
        title="Add"
        className="h-8 w-8"
      >
        <Plus className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onCloneRevenue(revenue, index)}
        title="Clone"
        className="h-8 w-8"
      >
        <Copy className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onOpenDialog(revenue, 'view')}
        title="View"
        className="h-8 w-8"
      >
        <Eye className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onOpenDialog(revenue, 'edit')}
        title="Edit"
        className="h-8 w-8"
      >
        <Edit className="h-4 w-4" />
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="destructive"
            size="icon"
            title="Delete"
            className="h-8 w-8"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this revenue record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDeleteRevenue(revenue.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RevenueTableRow;
