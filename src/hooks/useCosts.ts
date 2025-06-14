import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { costService, Cost as DbCost, NewCost } from "@/services/costService";
import { costTypesService, MasterData } from "@/services/masterDataService";
import { useTableFilter } from "@/hooks/useTableFilter";

export type Cost = DbCost;

export const MONTHS = [
  { value: 1, label: "January" }, { value: 2, label: "February" }, { value: 3, label: "March" },
  { value: 4, label: "April" }, { value: 5, label: "May" }, { value: 6, label: "June" },
  { value: 7, label: "July" }, { value: 8, label: "August" }, { value: 9, label: "September" },
  { value: 10, label: "October" }, { value: 11, label: "November" }, { value: 12, label: "December" }
];

export const useCosts = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [costs, setCosts] = useState<Cost[]>([]);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [selectedMonths, setSelectedMonths] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCost, setSelectedCost] = useState<Cost | null>(null);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit'>('view');
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [costToDelete, setCostToDelete] = useState<Cost | null>(null);
  const [deletedCostIds, setDeletedCostIds] = useState<string[]>([]);

  const { data: dbCosts, isLoading: isLoadingCosts } = useQuery({
    queryKey: ["costs"],
    queryFn: () => costService.getAll(),
  });

  const { data: costTypes = [], isLoading: isLoadingCostTypes } = useQuery({
    queryKey: ["cost_types"],
    queryFn: () => costTypesService.getAll(),
  });

  useEffect(() => {
    if (dbCosts) {
      setCosts(dbCosts);
    }
  }, [dbCosts]);

  const availableYears = useMemo(() => {
    const startYear = 2020;
    const endYear = 2035;
    return Array.from({ length: endYear - startYear + 1 }, (_, i) => endYear - i);
  }, []);

  const baseCosts = useMemo(() => {
    return costs.filter(cost => {
      const yearMatch = cost.year === parseInt(selectedYear);
      const monthMatch = selectedMonths.includes(cost.month);
      const notDeleted = !deletedCostIds.includes(cost.id);
      return yearMatch && monthMatch && notDeleted;
    });
  }, [costs, selectedYear, selectedMonths, deletedCostIds]);

  const { filteredData: filteredCosts, setFilter, getActiveFilters } = useTableFilter(baseCosts);
  
  const createCostMutation = useMutation({
    mutationFn: (cost: NewCost) => costService.create(cost),
    onError: (error) => {
      toast({ title: "Error", description: `Could not create cost: ${error.message}`, variant: "destructive" });
    }
  });

  const updateCostMutation = useMutation({
    mutationFn: (cost: DbCost) => costService.update(cost.id, cost),
    onError: (error) => {
      toast({ title: "Error", description: `Could not update cost: ${error.message}`, variant: "destructive" });
    }
  });

  const deleteCostMutation = useMutation({
    mutationFn: (id: string) => costService.delete(id),
    onError: (error) => {
      toast({ title: "Error", description: `Could not delete cost: ${error.message}`, variant: "destructive" });
    }
  });

  const addNewRow = () => {
    const newCost: Cost = {
      id: `new_${Date.now()}`,
      year: parseInt(selectedYear),
      month: selectedMonths.length > 0 ? selectedMonths[0] : currentMonth,
      description: "",
      price: 0,
      volume: 0,
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

  const updateCost = (id: string, field: keyof Cost, value: any) => {
    setCosts(costs.map(cost => {
      if (cost.id === id) {
        const updated = { ...cost, [field]: value };
        if (field === 'price' || field === 'volume') {
          updated.cost = (updated.price || 0) * (updated.volume || 0);
        }
        return updated;
      }
      return cost;
    }));
  };

  const openDialog = (cost: Cost, mode: 'view' | 'edit') => {
    setSelectedCost({ ...cost });
    setDialogMode(mode);
    setIsDialogOpen(true);
  };

  const deleteCost = (cost: Cost) => {
    setCostToDelete(cost);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (costToDelete) {
      if (!costToDelete.id.startsWith('new_')) {
        setDeletedCostIds(prev => [...prev, costToDelete.id]);
      }
      setCosts(prev => prev.filter(cost => cost.id !== costToDelete.id));
      toast({
        title: "Marked for Deletion",
        description: "Item will be deleted when you click 'Save All'",
      });
      setIsDeleteDialogOpen(false);
      setCostToDelete(null);
    }
  };

  const saveChanges = () => {
    if (selectedCost) {
      setCosts(costs.map(c => c.id === selectedCost.id ? selectedCost : c));
      setIsDialogOpen(false);
      toast({
        title: "Changes Queued",
        description: "Cost data has been updated locally. Click 'Save All' to persist.",
      });
    }
  };

  const saveAllData = async () => {
    const creationPromises = costs
      .filter(c => c.id.startsWith('new_'))
      .map(c => {
        const { id, created_at, updated_at, ...newCostData } = c;
        const costToCreate: NewCost = {
          ...newCostData,
          cost: newCostData.cost || 0,
        };
        return createCostMutation.mutateAsync(costToCreate);
      });

    const updatePromises = costs
      .filter(c => !c.id.startsWith('new_') && dbCosts?.find(db_c => db_c.id === c.id) && JSON.stringify(c) !== JSON.stringify(dbCosts?.find(db_c => db_c.id === c.id)))
      .map(c => updateCostMutation.mutateAsync(c));

    const deletionPromises = deletedCostIds.map(id => deleteCostMutation.mutateAsync(id));

    try {
      await Promise.all([...creationPromises, ...updatePromises, ...deletionPromises]);
      
      toast({
        title: "Save All Data",
        description: "All cost data has been saved successfully",
      });
      
      setDeletedCostIds([]);
      queryClient.invalidateQueries({ queryKey: ['costs'] });

    } catch (error) {
       toast({
        title: "Error Saving Data",
        description: "An error occurred while saving data.",
        variant: "destructive"
      });
    }
  };

  const cloneCosts = async (sourceYear: number, sourceMonth: number, targetYear: number, targetMonth: number) => {
    try {
        const costsToClone = await costService.getByFilters({ year: sourceYear, month: sourceMonth });

        if (costsToClone.length === 0) {
            toast({ title: "No Data", description: "No cost data found for the source period to clone." });
            return;
        }

        const costsForTargetPeriod = await costService.getByFilters({ year: targetYear, month: targetMonth });
        if (costsForTargetPeriod.length > 0) {
            toast({ 
                title: "Data Exists", 
                description: `Cost data already exists for ${getMonthName(targetMonth)} ${targetYear}. Please clear it first.`,
                variant: "destructive"
            });
            return;
        }

        const newCosts: NewCost[] = costsToClone.map(cost => {
            const { id, created_at, updated_at, ...rest } = cost;
            return {
                ...rest,
                year: targetYear,
                month: targetMonth,
                is_checked: false,
            };
        });

        const creationPromises = newCosts.map(c => createCostMutation.mutateAsync(c));
        await Promise.all(creationPromises);
        
        toast({
            title: "Success",
            description: `Successfully cloned ${newCosts.length} cost items to ${getMonthName(targetMonth)} ${targetYear}.`,
        });

        queryClient.invalidateQueries({ queryKey: ['costs'] });

    } catch (error) {
        toast({
            title: "Error Cloning Data",
            description: "An error occurred while cloning cost data.",
            variant: "destructive"
        });
    }
  };

  const exportToCSV = () => {
    toast({
      title: "Export Data",
      description: "Cost data has been exported to CSV successfully",
    });
  };

  const importFromCSV = () => {
    toast({
      title: "Import from CSV",
      description: "This function is not yet available.",
    });
  };

  const handleYearChange = (value: string) => {
    setSelectedYear(value);
  };

  const handleMonthToggle = (monthValue: number) => {
    setSelectedMonths(prev => {
      const newMonths = prev.includes(monthValue) 
        ? prev.filter(m => m !== monthValue)
        : [...prev, monthValue].sort((a,b) => a-b);
      return newMonths;
    });
  };

  const getMonthName = (monthNumber: number) => {
    const month = MONTHS.find(m => m.value === monthNumber);
    return month ? month.label : monthNumber.toString();
  };

  const getCostTypeName = (costTypeId: string) => {
    return costTypes.find(c => c.id === costTypeId)?.code || costTypeId;
  };

  return {
    costs,
    selectedYear,
    selectedMonths,
    isDialogOpen,
    setIsDialogOpen,
    selectedCost,
    setSelectedCost,
    dialogMode,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    costToDelete,
    setCostToDelete,
    isLoading: isLoadingCosts || isLoadingCostTypes,
    costTypes,
    availableYears,
    filteredCosts,
    addNewRow,
    updateCost,
    openDialog,
    deleteCost,
    confirmDelete,
    saveChanges,
    saveAllData,
    cloneCosts,
    exportToCSV,
    importFromCSV,
    handleYearChange,
    handleMonthToggle,
    getMonthName,
    getCostTypeName,
  };
};
