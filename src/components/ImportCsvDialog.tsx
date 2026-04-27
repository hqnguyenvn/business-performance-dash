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
import { Upload, FileText, AlertCircle, CheckCircle2, Download, FileDown, FileSpreadsheet } from "lucide-react";
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
  const [isDragging, setIsDragging] = useState(false);

  const resetState = () => {
    setFile(null);
    setParsedData(null);
    setParseError(null);
    setImporting(false);
    setIsDragging(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = (open: boolean) => {
    if (!open) resetState();
    onOpenChange(open);
  };

  const handleDownloadTemplate = () => {
    const csv = expectedColumns.join(",") + "\n";
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.replace(/\s+/g, "_").toLowerCase()}-template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFilePick = async (selectedFile: File | null) => {
    if (!selectedFile) return;
    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      setParseError("Vui lòng chọn file .csv");
      return;
    }

    setFile(selectedFile);
    setParseError(null);
    setParsedData(null);

    try {
      const rows = await parseCsvFile<Record<string, string>>(selectedFile);

      if (rows.length === 0) {
        setParseError("File CSV trống.");
        return;
      }

      const fileColumns = Object.keys(rows[0]).map((c) => c.trim());
      const missingColumns = expectedColumns.filter(
        (col) => !fileColumns.some((fc) => fc.toLowerCase() === col.toLowerCase())
      );

      if (missingColumns.length > 0) {
        setParseError(
          `Thiếu cột: ${missingColumns.join(", ")}. Cột yêu cầu: ${expectedColumns.join(", ")}`
        );
        return;
      }

      setParsedData(rows);
    } catch (error: any) {
      setParseError(error.message || "Không đọc được file CSV.");
    }
  };

  const handleImport = async () => {
    if (!parsedData) return;

    setImporting(true);
    try {
      const result = await onImport(parsedData);

      toast({
        title: "Import hoàn tất",
        description: `Tạo mới: ${result.created}, Cập nhật: ${result.updated}${result.errors.length > 0 ? `, Lỗi: ${result.errors.length}` : ""}`,
        variant: result.errors.length > 0 ? "destructive" : "default",
      });

      if (result.errors.length > 0) {
        console.error("Import errors:", result.errors);
      }

      handleClose(false);
    } catch (error: any) {
      toast({
        title: "Import thất bại",
        description: error.message || "Đã xảy ra lỗi.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Import {title}</DialogTitle>
          <DialogDescription>
            Tải file mẫu để biết cấu trúc cần nhập, sau đó upload file CSV đã hoàn thiện.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="w-full flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition text-left"
          >
            <div className="bg-primary/10 text-primary p-2 rounded-md">
              <FileDown className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">Tải file mẫu (template)</div>
              <div className="text-xs text-muted-foreground">CSV có sẵn các cột: {expectedColumns.join(", ")}</div>
            </div>
            <Download className="h-4 w-4 text-muted-foreground" />
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">hoặc</span>
            </div>
          </div>

          <label
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFilePick(e.dataTransfer.files?.[0] || null);
            }}
            className={`flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer transition ${
              isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => handleFilePick(e.target.files?.[0] || null)}
            />
            {file ? (
              <>
                <div className="bg-primary/10 text-primary p-2 rounded-md">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div className="text-sm font-medium">{file.name}</div>
                <div className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB • Bấm để chọn file khác</div>
              </>
            ) : (
              <>
                <Upload className="h-6 w-6 text-muted-foreground" />
                <div className="text-sm font-medium">Kéo thả file CSV vào đây</div>
                <div className="text-xs text-muted-foreground">hoặc bấm để chọn từ máy tính</div>
              </>
            )}
          </label>

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
                <p className="font-medium">Đã parse file thành công</p>
                <p>{parsedData.length} dòng sẵn sàng import.</p>
                <p className="text-xs mt-1 text-green-600">
                  Dòng trùng mã sẽ được cập nhật, dòng mới sẽ được tạo.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Huỷ
          </Button>
          <Button
            onClick={handleImport}
            disabled={!parsedData || importing}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            {importing ? "Đang import..." : "Bắt đầu import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportCsvDialog;
