import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Revenue } from "@/services/revenueService";
import { MasterData } from "@/services/masterDataService";
import RevenueTableCell, { CellConfig, RowContext } from './RevenueTableCell';
import RevenueRowActions from "./RevenueRowActions";

interface RevenueTableRowProps {
  revenue: Revenue;
  index: number; // pageSpecificIndex (0-based)
  pageIndex: number; // 1-based current page number from searchParams
  pageSize: number | 'all'; // Items per page from searchParams
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
  onInsertRowBelow: () => void;
  onCloneRevenue: () => void;
  onOpenDialog: (revenue: Revenue, mode: 'view' | 'edit') => void;
  onDeleteRevenue: (id: string) => void;
}

const RevenueTableRow: React.FC<RevenueTableRowProps> = ({
  revenue,
  index, // This is pageSpecificIndex
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

  const isCurrentlyEditing = (field: keyof Revenue) => 
    editingCell?.id === revenue.id && editingCell?.field === field;

  const rowContext: RowContext = {
    pageSpecificIndex: index,
    pageIndex,
    pageSize: typeof pageSize === 'number' ? pageSize : 0, // For compatibility with RowContext
    getMonthName,
    calculateVNDRevenue,
  };

  const cellConfigs: CellConfig[] = [
    {
      type: 'index',
      valueGetter: (_rev, ctx) => {
        if (pageSize === 'all') {
          return ctx.pageSpecificIndex + 1;
        }
        return (ctx.pageIndex - 1) * (typeof pageSize === 'number' ? pageSize : 5) + ctx.pageSpecificIndex + 1;
      },
      cellClassName: "font-medium",
    },
    { field: 'year', type: 'number', step: "1" },
    { field: 'month', type: 'month' },
    { field: 'customer_id', type: 'select', options: customers },
    { field: 'company_id', type: 'select', options: companies },
    { field: 'division_id', type: 'select', options: divisions },
    { field: 'project_id', type: 'select', options: projects },
    { field: 'project_name', type: 'text', maxLength: 50 },
    { field: 'project_type_id', type: 'select', options: projectTypes },
    { field: 'resource_id', type: 'select', options: resources },
    { field: 'currency_id', type: 'select', options: currencies },
    {
      field: 'unit_price',
      type: 'number',
      step: "1",
      cellClassName: "text-right",
    },
    {
      field: 'quantity',
      type: 'number',
      step: "0.1",
      cellClassName: "text-right",
    },
    {
      field: 'original_amount',
      type: 'static',
      valueGetter: (rev) => (rev.original_amount || 0).toLocaleString(),
      cellClassName: "text-right",
    },
    {
      field: 'vnd_revenue',
      type: 'static',
      valueGetter: (rev, ctx) => ctx.calculateVNDRevenue ? ctx.calculateVNDRevenue(rev).toLocaleString() : 'N/A',
      cellClassName: "text-right",
    },
    { field: 'notes', type: 'text' },
  ];

  return (
    <TableRow key={revenue.id} className="h-[53px]">
      {cellConfigs.map((config, idx) => (
        <RevenueTableCell
          key={config.field ? `${revenue.id}-${config.field}` : `${revenue.id}-col-${idx}`}
          revenue={revenue}
          config={config}
          rowContext={rowContext}
          isCurrentlyEditingThisCell={!!config.field && isCurrentlyEditing(config.field)}
          onCellEdit={onCellEdit}
          setEditingCell={setEditingCell}
        />
      ))}
      
      {/* Actions column as part of the main table */}
      <TableCell className="border-r p-0">
        <div className="h-full flex items-center justify-center">
          <RevenueRowActions
            revenue={revenue}
            index={index}
            onInsertRowBelow={onInsertRowBelow}
            onCloneRevenue={onCloneRevenue}
            onOpenDialog={onOpenDialog}
            onDeleteRevenue={onDeleteRevenue}
          />
        </div>
      </TableCell>
    </TableRow>
  );
};

export default RevenueTableRow;
