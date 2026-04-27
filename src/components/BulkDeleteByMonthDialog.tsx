import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (year: number, months: number[]) => Promise<void>;
  defaultYear: number;
  entityLabel?: string;
}

const MONTHS = [
  { value: 1, label: "Jan" }, { value: 2, label: "Feb" }, { value: 3, label: "Mar" },
  { value: 4, label: "Apr" }, { value: 5, label: "May" }, { value: 6, label: "Jun" },
  { value: 7, label: "Jul" }, { value: 8, label: "Aug" }, { value: 9, label: "Sep" },
  { value: 10, label: "Oct" }, { value: 11, label: "Nov" }, { value: 12, label: "Dec" },
];

const BulkDeleteByMonthDialog: React.FC<Props> = ({ open, onOpenChange, onConfirm, defaultYear, entityLabel = "dữ liệu" }) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
  const [year, setYear] = useState(defaultYear);
  const [months, setMonths] = useState<number[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const toggleMonth = (m: number, checked: boolean) => {
    if (checked) setMonths((prev) => [...prev, m].sort((a, b) => a - b));
    else setMonths((prev) => prev.filter((x) => x !== m));
  };

  const selectAll = () => setMonths(MONTHS.map((m) => m.value));
  const clearAll = () => setMonths([]);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm(year, months);
      setConfirmOpen(false);
      onOpenChange(false);
      setMonths([]);
    } finally {
      setSubmitting(false);
    }
  };

  const monthLabels = months.map((m) => MONTHS[m - 1].label).join(", ");

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Xoá {entityLabel} theo tháng</DialogTitle>
            <DialogDescription>
              Chọn năm và các tháng cần xoá. Thao tác này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3">
              <Label className="w-16">Year</Label>
              <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Months</Label>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={selectAll}>All</Button>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={clearAll}>Clear</Button>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 p-3 border rounded-md">
                {MONTHS.map((m) => (
                  <label key={m.value} htmlFor={`del-m-${m.value}`} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      id={`del-m-${m.value}`}
                      checked={months.includes(m.value)}
                      onCheckedChange={(c) => toggleMonth(m.value, Boolean(c))}
                    />
                    <span className="text-sm">{m.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Huỷ</Button>
            <Button
              variant="destructive"
              disabled={months.length === 0}
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Xoá {months.length > 0 ? `${months.length} tháng` : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xoá</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn sắp xoá toàn bộ {entityLabel} của <strong>{year}</strong> — tháng: <strong>{monthLabels}</strong>. Thao tác không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleConfirm(); }}
              disabled={submitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang xoá...</> : "Xoá"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BulkDeleteByMonthDialog;
