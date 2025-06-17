
import * as React from "react";
import { Cost } from "@/hooks/useCosts";
import { MasterData } from "@/services/masterDataService";
import { CostEditorDialog } from './CostEditorDialog';
import { DeleteCostDialog } from './DeleteCostDialog';

interface CostDialogsProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  dialogMode: 'view' | 'edit';
  selectedCost: Cost | null;
  setSelectedCost: React.Dispatch<React.SetStateAction<Cost | null>>;
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

  return (
    <>
      <CostEditorDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        mode={dialogMode}
        cost={selectedCost}
        onCostChange={setSelectedCost}
        onSave={saveChanges}
        costTypes={costTypes}
        getMonthName={getMonthName}
        getCostTypeName={getCostTypeName}
      />

      <DeleteCostDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        onCancel={() => setCostToDelete(null)}
      />
    </>
  );
};
