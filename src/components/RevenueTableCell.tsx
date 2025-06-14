
import React from 'react';
import { TableCell } from "@/components/ui/table";
import EditableCell from "./EditableCell"; // Assumes EditableCell is in the same directory
import { Revenue } from "@/services/revenueService";
import { MasterData } from "@/services/masterDataService";

export type CellType = 'text' | 'number' | 'select' | 'month' | 'static' | 'index';

export interface RowContext {
  pageSpecificIndex: number;
  pageIndex: number;
  pageSize: number;
  getMonthName: (monthNumber: number) => string;
  calculateVNDRevenue?: (revenue: Revenue) => number; // Optional as it's specific to one cell
}

export interface CellConfig {
  field?: keyof Revenue; // Not needed for 'index' type or 'static' if valueGetter handles everything
  type: CellType;
  options?: MasterData[]; // For 'select' type
  valueGetter?: (revenue: Revenue, context: RowContext) => any; // For 'static' or 'index' types
  maxLength?: number; // For 'text' type
  step?: string; // For 'number' type
  cellClassName?: string; // Applied to the TableCell
  // contentClassName?: string; // Applied to the inner div for static content (default px-2 py-1 provided)
}

interface RevenueTableCellProps {
  revenue: Revenue;
  config: CellConfig;
  rowContext: RowContext;
  isCurrentlyEditingThisCell: boolean; // True if this specific cell (identified by config.field) is being edited
  onCellEdit: (id: string, field: keyof Revenue, value: any) => void;
  setEditingCell: (cell: { id: string; field: string } | null) => void;
}

const RevenueTableCell: React.FC<RevenueTableCellProps> = ({
  revenue,
  config,
  rowContext,
  isCurrentlyEditingThisCell,
  onCellEdit,
  setEditingCell,
}) => {
  if (config.type === 'static' || config.type === 'index') {
    let displayValue = '';
    if (config.valueGetter) {
      displayValue = config.valueGetter(revenue, rowContext);
    } else if (config.field) {
      // Fallback for simple static display if valueGetter is not provided, primarily for non-calculated fields.
      // For calculated/formatted fields, valueGetter is preferred.
      const val = revenue[config.field];
      displayValue = val !== null && val !== undefined ? String(val) : '';
      if (typeof val === 'number') { // Generic number formatting if valueGetter isn't specific
        displayValue = val.toLocaleString();
      }
    }
    return (
      <TableCell className={`border-r p-0 ${config.cellClassName || ''}`}> {/* Changed: Added p-0 */}
        <div className={`px-2 h-full flex items-center ${config.type === 'index' ? 'justify-center' : ''}`}> {/* Changed: px-2 py-1 h-8 to px-2 h-full. Added justify-center for index. */}
          {displayValue}
        </div>
      </TableCell>
    );
  }

  // For editable cells, config.field must be defined.
  if (!config.field) {
    console.error("Editable cell type requires a 'field' in CellConfig:", config);
    return <TableCell className={`border-r p-0 ${config.cellClassName || ''}`}>Error</TableCell>; // Ensured p-0 for error cell consistency
  }

  return (
    <TableCell className={`border-r p-0 ${config.cellClassName || ''}`}> {/* p-0 to let EditableCell control its padding */}
      <EditableCell
        revenueId={revenue.id}
        field={config.field}
        initialValue={revenue[config.field]}
        // Cast type because 'static' and 'index' are handled above.
        type={config.type as 'text' | 'number' | 'select' | 'month'}
        options={config.options}
        isCurrentlyEditingThisCell={isCurrentlyEditingThisCell}
        onCellEdit={onCellEdit}
        setEditingCell={setEditingCell}
        getMonthName={rowContext.getMonthName}
        maxLength={config.maxLength}
        step={config.step}
      />
    </TableCell>
  );
};

export default RevenueTableCell;

