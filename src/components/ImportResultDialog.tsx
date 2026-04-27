import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, Download } from "lucide-react";

export interface ImportError {
  row: number;
  reason: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  successCount: number;
  errors: ImportError[];
}

/**
 * Persistent modal showing the outcome of a CSV import. Replaces the old
 * `<pre>` dump inside a toast that auto-dismissed after 15 seconds.
 *
 * - Summary line with success/fail counts
 * - Scrollable list of per-row errors
 * - "Download errors" button to export the error list as CSV
 */
export function ImportResultDialog({
  open,
  onClose,
  title = "Import result",
  successCount,
  errors,
}: Props) {
  const hasErrors = errors.length > 0;

  const downloadErrorCsv = () => {
    const header = "Row,Reason\n";
    const rows = errors
      .map((e) => `${e.row},"${e.reason.replace(/"/g, '""')}"`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "import-errors.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {hasErrors ? (
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            )}
            {title}
          </DialogTitle>
          <DialogDescription>
            Imported <strong>{successCount}</strong> row{successCount === 1 ? "" : "s"} successfully.
            {hasErrors && (
              <>
                {" "}
                <strong>{errors.length}</strong> row{errors.length === 1 ? "" : "s"} failed.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {hasErrors && (
          <div className="max-h-64 overflow-y-auto rounded border text-sm">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="w-16 p-2 text-left">Row</th>
                  <th className="p-2 text-left">Reason</th>
                </tr>
              </thead>
              <tbody>
                {errors.map((e, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2 font-mono">{e.row}</td>
                    <td className="p-2 text-red-700">{e.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <DialogFooter>
          {hasErrors && (
            <Button variant="outline" onClick={downloadErrorCsv}>
              <Download className="h-4 w-4 mr-2" />
              Download errors
            </Button>
          )}
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
