import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Download, Plus, Trash2 } from "lucide-react";
import CloneDataDialog from "@/components/CloneDataDialog";
import ExcelImportDialog, { type ImportResult, type ImportProgress } from "@/components/ExcelImportDialog";
import BulkDeleteByMonthDialog from "@/components/BulkDeleteByMonthDialog";
import { buildRevenueImportSchema, type RevenueMasterData } from "@/utils/revenueExcelSchema";

interface RevenueActionsProps {
  onImportExcel: (rows: Record<string, any>[], onProgress?: ImportProgress) => Promise<ImportResult>;
  onExportExcel: () => void;
  onCloneData: (sourceYear: number, sourceMonth: number, targetYear: number, targetMonth: number) => void | Promise<void>;
  onBulkDelete: (year: number, months: number[]) => Promise<void>;
  onAddNewRow: () => void;
  defaultYear: number;

  customers: any[];
  companies: any[];
  divisions: any[];
  projects: any[];
  projectTypes: any[];
  resources: any[];
  currencies: any[];
}

const RevenueActions: React.FC<RevenueActionsProps> = ({
  onImportExcel,
  onExportExcel,
  onCloneData,
  onBulkDelete,
  onAddNewRow,
  defaultYear,
  customers,
  companies,
  divisions,
  projects,
  projectTypes,
  resources,
  currencies,
}) => {
  const [importOpen, setImportOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const masterData: RevenueMasterData = {
    customers, companies, divisions, projects, projectTypes, resources, currencies,
  };
  // ExcelImportDialog uses this schema both for the "Tải mẫu" template
  // download AND for parsing the uploaded file. Use the trimmed import
  // schema (11 cols) so users only see fields they need to fill.
  const schema = buildRevenueImportSchema(masterData);

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={() => setImportOpen(true)}>
        <Upload className="h-4 w-4 mr-2" />
        Import
      </Button>
      <Button variant="outline" onClick={onExportExcel}>
        <Download className="h-4 w-4 mr-2" />
        Export
      </Button>
      <CloneDataDialog onClone={onCloneData} />
      <Button variant="destructive" onClick={() => setBulkDeleteOpen(true)}>
        <Trash2 className="h-4 w-4 mr-2" />
        Delete by Month
      </Button>
      <Button onClick={onAddNewRow}>
        <Plus className="h-4 w-4 mr-2" />
        Add New
      </Button>

      <BulkDeleteByMonthDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        onConfirm={onBulkDelete}
        defaultYear={defaultYear}
        entityLabel="revenue"
      />

      <ExcelImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Revenue"
        schema={schema}
        templateFileName="revenue-import-template.xlsx"
        errorFileName="revenue-import-errors.xlsx"
        onImport={onImportExcel}
      />
    </div>
  );
};

export default RevenueActions;
