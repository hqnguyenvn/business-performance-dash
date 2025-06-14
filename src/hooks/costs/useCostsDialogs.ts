
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Cost } from "./useCostsState";
import type { useCostsMutations } from './useCostsMutations';
import type { UseMutationResult } from "@tanstack/react-query";

type Mutations = ReturnType<typeof useCostsMutations>;

interface UseCostsDialogsProps {
  setCosts: React.Dispatch<React.SetStateAction<Cost[]>>;
  updateCostMutation: Mutations['updateCostMutation'];
  deleteCostMutation: Mutations['deleteCostMutation'];
}

export const useCostsDialogs = ({ setCosts, updateCostMutation, deleteCostMutation }: UseCostsDialogsProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCost, setSelectedCost] = useState<Cost | null>(null);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit'>('view');
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [costToDelete, setCostToDelete] = useState<Cost | null>(null);

  const openDialog = (cost: Cost, mode: 'view' | 'edit') => {
    setSelectedCost({ ...cost });
    setDialogMode(mode);
    setIsDialogOpen(true);
  };
  
  const deleteCost = (cost: Cost) => {
    setCostToDelete(cost);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!costToDelete) return;
    const { id } = costToDelete;

    setIsDeleteDialogOpen(false);
    const originalCost = costs.find(c => c.id === id);

    if (id.startsWith('new_')) {
      setCosts(prev => prev.filter(c => c.id !== id));
      setCostToDelete(null);
      toast({ title: "Row removed", description: "Unsaved row has been removed." });
      return;
    }
    
    setCosts(prev => prev.filter(c => c.id !== id));
    
    try {
        await deleteCostMutation.mutateAsync(id);
        toast({ title: "Cost deleted", description: "Cost has been deleted successfully." });
        setCostToDelete(null);
    } catch(error) {
        if(originalCost) {
            setCosts(prev => [...prev, originalCost]);
        }
        // The mutation's onError will handle the toast.
    }
  };

  const saveChanges = async () => {
    if (!selectedCost) return;

    const originalCosts = [...costs];
    setCosts(prevCosts => prevCosts.map(c => c.id === selectedCost.id ? selectedCost : c));
    setIsDialogOpen(false);

    try {
        await updateCostMutation.mutateAsync(selectedCost);
        toast({ title: "Cost Updated", description: "Your changes have been saved." });
        queryClient.invalidateQueries({ queryKey: ['costs'] });
    } catch (error) {
        setCosts(originalCosts);
        // onError in mutation handles toast
    }
  };

  return {
    isDialogOpen,
    setIsDialogOpen,
    selectedCost,
    setSelectedCost,
    dialogMode,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    costToDelete,
    setCostToDelete,
    openDialog,
    deleteCost,
    confirmDelete,
    saveChanges,
  };
};
