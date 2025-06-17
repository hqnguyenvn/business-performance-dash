
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { costService, Cost as DbCost, NewCost } from "@/services/costService";

export const useCostsMutations = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const createCostMutation = useMutation({
        mutationFn: (cost: NewCost): Promise<DbCost> => costService.create(cost),
        onError: (error) => {
          toast({ title: "Error", description: `Could not create cost: ${error.message}`, variant: "destructive" });
        }
    });

    const updateCostMutation = useMutation({
        mutationFn: (cost: DbCost): Promise<DbCost> => costService.update(cost.id, cost),
        onError: (error) => {
          toast({ title: "Error", description: `Could not update cost: ${error.message}`, variant: "destructive" });
        }
    });

    const deleteCostMutation = useMutation({
        mutationFn: (id: string) => costService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['costs'] });
        },
        onError: (error) => {
          toast({ title: "Error", description: `Could not delete cost: ${error.message}`, variant: "destructive" });
        }
    });

    return {
        createCostMutation,
        updateCostMutation,
        deleteCostMutation
    }
}
