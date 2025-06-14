
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatNumber, parseFormattedNumber } from "@/lib/format";
import { Cost } from "@/hooks/useCosts";
import { MasterData } from "@/services/masterDataService";

interface CostDialogsProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  dialogMode: 'view' | 'edit';
  selectedCost: Cost | null;
  setSelectedCost: (cost: Cost | null) => void;
  saveChanges: () => void;
  isDeleteDialogOpen: boolean;
  setIsDeleteDialogOpen: (open: boolean) => void;
  confirmDelete: () => void;
  setCostToDelete: (cost: Cost | null) => void;
  costTypes: MasterData[];
  getMonthName: (month: number) => string;
  getCostTypeName: (id: string) => string;
}

export const CostDialogs = ({
  isDialogOpen, setIsDialogOpen, dialogMode, selectedCost, setSelectedCost, saveChanges,
  isDeleteDialogOpen, setIsDeleteDialogOpen, confirmDelete, setCostToDelete,
  costTypes, getMonthName, getCostTypeName
}: CostDialogsProps) => {
  if (!selectedCost) return null;

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{dialogMode === 'view' ? 'View Cost' : 'Edit Cost'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Year</label>
                <div className="p-2 bg-gray-50 rounded">{selectedCost.year}</div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Month</label>
                <div className="p-2 bg-gray-50 rounded">{getMonthName(selectedCost.month)}</div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              {dialogMode === 'view' ? (
                <div className="p-2 bg-gray-50 rounded">{selectedCost.description}</div>
              ) : (
                <Input
                  value={selectedCost.description || ''}
                  onChange={(e) => setSelectedCost({...selectedCost, description: e.target.value})}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Unit Price</label>
                {dialogMode === 'view' ? (
                  <div className="p-2 bg-gray-50 rounded text-right">{formatNumber(selectedCost.price || 0)}</div>
                ) : (
                  <Input
                    value={formatNumber(selectedCost.price || 0)}
                    onChange={(e) => {
                      const value = parseFormattedNumber(e.target.value);
                      setSelectedCost(prev => prev && {...prev, price: value, cost: value * (prev.volume || 0)});
                    }}
                    className="text-right"
                  />
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Volume</label>
                {dialogMode === 'view' ? (
                  <div className="p-2 bg-gray-50 rounded text-right">{formatNumber(selectedCost.volume || 0)}</div>
                ) : (
                  <Input
                    value={formatNumber(selectedCost.volume || 0)}
                    onChange={(e) => {
                      const value = parseFormattedNumber(e.target.value);
                      setSelectedCost(prev => prev && {...prev, volume: value, cost: value * (prev.price || 0)});
                    }}
                    className="text-right"
                  />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Cost</label>
              <div className="p-2 bg-gray-50 rounded text-right">{formatNumber(selectedCost.cost || 0)}</div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Cost Category</label>
              {dialogMode === 'view' ? (
                <div className="p-2 bg-gray-50 rounded">{getCostTypeName(selectedCost.cost_type)}</div>
              ) : (
                <Select
                  value={selectedCost.cost_type}
                  onValueChange={(value) => setSelectedCost(prev => prev && {...prev, cost_type: value})}
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
                {dialogMode === 'view' ? (
                  <div className="p-2 bg-gray-50 rounded">{selectedCost.is_cost ? 'Yes' : 'No'}</div>
                ) : (
                  <div className="flex items-center space-x-2 p-2">
                    <Checkbox
                      checked={selectedCost.is_cost}
                      onCheckedChange={(checked) => setSelectedCost(prev => prev && {...prev, is_cost: Boolean(checked)})}
                    />
                    <span className="text-sm">{selectedCost.is_cost ? 'Yes' : 'No'}</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Checked</label>
                {dialogMode === 'view' ? (
                  <div className="p-2 bg-gray-50 rounded">{selectedCost.is_checked ? 'Yes' : 'No'}</div>
                ) : (
                  <div className="flex items-center space-x-2 p-2">
                    <Checkbox
                      checked={selectedCost.is_checked}
                      onCheckedChange={(checked) => setSelectedCost(prev => prev && {...prev, is_checked: Boolean(checked)})}
                    />
                    <span className="text-sm">{selectedCost.is_checked ? 'Yes' : 'No'}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              {dialogMode === 'view' ? (
                <div className="p-2 bg-gray-50 rounded min-h-[60px]">{selectedCost.notes}</div>
              ) : (
                <Input
                  value={selectedCost.notes || ''}
                  onChange={(e) => setSelectedCost(prev => prev && {...prev, notes: e.target.value})}
                />
              )}
            </div>

            {dialogMode === 'edit' && (
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={saveChanges}>Save</Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this cost record. Click 'Save All' to confirm deletion from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCostToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

