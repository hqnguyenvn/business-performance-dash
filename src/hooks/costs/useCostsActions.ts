
import { useToast } from "@/hooks/use-toast";
import type { Cost, NewCost } from "@/services/costService";
import type { MasterData } from "@/services/masterDataService";
import type { useCostsMutations } from './useCostsMutations';
import type { Cost as CostType } from './useCostsState';

type Mutations = ReturnType<typeof useCostsMutations>;

interface UseCostsActionsProps {
  costs: CostType[];
  setCosts: React.Dispatch<React.SetStateAction<CostType[]>>;
  costTypes: MasterData[];
  selectedYear: string;
  selectedMonths: number[];
  createCostMutation: Mutations['createCostMutation'];
  updateCostMutation: Mutations['updateCostMutation'];
}

export const useCostsActions = ({ costs, setCosts, costTypes, selectedYear, selectedMonths, createCostMutation, updateCostMutation }: UseCostsActionsProps) => {
  const { toast } = useToast();
  const currentMonth = new Date().getMonth() + 1;

  const addNewRow = () => {
    const newCost: CostType = {
      id: `new_${Date.now()}`,
      year: parseInt(selectedYear),
      month: selectedMonths.length > 0 ? selectedMonths[0] : currentMonth,
      description: "",
      price: 0,
      volume: 1,
      cost: 0,
      cost_type: costTypes.length > 0 ? costTypes[0].id : "",
      is_cost: true,
      is_checked: false,
      notes: "",
      company_id: null,
      division_id: null,
      project_id: null,
      resource_id: null,
      created_at: null,
      updated_at: null,
    };
    setCosts(prev => [...prev, newCost]);
  };
  
  const insertRowBelow = (anchorCostId: string) => {
    const anchorCost = costs.find(c => c.id === anchorCostId);
    if (!anchorCost) return;

    setCosts(prevCosts => {
      const anchorIndex = prevCosts.findIndex(c => c.id === anchorCostId);
      if (anchorIndex === -1) return prevCosts;

      const newCost: CostType = {
        id: `new_${Date.now()}`,
        year: anchorCost.year,
        month: currentMonth,
        description: "",
        price: 0,
        volume: 1,
        cost: 0,
        cost_type: costTypes.length > 0 ? costTypes[0].id : "",
        is_cost: true,
        is_checked: false,
        notes: "",
        company_id: null,
        division_id: null,
        project_id: null,
        resource_id: null,
        created_at: null,
        updated_at: null,
      };

      const newCosts = [...prevCosts];
      newCosts.splice(anchorIndex + 1, 0, newCost);
      return newCosts;
    });
  };
  
  const cloneRow = (costToCloneId: string) => {
    setCosts(prevCosts => {
      const costToClone = prevCosts.find(c => c.id === costToCloneId);
      const anchorIndex = prevCosts.findIndex(c => c.id === costToCloneId);
      
      if (!costToClone || anchorIndex === -1) return prevCosts;

      const { id, ...restOfCost } = costToClone;

      const clonedCost: CostType = {
        ...restOfCost,
        id: `new_${Date.now()}`,
      };

      const newCosts = [...prevCosts];
      newCosts.splice(anchorIndex + 1, 0, clonedCost);
      return newCosts;
    });
  };

  const updateCost = async (id: string, field: keyof CostType, value: any) => {
    const costIndex = costs.findIndex(c => c.id === id);
    if (costIndex === -1) return;

    const originalCosts = [...costs];
    let updatedCost = { ...costs[costIndex], [field]: value };

    if (field === 'price' || field === 'volume') {
      updatedCost.cost = (updatedCost.price || 0) * (updatedCost.volume || 0);
    }
    
    const newCosts = [...costs];
    newCosts[costIndex] = updatedCost;
    setCosts(newCosts);

    if (id.startsWith('new_')) {
      const { id: tempId, created_at, updated_at, ...newCostData } = updatedCost;
      try {
        const createdCost = await createCostMutation.mutateAsync({
          ...newCostData,
          cost: newCostData.cost || 0,
        });
        setCosts(prev => prev.map(c => c.id === tempId ? createdCost : c));
        toast({ title: "Cost Created", description: "New cost row has been saved automatically." });
      } catch (error) {
        setCosts(originalCosts);
      }
    } else {
      try {
        await updateCostMutation.mutateAsync(updatedCost);
        toast({ title: "Cost Updated", description: "Your changes have been saved automatically." });
      } catch (error) {
        setCosts(originalCosts);
      }
    }
  };
  
  return { addNewRow, insertRowBelow, cloneRow, updateCost };
};
