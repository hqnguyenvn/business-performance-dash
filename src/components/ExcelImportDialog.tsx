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
import { Progress } from "@/components/ui/progress";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Download, FileDown, Loader2 } from "lucide-react";
import { downloadTemplate, parseExcel, buildErrorFile, type ExcelSchema, type ImportError } from "@/utils/excelIO";
import { useToast } from "@/hooks/use-toast";

export interface ImportResult {
  created: number;
  updated: number;
  errors: ImportError[];
}

export type ImportProgress = (done: number, total: number) => void;

interface ExcelImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  schema: ExcelSchema;
  templateFileName: string;
  errorFileName: string;
  onImport: (
    rows: Record<string, any>[],
    onProgress?: ImportProgress,
  ) => Promise<ImportResult>;
}

const ExcelImportDialog: React.FC<ExcelImportDialogProps> = ({
  open,
  onOpenChange,
  title,
  schema,
  templateFileName,
  errorFileName,
  onImport,
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<Record<string, any>[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastResult, setLastResult] = useState<ImportResult | null>(null);

  const resetAll = () => {
    setFile(null);
    setParsedRows(null);
    setParseError(null);
    setImporting(false);
    setProgress(null);
    setIsDragging(false);
    setLastResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) resetAll();
    onOpenChange(o);
  };

  const handleDownloadTemplate = async () => {
    try {
      await downloadTemplate({ schema, fileName: templateFileName });
    } catch (err: any) {
      toast({ title: "Lỗi tạo file mẫu", description: err.message, variant: "destructive" });
    }
  };

  const handleFilePick = async (selected: File | null) => {
    if (!selected) return;
    const ext = selected.name.toLowerCase();
    if (!ext.endsWith(".xlsx") && !ext.endsWith(".xls")) {
      setParseError("Vui lòng chọn file Excel (.xlsx hoặc .xls).");
      return;
    }
    setFile(selected);
    setParseError(null);
    setParsedRows(null);
    setLastResult(null);

    try {
      const { rows } = await parseExcel({ file: selected, schema });
      if (rows.length === 0) {
        setParseError("File không có dữ liệu.");
        return;
      }
      setParsedRows(rows);
    } catch (err: any) {
      setParseError(err.message || "Không đọc được file Excel.");
    }
  };

  const handleStartImport = async () => {
    if (!parsedRows) return;
    setImporting(true);
    setProgress({ done: 0, total: parsedRows.length });
    try {
      const result = await onImport(parsedRows, (done, total) => {
        setProgress({ done, total });
      });
      setLastResult(result);
      if (result.errors.length === 0) {
        toast({
          title: "Import thành công",
          description: `Tạo mới: ${result.created}, Cập nhật: ${result.updated}`,
        });
        handleOpenChange(false);
      } else {
        toast({
          title: "Import hoàn tất với lỗi",
          description: `Tạo mới: ${result.created}, Cập nhật: ${result.updated}, Lỗi: ${result.errors.length}. Tải file lỗi để sửa.`,
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({ title: "Import thất bại", description: err.message, variant: "destructive" });
    } finally {
      setImporting(false);
      setProgress(null);
    }
  };

  const handleDownloadErrorFile = async () => {
    if (!file || !lastResult || lastResult.errors.length === 0) return;
    try {
      await buildErrorFile({ file, errors: lastResult.errors, schema, fileName: errorFileName });
    } catch (err: any) {
      toast({ title: "Lỗi tạo file báo lỗi", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Import {title}</DialogTitle>
          <DialogDescription>
            Tải file mẫu có sẵn dropdown cho các trường khóa ngoại. Sau đó upload file đã hoàn thiện.
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
              <div className="font-medium text-sm">Tải file mẫu Excel</div>
              <div className="text-xs text-muted-foreground">Dropdown lookup cho các cột liên kết, sẵn sàng nhập liệu</div>
            </div>
            <Download className="h-4 w-4 text-muted-foreground" />
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
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
              accept=".xlsx,.xls"
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
                <div className="text-sm font-medium">Kéo thả file Excel vào đây</div>
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

          {parsedRows && !lastResult && !importing && (
            <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-700">
                <p className="font-medium">Đã đọc file thành công</p>
                <p>{parsedRows.length} dòng sẵn sàng import.</p>
              </div>
            </div>
          )}

          {importing && progress && (
            <div className="space-y-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-blue-700">Đang import...</span>
                <span className="text-blue-700 tabular-nums">
                  {progress.done} / {progress.total}
                  {progress.total > 0 && (
                    <> ({Math.round((progress.done / progress.total) * 100)}%)</>
                  )}
                </span>
              </div>
              <Progress
                value={progress.total > 0 ? (progress.done / progress.total) * 100 : 0}
                className="h-2"
              />
            </div>
          )}

          {lastResult && lastResult.errors.length > 0 && (
            <div className="space-y-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-700">
                  <p className="font-medium">Import hoàn tất với {lastResult.errors.length} lỗi</p>
                  <p>Tạo mới: {lastResult.created} • Cập nhật: {lastResult.updated}</p>
                  <p className="text-xs mt-1">Tải file lỗi để xem chi tiết — cell lỗi được tô đỏ và có cột "Error" ở cuối.</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleDownloadErrorFile} className="ml-6">
                <Download className="h-4 w-4 mr-2" />
                Tải file lỗi
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>Đóng</Button>
          <Button onClick={handleStartImport} disabled={!parsedRows || importing}>
            {importing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang import...</> : "Bắt đầu import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExcelImportDialog;
