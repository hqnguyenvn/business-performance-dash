
import { useState } from 'react';
import { SalaryCost } from '@/services/salaryCostService';
import { useSalaryCostsMutations } from './useSalaryCostsMutations';

export const useSalaryCostsDialogs = ({
  setSalaryCosts,
}: {
  setSalaryCosts: React.Dispatch<React.SetStateAction<SalaryCost[]>>;
}) => {
  const { deleteSalaryCostMutation, updateSalaryCostMutation } = useSalaryCostsMutations();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCost, setSelectedCost] = useState<SalaryCost | null>(null);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit'>('view');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [costToDelete, setCostToDelete] = useState<SalaryCost | null>(null);

  const openDialog = (cost: SalaryCost, mode: 'view' | 'edit') => {
    setSelectedCost({ ...cost });
    setDialogMode(mode);
    setIsDialogOpen(true);
  };

  const deleteCost = (cost: SalaryCost) => {
    setCostToDelete(cost);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (costToDelete) {
      deleteSalaryCostMutation.mutate(costToDelete.id, {
        onSuccess: () => {
          setSalaryCosts(prev => prev.filter(c => c.id !== costToDelete.id));
          setIsDeleteDialogOpen(false);
          setCostToDelete(null);
        }
      });
    }
  };

  const saveChanges = () => {
    if (selectedCost) {
      updateSalaryCostMutation.mutate(selectedCost, {
        onSuccess: () => {
          setIsDialogOpen(false);
          setSelectedCost(null);
        }
      });
    }
  };
  
  return {
    isDialogOpen, setIsDialogOpen,
    selectedCost, setSelectedCost,
    dialogMode,
    isDeleteDialogOpen, setIsDeleteDialogOpen,
    costToDelete, setCostToDelete,
    openDialog,
    deleteCost,
    confirmDelete,
    saveChanges,
  };
};
