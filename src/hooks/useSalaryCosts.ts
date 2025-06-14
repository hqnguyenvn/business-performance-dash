
import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";
import { getSalaryCosts, upsertSalaryCosts, deleteSalaryCosts, SalaryCost } from '@/services/salaryCostService';
import { getMasterData, MasterData } from '@/services/masterDataService';

export type SalaryCostWithStatus = SalaryCost & {
  is_new?: boolean;
  is_updated?: boolean;
};

export const MONTHS = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: new Date(0, i).toLocaleString('en', { month: 'short' }) }));

export const useSalaryCosts = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [salaryCosts, setSalaryCosts] = useState<SalaryCostWithStatus[]>([]);
  const [rowsToDelete, setRowsToDelete] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonths, setSelectedMonths] = useState<number[]>(MONTHS.map(m => m.id));
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCost, setSelectedCost] = useState<SalaryCostWithStatus | null>(null);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit'>('view');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [costToDelete, setCostToDelete] = useState<SalaryCostWithStatus | null>(null);

  const { data: initialSalaryCosts, isLoading: isLoadingCosts } = useQuery({
    queryKey: ['salaryCosts', selectedYear],
    queryFn: async () => {
        const allCosts = await getSalaryCosts();
        return allCosts.filter(cost => cost.year === parseInt(selectedYear));
    },
    enabled: !!selectedYear,
  });

  const { data: companies = [], isLoading: isLoadingCompanies } = useQuery({ queryKey: ['companies'], queryFn: () => getMasterData('companies') });
  const { data: divisions = [], isLoading: isLoadingDivisions } = useQuery({ queryKey: ['divisions'], queryFn: () => getMasterData('divisions') });
  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery({ queryKey: ['customers'], queryFn: () => getMasterData('customers') });

  const isLoading = isLoadingCosts || isLoadingCompanies || isLoadingDivisions || isLoadingCustomers;

  useEffect(() => {
    if (initialSalaryCosts) {
      setSalaryCosts(initialSalaryCosts);
      setRowsToDelete([]);
    }
  }, [initialSalaryCosts]);

  const upsertMutation = useMutation({
    mutationFn: upsertSalaryCosts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaryCosts', selectedYear] });
      toast({ title: "Success", description: "Salary costs saved successfully." });
    },
    onError: (error) => toast({ variant: "destructive", title: "Error", description: `Failed to save changes: ${error.message}` }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSalaryCosts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salaryCosts', selectedYear] });
      toast({ title: "Success", description: "Deleted costs have been removed." });
    },
    onError: (error) => toast({ variant: "destructive", title: "Error", description: `Failed to delete costs: ${error.message}` }),
  });

  const saveAllData = () => {
    const costsToUpsert = salaryCosts
      .filter(c => c.is_new || c.is_updated)
      .map(({ is_new, is_updated, ...rest }) => rest);

    if (costsToUpsert.length > 0) {
      upsertMutation.mutate(costsToUpsert);
    }
    if (rowsToDelete.length > 0) {
      deleteMutation.mutate(rowsToDelete);
    }
    if (costsToUpsert.length === 0 && rowsToDelete.length === 0) {
      toast({ title: "No changes", description: "There are no changes to save." });
    }
  };

  const addNewRow = () => {
    const newSalaryCost: SalaryCostWithStatus = {
      id: `new_${Date.now()}`,
      year: parseInt(selectedYear),
      month: selectedMonths.length > 0 ? selectedMonths[0] : 1,
      company_id: null,
      division_id: null,
      customer_id: null,
      amount: 0,
      notes: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_new: true,
    };
    setSalaryCosts(prev => [newSalaryCost, ...prev]);
  };

  const updateSalaryCost = (id: string, field: keyof SalaryCost, value: any) => {
    setSalaryCosts(prev => prev.map(cost => 
      cost.id === id ? { ...cost, [field]: value, is_updated: !cost.is_new } : cost
    ));
  };
  
  const deleteSalaryCost = (cost: SalaryCostWithStatus) => {
    setCostToDelete(cost);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (costToDelete) {
      if (!costToDelete.is_new) {
        setRowsToDelete(prev => [...prev, costToDelete.id]);
      }
      setSalaryCosts(prev => prev.filter(c => c.id !== costToDelete.id));
      toast({ title: "Marked for Deletion", description: "Salary cost record will be deleted upon saving." });
      setIsDeleteDialogOpen(false);
      setCostToDelete(null);
    }
  };
  
  const openDialog = (cost: SalaryCostWithStatus, mode: 'view' | 'edit') => {
    setSelectedCost(cost);
    setDialogMode(mode);
    setIsDialogOpen(true);
  };

  const saveChangesFromDialog = () => {
    if (selectedCost) {
      updateSalaryCost(selectedCost.id, 'amount', selectedCost.amount);
      // ... update other fields from selectedCost
      setSalaryCosts(prev => prev.map(c => c.id === selectedCost.id ? {...selectedCost, is_updated: !selectedCost.is_new} : c));
      toast({ title: "Changes Applied", description: "Changes will be saved when you click 'Save All'." });
      setIsDialogOpen(false);
    }
  };

  const availableYears = useMemo(() => {
    const years = new Set(initialSalaryCosts?.map(c => c.year) || []);
    years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [initialSalaryCosts]);

  const filteredSalaryCosts = useMemo(() => {
    return salaryCosts.filter(cost => 
      cost.year === parseInt(selectedYear) && selectedMonths.includes(cost.month)
    );
  }, [salaryCosts, selectedYear, selectedMonths]);

  const getMonthName = (monthNumber: number) => MONTHS.find(m => m.id === monthNumber)?.name || 'N/A';
  const getMasterDataName = (id: string | null, data: MasterData[], field: 'code' | 'name' = 'name') => data.find(d => d.id === id)?.[field] || '';

  const handleYearChange = (year: string) => setSelectedYear(year);

  const handleMonthToggle = (monthId: number) => {
    setSelectedMonths(prev => 
      prev.includes(monthId) ? prev.filter(m => m !== monthId) : [...prev, monthId]
    );
  };
  
  return {
    salaryCosts, setSalaryCosts,
    selectedYear, handleYearChange,
    selectedMonths, handleMonthToggle,
    availableYears,
    filteredSalaryCosts,
    isLoading,
    companies, divisions, customers,
    addNewRow,
    updateSalaryCost,
    deleteSalaryCost,
    confirmDelete,
    isDeleteDialogOpen, setIsDeleteDialogOpen, costToDelete, setCostToDelete,
    openDialog, saveChangesFromDialog, isDialogOpen, setIsDialogOpen, dialogMode, selectedCost, setSelectedCost,
    saveAllData,
    getMonthName,
    getMasterDataName,
  };
};
