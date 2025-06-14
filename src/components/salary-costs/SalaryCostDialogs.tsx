
import * as React from "react";
import { SalaryCostEditorDialog } from './SalaryCostEditorDialog';
import { DeleteCostDialog } from '@/components/costs/DeleteCostDialog';
import { SalaryCost } from "@/hooks/useSalaryCosts";
import { MasterData } from "@/services/masterDataService";

interface SalaryCostDialogsProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  dialogMode: 'view' | 'edit';
  selectedCost: SalaryCost | null;
  setSelectedCost: React.Dispatch<React.SetStateAction<SalaryCost | null>>;
  saveChanges: () => void;
  isDeleteDialogOpen: boolean;
  setIsDeleteDialogOpen: (open: boolean) => void;
  confirmDelete: () => void;
  setCostToDelete: (cost: SalaryCost | null) => void;
  companies: MasterData[];
  divisions: MasterData[];
  customers: MasterData[];
  getMonthName: (month: number) => string;
  getMasterDataName: (id: string | null, data: MasterData[], field?: 'code' | 'name') => string;
}

export const SalaryCostDialogs = (props: SalaryCostDialogsProps) => {
  return (
    <>
      <SalaryCostEditorDialog
        isOpen={props.isDialogOpen}
        onOpenChange={props.setIsDialogOpen}
        mode={props.dialogMode}
        cost={props.selectedCost}
        onCostChange={props.setSelectedCost}
        onSave={props.saveChanges}
        companies={props.companies}
        divisions={props.divisions}
        customers={props.customers}
        getMonthName={props.getMonthName}
        getMasterDataName={props.getMasterDataName}
      />

      <DeleteCostDialog
        isOpen={props.isDeleteDialogOpen}
        onOpenChange={props.setIsDeleteDialogOpen}
        onConfirm={props.confirmDelete}
        onCancel={() => props.setCostToDelete(null)}
      />
    </>
  );
};
