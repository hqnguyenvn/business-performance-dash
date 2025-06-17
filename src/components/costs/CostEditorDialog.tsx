
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatNumber, parseFormattedNumber } from "@/lib/format";
import { Cost } from "@/hooks/useCosts";
import { MasterData } from "@/services/masterDataService";

interface CostEditorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'view' | 'edit';
  cost: Cost | null;
  onCostChange: React.Dispatch<React.SetStateAction<Cost | null>>;
  onSave: () => void;
  costTypes: MasterData[];
  getMonthName: (month: number) => string;
  getCostTypeName: (id: string) => string;
}

export const CostEditorDialog = ({
  isOpen, onOpenChange, mode, cost, onCostChange, onSave,
  costTypes, getMonthName, getCostTypeName
}: CostEditorDialogProps) => {

  if (!cost) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'view' ? 'View Cost' : 'Edit Cost'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Year</label>
              <div className="p-2 bg-gray-50 rounded">{cost.year}</div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Month</label>
              <div className="p-2 bg-gray-50 rounded">{getMonthName(cost.month)}</div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            {mode === 'view' ? (
              <div className="p-2 bg-gray-50 rounded">{cost.description}</div>
            ) : (
              <Input
                value={cost.description || ''}
                onChange={(e) => onCostChange(prev => prev && {...prev, description: e.target.value})}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Unit Price</label>
              {mode === 'view' ? (
                <div className="p-2 bg-gray-50 rounded text-right">{formatNumber(cost.price || 0)}</div>
              ) : (
                <Input
                  value={formatNumber(cost.price || 0)}
                  onChange={(e) => {
                    const value = parseFormattedNumber(e.target.value);
                    onCostChange(prev => prev && {...prev, price: value, cost: value * (prev.volume || 0)});
                  }}
                  className="text-right"
                />
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Volume</label>
              {mode === 'view' ? (
                <div className="p-2 bg-gray-50 rounded text-right">{formatNumber(cost.volume || 0)}</div>
              ) : (
                <Input
                  value={formatNumber(cost.volume || 0)}
                  onChange={(e) => {
                    const value = parseFormattedNumber(e.target.value);
                    onCostChange(prev => prev && {...prev, volume: value, cost: value * (prev.price || 0)});
                  }}
                  className="text-right"
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Cost</label>
            <div className="p-2 bg-gray-50 rounded text-right">{formatNumber(cost.cost || 0)}</div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Cost Category</label>
            {mode === 'view' ? (
              <div className="p-2 bg-gray-50 rounded">{getCostTypeName(cost.cost_type)}</div>
            ) : (
              <Select
                value={cost.cost_type}
                onValueChange={(value) => onCostChange(prev => prev && {...prev, cost_type: value})}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {costTypes.map(category => (
                    <SelectItem key={category.id} value={category.id}>{category.code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Is Cost</label>
              {mode === 'view' ? (
                <div className="p-2 bg-gray-50 rounded">{cost.is_cost ? 'Yes' : 'No'}</div>
              ) : (
                <div className="flex items-center space-x-2 p-2">
                  <Checkbox
                    checked={cost.is_cost}
                    onCheckedChange={(checked) => onCostChange(prev => prev && {...prev, is_cost: Boolean(checked)})}
                  />
                  <span className="text-sm">{cost.is_cost ? 'Yes' : 'No'}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Checked</label>
              {mode === 'view' ? (
                <div className="p-2 bg-gray-50 rounded">{cost.is_checked ? 'Yes' : 'No'}</div>
              ) : (
                <div className="flex items-center space-x-2 p-2">
                  <Checkbox
                    checked={cost.is_checked}
                    onCheckedChange={(checked) => onCostChange(prev => prev && {...prev, is_checked: Boolean(checked)})}
                  />
                  <span className="text-sm">{cost.is_checked ? 'Yes' : 'No'}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            {mode === 'view' ? (
              <div className="p-2 bg-gray-50 rounded min-h-[60px]">{cost.notes}</div>
            ) : (
              <Input
                value={cost.notes || ''}
                onChange={(e) => onCostChange(prev => prev && {...prev, notes: e.target.value})}
              />
            )}
          </div>

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
