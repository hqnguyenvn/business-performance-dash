import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy } from "lucide-react";
import { MONTH_LABELS, getBusinessDays } from "@/types/employee";

interface CloneEmployeeDialogProps {
  onClone: (sourceYear: number, sourceMonth: number, targetYear: number, targetMonth: number) => void;
}

const CloneEmployeeDialog: React.FC<CloneEmployeeDialogProps> = ({ onClone }) => {
  const [open, setOpen] = useState(false);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  const [sourceYear, setSourceYear] = useState(prevYear);
  const [sourceMonth, setSourceMonth] = useState(prevMonth);
  const [targetYear, setTargetYear] = useState(currentYear);
  const [targetMonth, setTargetMonth] = useState(currentMonth);

  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  const sourceBD = getBusinessDays(sourceYear, sourceMonth);
  const targetBD = getBusinessDays(targetYear, targetMonth);

  const handleClone = () => {
    onClone(sourceYear, sourceMonth, targetYear, targetMonth);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Copy className="h-4 w-4 mr-1" />
          Clone
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clone Employee Data</DialogTitle>
          <DialogDescription>
            Clone employees from source month to target month. Working days will be auto-adjusted based on business days.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium">Source</h4>
            <div>
              <label className="text-sm">Year</label>
              <Select value={sourceYear.toString()} onValueChange={(v) => setSourceYear(parseInt(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{years.map((y) => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm">Month</label>
              <Select value={sourceMonth.toString()} onValueChange={(v) => setSourceMonth(parseInt(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{MONTH_LABELS.map((m, i) => <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">Business days: <strong>{sourceBD}</strong></p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Target</h4>
            <div>
              <label className="text-sm">Year</label>
              <Select value={targetYear.toString()} onValueChange={(v) => setTargetYear(parseInt(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{years.map((y) => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm">Month</label>
              <Select value={targetMonth.toString()} onValueChange={(v) => setTargetMonth(parseInt(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{MONTH_LABELS.map((m, i) => <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">Business days: <strong>{targetBD}</strong></p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleClone}>Clone Data</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CloneEmployeeDialog;
