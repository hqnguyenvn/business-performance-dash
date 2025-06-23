import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCost, updateCost, deleteCost, batchCreateCosts, Cost, NewCost } from "@/services/costApi";
import { useToast } from "@/hooks/use-toast";

export const useCostsMutations = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const invalidateQueries = () => {
      queryClient.invalidateQueries({ queryKey: ['costs'] });
    };

    const createCostMutation = useMutation({
    mutationFn: (newCost: NewCost) => createCost(newCost),
    onSuccess: () => {
      invalidateQueries();
      toast({
        title: "Cost created successfully!",
      });
    },
    onError: (error) => {
      console.error("Error creating cost:", error);
      toast({
        variant: "destructive",
        title: "Error creating cost",
        description: "Please try again.",
      });
    },
  });

  const updateCostMutation = useMutation({
    mutationFn: ({ id, cost }: { id: string; cost: Partial<Cost> }) => 
      updateCost(id, cost),
    onSuccess: () => {
      invalidateQueries();
      toast({
        title: "Cost updated successfully!",
      });
    },
    onError: (error) => {
      console.error("Error updating cost:", error);
      toast({
        variant: "destructive",
        title: "Error updating cost",
        description: "Please try again.",
      });
    },
  });

  const deleteCostMutation = useMutation({
    mutationFn: (id: string) => deleteCost(id),
    onSuccess: () => {
      invalidateQueries();
      toast({
        title: "Cost deleted successfully!",
      });
    },
    onError: (error) => {
      console.error("Error deleting cost:", error);
      toast({
        variant: "destructive",
        title: "Error deleting cost",
        description: "Please try again.",
      });
    },
  });

  const batchCreateCostMutation = useMutation({
    mutationFn: (costs: NewCost[]) => batchCreateCosts(costs),
    onSuccess: (result) => {
      invalidateQueries();
      toast({
        title: `Batch import completed!`,
        description: `Success: ${result.success}, Failed: ${result.failed}`,
      });
    },
    onError: (error) => {
      console.error("Error in batch import:", error);
      toast({
        variant: "destructive",
        title: "Batch import failed",
        description: "Please try again.",
      });
    },
  });

    return {
        createCostMutation,
        updateCostMutation,
        deleteCostMutation,
        batchCreateCostMutation,
    };
}