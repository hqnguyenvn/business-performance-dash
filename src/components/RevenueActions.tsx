import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, ArrowDown, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
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
    },
    onProgress?: (progress: { processed: number; total: number; isComplete: boolean }) => void
  ) => Promise<void>;
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
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ processed: 0, total: 0 });

  const handleImportClick = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    setImportProgress({ processed: 0, total: 0 });
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async function (results) {
        if (Array.isArray(results.data)) {
          setImportProgress({ processed: 0, total: results.data.length });
          
          try {
            await onImportCSV(results.data, {
              customers,
              companies,
              divisions,
              projects,
              projectTypes,
              resources,
              currencies,
            }, (progress) => {
              setImportProgress(progress);
            });
          } catch (error) {
            console.error("Import error:", error);
          }
        }
        setIsImporting(false);
      },
      error: function (error) {
        alert("Lỗi khi đọc file CSV: " + error.message);
        setIsImporting(false);
      },
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileChange}
          data-testid="import-csv-input"
          disabled={isImporting}
        />
        <Button 
          variant="outline" 
          onClick={handleImportClick}
          disabled={isImporting}
        >
          {isImporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <ArrowDown className="h-4 w-4 mr-2" />
          )}
          {isImporting ? "Đang import..." : "Import CSV"}
        </Button>
        <Button variant="outline" onClick={onExportCSV} disabled={isImporting}>
          <Upload className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
        <CloneDataDialog onClone={onCloneData} />
        <Button onClick={onAddNewRow} disabled={isImporting}>
          Add New
        </Button>
      </div>
      
      {isImporting && importProgress.total > 0 && (
        <div className="w-full max-w-md">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Đang xử lý...</span>
            <span>{importProgress.processed}/{importProgress.total}</span>
          </div>
          <Progress 
            value={(importProgress.processed / importProgress.total) * 100} 
            className="h-2"
          />
        </div>
      )}
    </div>
  );
};

export default RevenueActions;
