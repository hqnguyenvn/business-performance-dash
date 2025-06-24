import { SalaryCost, SalaryCostInsert } from '@/services/salaryCostService';
import { MasterData } from '@/services/masterDataService';
import { useSalaryCostsMutations } from './useSalaryCostsMutations';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface UseSalaryCostsActionsProps {
  salaryCosts: SalaryCost[];
  setSalaryCosts: React.Dispatch<React.SetStateAction<SalaryCost[]>>;
  companies: MasterData[];
  divisions: MasterData[];
  customers: MasterData[];
  selectedYear: string;
  selectedMonths: number[];
}

export const useSalaryCostsActions = ({
  salaryCosts,
  setSalaryCosts,
  companies,
  divisions,
  customers,
  selectedYear,
  selectedMonths
}: UseSalaryCostsActionsProps) => {
  const { createSalaryCostMutation, updateSalaryCostMutation, insertSalaryCostMutation } = useSalaryCostsMutations();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addNewRow = () => {
    const newCost: SalaryCostInsert = {
      year: parseInt(selectedYear),
      month: selectedMonths.length > 0 ? selectedMonths[0] : new Date().getMonth() + 1,
      company_id: companies[0]?.id || null,
      division_id: divisions[0]?.id || null,
      customer_id: customers[0]?.id || null,
      amount: 0,
      notes: ''
    };
    createSalaryCostMutation.mutate(newCost);
  };

  const insertRowBelow = (id: string) => {
    const newCost: SalaryCostInsert = {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      company_id: null,
      division_id: null,
      customer_id: null,
      amount: 0,
      notes: ''
    };
    
    insertSalaryCostMutation.mutate(newCost, {
      onSuccess: (data) => {
        const newRecord = data?.[0];
        if (newRecord) {
            const index = salaryCosts.findIndex(c => c.id === id);
            if (index !== -1) {
                const newCosts = [...salaryCosts];
                newCosts.splice(index + 1, 0, newRecord);
                setSalaryCosts(newCosts);
                queryClient.setQueryData(['salaryCosts'], newCosts);
                toast({ title: "Success", description: "Row inserted." });
            }
        }
      }
    });
  };

  const cloneRow = (id: string) => {
    const baseRow = salaryCosts.find(c => c.id === id);
    if (baseRow) {
      const { id: _, created_at, updated_at, ...newCost } = baseRow;
      insertSalaryCostMutation.mutate(newCost, {
        onSuccess: (data) => {
          const newRecord = data?.[0];
          if (newRecord) {
              const index = salaryCosts.findIndex(c => c.id === id);
              if (index !== -1) {
                  const newCosts = [...salaryCosts];
                  newCosts.splice(index + 1, 0, newRecord);
                  setSalaryCosts(newCosts);
                  queryClient.setQueryData(['salaryCosts'], newCosts);
                  toast({ title: "Success", description: "Row cloned." });
              }
          }
        }
      });
    }
  };

  const updateSalaryCost = (id: string, field: keyof SalaryCost, value: any) => {
    const originalCost = salaryCosts.find(c => c.id === id);
    if (!originalCost) return;
    
    // Optimistic update cho UI
    const updatedCosts = salaryCosts.map(cost => 
      cost.id === id ? { ...cost, [field]: value } : cost
    );
    setSalaryCosts(updatedCosts);
    
    const updatedCost = { ...originalCost, [field]: value };
    updateSalaryCostMutation.mutate(updatedCost);
  };

  return { addNewRow, insertRowBelow, cloneRow, updateSalaryCost };
};
