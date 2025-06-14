
import { v4 as uuidv4 } from 'uuid';
import { SalaryCost, SalaryCostInsert } from '@/services/salaryCostService';
import { MasterData } from '@/services/masterDataService';
import { useSalaryCostsMutations } from './useSalaryCostsMutations';

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
  const { createSalaryCostMutation, updateSalaryCostMutation } = useSalaryCostsMutations();

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
    const baseRow = salaryCosts.find(c => c.id === id);
    const newCost: SalaryCostInsert = {
      year: baseRow?.year || parseInt(selectedYear),
      month: baseRow?.month || (selectedMonths.length > 0 ? selectedMonths[0] : new Date().getMonth() + 1),
      company_id: baseRow?.company_id || null,
      division_id: baseRow?.division_id || null,
      customer_id: baseRow?.customer_id || null,
      amount: 0,
      notes: ''
    };
    createSalaryCostMutation.mutate(newCost);
  };

  const cloneRow = (id: string) => {
    const baseRow = salaryCosts.find(c => c.id === id);
    if (baseRow) {
      const { id: _, created_at, updated_at, ...newCost } = baseRow;
      createSalaryCostMutation.mutate(newCost);
    }
  };

  const updateSalaryCost = (id: string, field: keyof SalaryCost, value: any) => {
    const originalCost = salaryCosts.find(c => c.id === id);
    if (!originalCost) return;
    
    const updatedCost = { ...originalCost, [field]: value };
    setSalaryCosts(prev => prev.map(c => c.id === id ? updatedCost : c));
    
    const { ...costToUpdate } = updatedCost;
    updateSalaryCostMutation.mutate(costToUpdate);
  };

  return { addNewRow, insertRowBelow, cloneRow, updateSalaryCost };
};
