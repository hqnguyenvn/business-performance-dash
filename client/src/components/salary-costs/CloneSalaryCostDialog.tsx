
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy } from 'lucide-react';
import { MONTHS } from '@/hooks/useSalaryCosts';

interface CloneSalaryCostDialogProps {
  onClone: (fromYear: number, fromMonth: number, toYear: number, toMonth: number) => void;
}

const years = [new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1];

const CloneSalaryCostDialog = ({ onClone }: CloneSalaryCostDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const fromYearInitial = currentMonth === 1 ? currentYear - 1 : currentYear;
  const fromMonthInitial = currentMonth === 1 ? 12 : currentMonth - 1;

  const [fromYear, setFromYear] = useState(fromYearInitial);
  const [fromMonth, setFromMonth] = useState(fromMonthInitial);
  const [toYear, setToYear] = useState(currentYear);
  const [toMonth, setToMonth] = useState(currentMonth);

  const handleClone = () => {
    onClone(fromYear, fromMonth, toYear, toMonth);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Copy className="h-4 w-4 mr-2" />
          Clone Data
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clone Salary Costs</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div>
            <h3 className="font-semibold mb-2">From</h3>
            <div className="flex gap-2">
              <Select value={String(fromYear)} onValueChange={(v) => setFromYear(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={String(fromMonth)} onValueChange={(v) => setFromMonth(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{MONTHS.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">To</h3>
            <div className="flex gap-2">
               <Select value={String(toYear)} onValueChange={(v) => setToYear(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={String(toMonth)} onValueChange={(v) => setToMonth(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{MONTHS.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleClone}>Clone</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CloneSalaryCostDialog;
