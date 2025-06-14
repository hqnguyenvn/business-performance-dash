
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";
import { upsertSalaryCosts, deleteSalaryCosts, SalaryCostInsert, SalaryCost } from '@/services/salaryCostService';

export const useSalaryCostsMutations = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createSalaryCostMutation = useMutation({
    mutationFn: (cost: SalaryCostInsert) => upsertSalaryCosts([cost]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaryCosts'] });
      toast({ title: "Success", description: "New salary cost created." });
    },
    onError: (error) => toast({ variant: "destructive", title: "Error", description: `Failed to create cost: ${error.message}` }),
  });

  const updateSalaryCostMutation = useMutation({
    mutationFn: (cost: SalaryCost) => upsertSalaryCosts([cost]),
    onMutate: async (updatedCost: SalaryCost) => {
      await queryClient.cancelQueries({ queryKey: ['salaryCosts'] });
      const previousCosts = queryClient.getQueryData<SalaryCost[]>(['salaryCosts']);
      queryClient.setQueryData<SalaryCost[]>(['salaryCosts'], (old) =>
        old?.map(c => c.id === updatedCost.id ? updatedCost : c) ?? []
      );
      return { previousCosts };
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Salary cost updated." });
    },
    onError: (error: Error, _variables: SalaryCost, context: { previousCosts: SalaryCost[] | undefined } | undefined) => {
      if (context?.previousCosts) {
        queryClient.setQueryData(['salaryCosts'], context.previousCosts);
      }
      toast({ variant: "destructive", title: "Error", description: `Failed to update cost: ${error.message}` });
    },
  });

  const deleteSalaryCostMutation = useMutation({
    mutationFn: (id: string) => deleteSalaryCosts([id]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaryCosts'] });
      toast({ title: "Success", description: "Salary cost deleted." });
    },
    onError: (error) => toast({ variant: "destructive", title: "Error", description: `Failed to delete cost: ${error.message}` }),
  });
  
  const bulkCreateSalaryCostMutation = useMutation({
    mutationFn: (costs: SalaryCostInsert[]) => upsertSalaryCosts(costs),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['salaryCosts'] });
      toast({ title: "Success", description: `${data?.length || 0} salary costs imported successfully.` });
    },
    onError: (error) => toast({ variant: "destructive", title: "Error", description: `Failed to import costs: ${error.message}` }),
  });

  const insertSalaryCostMutation = useMutation({
    mutationFn: (cost: SalaryCostInsert) => upsertSalaryCosts([cost]),
    onError: (error) => toast({ variant: "destructive", title: "Error", description: `Failed to insert cost: ${error.message}` }),
  });

  return { createSalaryCostMutation, updateSalaryCostMutation, deleteSalaryCostMutation, bulkCreateSalaryCostMutation, insertSalaryCostMutation };
};
