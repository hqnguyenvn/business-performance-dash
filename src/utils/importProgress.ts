import type { ImportProgress } from "@/components/ExcelImportDialog";

/**
 * Report progress at every Nth row (default 10) and on the final row.
 * Use inside per-row import loops where rows are processed sequentially.
 */
export function reportRowProgress(
  done: number,
  total: number,
  onProgress: ImportProgress | undefined,
  step = 10,
): void {
  if (!onProgress) return;
  if (done % step === 0 || done === total) onProgress(done, total);
}
