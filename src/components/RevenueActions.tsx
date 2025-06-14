import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, ArrowDown } from "lucide-react";
import CloneDataDialog from "@/components/CloneDataDialog";
import Papa from "papaparse";

interface RevenueActionsProps {
  onImportCSV: (
    data: any[],
    masterData: {
      customers: any[],
      companies: any[],
      divisions: any[],
      projects: any[],
      projectTypes: any[],
      resources: any[],
      currencies: any[],
    }
  ) => void;
  onExportCSV: () => void;
  onCloneData: (sourceYear: number, sourceMonth: number, targetYear: number, targetMonth: number) => void | Promise<void>;
  onAddNewRow: () => void;

  // Master data để truyền xuống cho import
  customers: any[];
  companies: any[];
  divisions: any[];
  projects: any[];
  projectTypes: any[];
  resources: any[];
  currencies: any[];
}

const RevenueActions: React.FC<RevenueActionsProps> = ({
  onImportCSV,
  onExportCSV,
  onCloneData,
  onAddNewRow,
  customers,
  companies,
  divisions,
  projects,
  projectTypes,
  resources,
  currencies,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        if (Array.isArray(results.data)) {
          onImportCSV(results.data, {
            customers,
            companies,
            divisions,
            projects,
            projectTypes,
            resources,
            currencies,
          });
        }
      },
      error: function (error) {
        alert("Lỗi khi đọc file CSV: " + error.message);
      },
    });
  };

  return (
    <div className="flex gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFileChange}
        data-testid="import-csv-input"
      />
      <Button variant="outline" onClick={handleImportClick}>
        <ArrowDown className="h-4 w-4 mr-2" />
        Import CSV
      </Button>
      <Button variant="outline" onClick={onExportCSV}>
        <Upload className="h-4 w-4 mr-2" />
        Export CSV
      </Button>
      <CloneDataDialog onClone={onCloneData} />
      <Button variant="outline">
        Save
      </Button>
      <Button onClick={onAddNewRow}>
        Add New
      </Button>
    </div>
  );
};

export default RevenueActions;
