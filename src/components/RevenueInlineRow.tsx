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
  setEditingCell: (cell: { id: string; field: string } | null) => void;
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
  return (
    <RevenueTableRow
      revenue={tempRow}
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
      calculateVNDRevenue={calculateVNDRevenue}
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
