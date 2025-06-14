
import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
// Removed Input, Select, Button, icons, AlertDialog as they are now in child components
import { Revenue } from "@/services/revenueService";
import { MasterData } from "@/services/masterDataService";
import EditableCell from "./EditableCell"; // Import the new component

// RevenueRowActions is no longer here

interface RevenueTableRowProps {
  revenue: Revenue;
  index: number; // pageSpecificIndex
  pageIndex: number; // 1-based current page number from searchParams
  pageSize: number; // Items per page from searchParams
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
  // These are used by RevenueTable for the fixed actions column, not directly by this component anymore
  // onInsertRowBelow: (index: number) => void; 
  // onCloneRevenue: (revenue: Revenue, index: number) => void;
  // onOpenDialog: (revenue: Revenue, mode: 'view' | 'edit') => void;
  // onDeleteRevenue: (id: string) => void;
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
}) => {

  const isCellEditing = (field: keyof Revenue) => 
    editingCell?.id === revenue.id && editingCell?.field === field;

  return (
    <TableRow key={revenue.id} className="h-[53px]">
      <TableCell className="font-medium border-r">{(pageIndex - 1) * pageSize + index + 1}</TableCell>
      <TableCell className="border-r">
        <EditableCell
          revenueId={revenue.id}
          field="year"
          initialValue={revenue.year}
          type="number"
          isCurrentlyEditingThisCell={isCellEditing('year')}
          onCellEdit={onCellEdit}
          setEditingCell={setEditingCell}
          getMonthName={getMonthName}
          step="1"
        />
      </TableCell>
      <TableCell className="border-r">
        <EditableCell
          revenueId={revenue.id}
          field="month"
          initialValue={revenue.month}
          type="month"
          isCurrentlyEditingThisCell={isCellEditing('month')}
          onCellEdit={onCellEdit}
          setEditingCell={setEditingCell}
          getMonthName={getMonthName}
        />
      </TableCell>
      <TableCell className="border-r">
        <EditableCell
          revenueId={revenue.id}
          field="customer_id"
          initialValue={revenue.customer_id}
          type="select"
          options={customers}
          isCurrentlyEditingThisCell={isCellEditing('customer_id')}
          onCellEdit={onCellEdit}
          setEditingCell={setEditingCell}
          getMonthName={getMonthName}
        />
      </TableCell>
      <TableCell className="border-r">
        <EditableCell
          revenueId={revenue.id}
          field="company_id"
          initialValue={revenue.company_id}
          type="select"
          options={companies}
          isCurrentlyEditingThisCell={isCellEditing('company_id')}
          onCellEdit={onCellEdit}
          setEditingCell={setEditingCell}
          getMonthName={getMonthName}
        />
      </TableCell>
      <TableCell className="border-r">
        <EditableCell
          revenueId={revenue.id}
          field="division_id"
          initialValue={revenue.division_id}
          type="select"
          options={divisions}
          isCurrentlyEditingThisCell={isCellEditing('division_id')}
          onCellEdit={onCellEdit}
          setEditingCell={setEditingCell}
          getMonthName={getMonthName}
        />
      </TableCell>
      <TableCell className="border-r">
        <EditableCell
          revenueId={revenue.id}
          field="project_id"
          initialValue={revenue.project_id}
          type="select"
          options={projects}
          isCurrentlyEditingThisCell={isCellEditing('project_id')}
          onCellEdit={onCellEdit}
          setEditingCell={setEditingCell}
          getMonthName={getMonthName}
        />
      </TableCell>
      <TableCell className="border-r">
        <EditableCell
          revenueId={revenue.id}
          field="project_name"
          initialValue={revenue.project_name}
          type="text"
          isCurrentlyEditingThisCell={isCellEditing('project_name')}
          onCellEdit={onCellEdit}
          setEditingCell={setEditingCell}
          getMonthName={getMonthName}
          maxLength={50}
        />
      </TableCell>
      <TableCell className="border-r">
        <EditableCell
          revenueId={revenue.id}
          field="project_type_id"
          initialValue={revenue.project_type_id}
          type="select"
          options={projectTypes}
          isCurrentlyEditingThisCell={isCellEditing('project_type_id')}
          onCellEdit={onCellEdit}
          setEditingCell={setEditingCell}
          getMonthName={getMonthName}
        />
      </TableCell>
      <TableCell className="border-r">
        <EditableCell
          revenueId={revenue.id}
          field="resource_id"
          initialValue={revenue.resource_id}
          type="select"
          options={resources}
          isCurrentlyEditingThisCell={isCellEditing('resource_id')}
          onCellEdit={onCellEdit}
          setEditingCell={setEditingCell}
          getMonthName={getMonthName}
        />
      </TableCell>
      <TableCell className="border-r">
        <EditableCell
          revenueId={revenue.id}
          field="currency_id"
          initialValue={revenue.currency_id}
          type="select"
          options={currencies}
          isCurrentlyEditingThisCell={isCellEditing('currency_id')}
          onCellEdit={onCellEdit}
          setEditingCell={setEditingCell}
          getMonthName={getMonthName}
        />
      </TableCell>
      <TableCell className="text-right border-r">
        <EditableCell
          revenueId={revenue.id}
          field="unit_price"
          initialValue={revenue.unit_price}
          type="number"
          isCurrentlyEditingThisCell={isCellEditing('unit_price')}
          onCellEdit={onCellEdit}
          setEditingCell={setEditingCell}
          getMonthName={getMonthName}
          step="1" // Or appropriate step for currency
        />
      </TableCell>
      <TableCell className="text-right border-r">
        <EditableCell
          revenueId={revenue.id}
          field="quantity"
          initialValue={revenue.quantity}
          type="number"
          isCurrentlyEditingThisCell={isCellEditing('quantity')}
          onCellEdit={onCellEdit}
          setEditingCell={setEditingCell}
          getMonthName={getMonthName}
          step="0.1"
        />
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
        <EditableCell
          revenueId={revenue.id}
          field="notes"
          initialValue={revenue.notes}
          type="text"
          isCurrentlyEditingThisCell={isCellEditing('notes')}
          onCellEdit={onCellEdit}
          setEditingCell={setEditingCell}
          getMonthName={getMonthName}
        />
      </TableCell>
    </TableRow>
  );
};

// RevenueRowActions component was moved to its own file
// export const RevenueRowActions ... (removed)

export default RevenueTableRow;

