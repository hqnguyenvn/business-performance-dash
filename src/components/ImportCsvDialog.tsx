import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { parseCsvFile } from "@/utils/importCsv";
import { useToast } from "@/hooks/use-toast";

interface ImportCsvDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  expectedColumns: string[];
  onImport: (rows: Record<string, string>[]) => Promise<{ created: number; updated: number; errors: string[] }>;
}

const ImportCsvDialog: React.FC<ImportCsvDialogProps> = ({
  open,
  onOpenChange,
  title,
  expectedColumns,
  onImport,
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<Record<string, string>[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const resetState = () => {
    setFile(null);
    setParsedData(null);
    setParseError(null);
    setImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = (open: boolean) => {
    if (!open) resetState();
    onOpenChange(open);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParseError(null);
    setParsedData(null);

    try {
      const rows = await parseCsvFile<Record<string, string>>(selectedFile);

      if (rows.length === 0) {
        setParseError("The CSV file is empty.");
        return;
      }

      const fileColumns = Object.keys(rows[0]).map((c) => c.trim());
      const missingColumns = expectedColumns.filter(
        (col) => !fileColumns.some((fc) => fc.toLowerCase() === col.toLowerCase())
      );

      if (missingColumns.length > 0) {
        setParseError(
          `Missing columns: ${missingColumns.join(", ")}. Expected columns: ${expectedColumns.join(", ")}`
        );
        return;
      }

      setParsedData(rows);
    } catch (error: any) {
      setParseError(error.message || "Failed to parse CSV file.");
    }
  };

  const handleImport = async () => {
    if (!parsedData) return;

    setImporting(true);
    try {
      const result = await onImport(parsedData);

      toast({
        title: "Import completed",
        description: `Created: ${result.created}, Updated: ${result.updated}${result.errors.length > 0 ? `, Errors: ${result.errors.length}` : ""}`,
        variant: result.errors.length > 0 ? "destructive" : "default",
      });

      if (result.errors.length > 0) {
        console.error("Import errors:", result.errors);
      }

      handleClose(false);
    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import {title}</DialogTitle>
          <DialogDescription>
            Select a CSV file with columns: {expectedColumns.join(", ")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Choose File
            </Button>
            <span className="text-sm text-muted-foreground truncate max-w-[200px]">
              {file ? file.name : "No file selected"}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {parseError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{parseError}</p>
            </div>
          )}

          {parsedData && (
            <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-700">
                <p className="font-medium">File parsed successfully</p>
                <p>{parsedData.length} row(s) found ready for import.</p>
                <p className="text-xs mt-1 text-green-600">
                  Matching rows will be updated, new rows will be created.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!parsedData || importing}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            {importing ? "Importing..." : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportCsvDialog;
