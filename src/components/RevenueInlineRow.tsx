
import React from "react";
import RevenueTableRow from "./RevenueTableRow";
import { Revenue } from "@/types/revenue";
import { MasterData } from "@/services/masterDataService";

interface Props {
  tempRow: Partial<Revenue>; // Changed to Partial<Revenue> to reflect temp nature
  customers: MasterData[];
  companies: MasterData[];
  divisions: MasterData[];
  projects: MasterData[];
  projectTypes: MasterData[];
  resources: MasterData[];
  currencies: MasterData[];
  getMonthName: (monthNumber: number) => string;
  calculateVNDRevenue: (revenue: Revenue) => number;
  editingCell: { id: string; field: string } | null;
  setEditingCell: (cell: { id:string; field: string } | null) => void;
  onCellEdit: (id: string, field: keyof Revenue, value: any) => void;
  onCommitTempRow: () => void;
}

const RevenueInlineRow: React.FC<Props> = ({
  tempRow,
  customers,
  companies,
  divisions,
  projects,
  projectTypes,
  resources,
  currencies,
  getMonthName,
  calculateVNDRevenue,
  editingCell,
  setEditingCell,
  onCellEdit,
  onCommitTempRow,
}) => {
  const completeTempRow: Revenue = {
    id: 'temp-id',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    original_amount: 0,
    vnd_revenue: 0,
    ...tempRow,
  };

  return (
    <RevenueTableRow
      revenue={completeTempRow}
      index={0}
      pageIndex={1}
      pageSize={1}
      editingCell={editingCell}
      setEditingCell={setEditingCell}
      customers={customers}
      companies={companies}
      divisions={divisions}
      projects={projects}
      projectTypes={projectTypes}
      resources={resources}
      currencies={currencies}
      getMonthName={getMonthName}
      calculateVNDRevenue={calculateVNDRevenue as (revenue: Partial<Revenue>) => number}
      onCellEdit={onCellEdit}
      onInsertRowBelow={() => {}}
      onCloneRevenue={() => {}}
      onOpenDialog={() => {}}
      onDeleteRevenue={() => {}}
      isTempRow={true}
      onCommitTempRow={onCommitTempRow}
    />
  );
};

export default RevenueInlineRow;
