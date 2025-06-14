
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NumberInput } from "@/components/ui/number-input";
import { formatNumber } from "@/lib/format";
import { SalaryCostWithStatus, MONTHS } from "@/hooks/useSalaryCosts";
import { MasterData } from "@/services/masterDataService";

interface SalaryCostEditorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'view' | 'edit';
  cost: SalaryCostWithStatus | null;
  onCostChange: React.Dispatch<React.SetStateAction<SalaryCostWithStatus | null>>;
  onSave: () => void;
  companies: MasterData[];
  divisions: MasterData[];
  customers: MasterData[];
  getMonthName: (month: number) => string;
  getMasterDataName: (id: string | null, data: MasterData[], field?: 'code' | 'name') => string;
}

export const SalaryCostEditorDialog = ({
  isOpen, onOpenChange, mode, cost, onCostChange, onSave,
  companies, divisions, customers, getMonthName, getMasterDataName
}: SalaryCostEditorDialogProps) => {

  if (!cost) return null;

  const renderViewField = (label: string, value: React.ReactNode) => (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="p-2 bg-gray-50 rounded min-h-[40px]">{value}</div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'view' ? 'View Salary Cost' : 'Edit Salary Cost'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {renderViewField("Year", cost.year)}
            {renderViewField("Month", getMonthName(cost.month))}
          </div>

          {mode === 'view' ? renderViewField("Company", getMasterDataName(cost.company_id, companies, 'code')) : (
            <div className="space-y-2">
              <label className="text-sm font-medium">Company</label>
              <Select value={cost.company_id || ''} onValueChange={(v) => onCostChange(p => p && {...p, company_id: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{companies.map(c => <SelectItem key={c.id} value={c.id}>{c.code}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}

          {mode === 'view' ? renderViewField("Division", getMasterDataName(cost.division_id, divisions, 'code')) : (
            <div className="space-y-2">
              <label className="text-sm font-medium">Division</label>
              <Select value={cost.division_id || ''} onValueChange={(v) => onCostChange(p => p && {...p, division_id: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{divisions.map(d => <SelectItem key={d.id} value={d.id}>{d.code}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}

          {mode === 'view' ? renderViewField("Customer", getMasterDataName(cost.customer_id, customers, 'code')) : (
            <div className="space-y-2">
              <label className="text-sm font-medium">Customer</label>
              <Select value={cost.customer_id || ''} onValueChange={(v) => onCostChange(p => p && {...p, customer_id: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.code}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          
          {mode === 'view' ? renderViewField("Amount", formatNumber(cost.amount)) : (
             <div className="space-y-2">
                <label className="text-sm font-medium">Amount</label>
                <NumberInput value={cost.amount} onChange={(v) => onCostChange(p => p && {...p, amount: v})} className="text-right" />
            </div>
          )}

          {mode === 'view' ? renderViewField("Notes", cost.notes) : (
             <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Input value={cost.notes || ''} onChange={(e) => onCostChange(p => p && {...p, notes: e.target.value})} />
            </div>
          )}
          
          {mode === 'edit' && (
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={onSave}>Save</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
