
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
  setEditingCell: (cell: { id: string; field: string } | null) => void;
  customers: MasterData[];
  companies: MasterData[];
  divisions: MasterData[];
  projects: MasterData[];
  projectTypes: MasterData[];
  resources: MasterData[];
  currencies: MasterData[];
  getMonthName: (monthNumber: number) => string;
  calculateVNDRevenue: (revenue: Partial<Revenue>) => number; // Changed to Partial<Revenue>
  onCellEdit: (id: string, field: keyof Revenue, value: any) => void;
  onInsertRowBelow: () => void;
  onCloneRevenue: () => void;
  onOpenDialog: (revenue: Revenue, mode: 'view' | 'edit') => void;
  onDeleteRevenue: (id: string) => void;
  isTempRow?: boolean;
  onCommitTempRow?: () => void;
}

// Fix: always provide options for select fields.
function getCellConfigs(
  customers: MasterData[], companies: MasterData[], divisions: MasterData[], projects: MasterData[],
  projectTypes: MasterData[], resources: MasterData[], currencies: MasterData[],
  getMonthName: (monthNumber: number) => string,
  calculateVNDRevenue: (revenue: Partial<Revenue>) => number, // Changed to Partial<Revenue>
  pageSize: number | 'all',
  isTempRow?: boolean // isTempRow is still useful for other logic like button display
): CellConfig[] {
  return [
    {
      type: 'index',
      valueGetter: (_rev, ctx) => {
        if (pageSize === 'all') return ctx.pageSpecificIndex + 1;
        return (ctx.pageIndex - 1) * (typeof pageSize === 'number' ? pageSize : 5) + ctx.pageSpecificIndex + 1;
      },
      cellClassName: "font-medium",
    },
    { field: 'year', type: 'number', step: "1" },
    { field: 'month', type: 'month' },
    {
      field: 'customer_id',
      type: 'select',
      options: customers ?? [],
    },
    {
      field: 'company_id',
      type: 'select',
      options: companies ?? [],
    },
    {
      field: 'division_id',
      type: 'select',
      options: divisions ?? [],
    },
    {
      field: 'project_id',
      type: 'select',
      options: projects ?? [],
    },
    { field: 'project_name', type: 'text', maxLength: 50 },
    {
      field: 'project_type_id',
      type: 'select',
      options: projectTypes ?? [],
    },
    {
      field: 'resource_id',
      type: 'select',
      options: resources ?? [],
    },
    {
      field: 'currency_id',
      type: 'select',
      options: currencies ?? [],
    },
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
      type: 'static', // Always static as it's calculated
      valueGetter: (rev) => (rev.original_amount || 0).toLocaleString(),
      cellClassName: "text-right",
    },
    {
      field: 'vnd_revenue',
      type: 'static', // Always static as it's calculated
      valueGetter: (rev, ctx) => ctx.calculateVNDRevenue ? ctx.calculateVNDRevenue(rev).toLocaleString() : 'N/A',
      cellClassName: "text-right",
    },
    { field: 'notes', type: 'text' },
  ];
}

const RevenueTableRow: React.FC<RevenueTableRowProps> = ({
  revenue,
  index,
  pageIndex,
  pageSize,
  editingCell,
  setEditingCell,
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
  onInsertRowBelow,
  onCloneRevenue,
  onOpenDialog,
  onDeleteRevenue,
  isTempRow,
  onCommitTempRow,
}) => {
  const isCurrentlyEditing = (field: keyof Revenue) =>
    editingCell?.id === revenue.id && editingCell?.field === field;

  const rowContext: RowContext = {
    pageSpecificIndex: index,
    pageIndex,
    pageSize: typeof pageSize === 'number' ? pageSize : 0, // Default to 0 if 'all' for simplicity here
    getMonthName,
    calculateVNDRevenue,
  };

  const cellConfigs = getCellConfigs(
    customers ?? [], companies ?? [], divisions ?? [], projects ?? [],
    projectTypes ?? [], resources ?? [], currencies ?? [],
    getMonthName, calculateVNDRevenue, pageSize, isTempRow
  );

  return (
    <TableRow key={revenue.id} className={"h-[53px] " + (isTempRow ? "bg-yellow-50" : "")}>
      {cellConfigs.map((config, idx) => (
        <RevenueTableCell
          key={config.field ? `${revenue.id}-${config.field}` : `${revenue.id}-col-${idx}`}
          revenue={revenue}
          config={config}
          rowContext={rowContext}
          isCurrentlyEditingThisCell={!!config.field && isCurrentlyEditing(config.field as keyof Revenue)}
          onCellEdit={onCellEdit}
          setEditingCell={setEditingCell}
        />
      ))}
      <TableCell className="border-r p-0">
        <div className="h-full flex items-center justify-center">
          {isTempRow ? (
            <button
              className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 text-xs"
              onClick={onCommitTempRow}
            >
              Lưu
            </button>
          ) : (
            <RevenueRowActions
              revenue={revenue}
              index={index} // This index is pageSpecificIndex
              onInsertRowBelow={onInsertRowBelow}
              onCloneRevenue={onCloneRevenue}
              onOpenDialog={onOpenDialog}
              onDeleteRevenue={onDeleteRevenue}
            />
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};

export default RevenueTableRow;

