import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { costService, Cost as DbCost, NewCost } from "@/services/costService";
import { costTypesService, MasterData } from "@/services/masterDataService";
import { useTableFilter } from "@/hooks/useTableFilter";
import { exportCostsCSV } from "@/utils/csvExport";
import Papa from "papaparse";

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
    mutationFn: (cost: NewCost): Promise<Cost> => costService.create(cost),
    onError: (error) => {
      toast({ title: "Error", description: `Could not create cost: ${error.message}`, variant: "destructive" });
    }
  });

  const updateCostMutation = useMutation({
    mutationFn: (cost: DbCost): Promise<Cost> => costService.update(cost.id, cost),
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
      volume: 1, // Default volume is 1 as requested
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

      const newCost: Cost = {
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

      const clonedCost: Cost = {
        ...restOfCost,
        id: `new_${Date.now()}`,
      };

      const newCosts = [...prevCosts];
      newCosts.splice(anchorIndex + 1, 0, clonedCost);
      return newCosts;
    });
  };

  const updateCost = async (id: string, field: keyof Cost, value: any) => {
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
        toast({ title: "Error", description: `Could not create cost: ${(error as Error).message}`, variant: "destructive" });
      }
    } else {
      try {
        await updateCostMutation.mutateAsync(updatedCost);
        toast({ title: "Cost Updated", description: "Your changes have been saved automatically." });
      } catch (error) {
        setCosts(originalCosts);
        toast({ title: "Error", description: `Could not update cost: ${(error as Error).message}`, variant: "destructive" });
      }
    }
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

  const confirmDelete = async () => {
    if (!costToDelete) return;
    const { id } = costToDelete;

    setIsDeleteDialogOpen(false);

    if (id.startsWith('new_')) {
      setCosts(prev => prev.filter(c => c.id !== id));
      setCostToDelete(null);
      toast({ title: "Row removed", description: "Unsaved row has been removed." });
      return;
    }

    const originalCosts = [...costs];
    setCosts(prev => prev.filter(c => c.id !== id));
    setCostToDelete(null);
    
    try {
        await deleteCostMutation.mutateAsync(id);
        toast({ title: "Cost deleted", description: "Cost has been deleted successfully." });
        queryClient.invalidateQueries({ queryKey: ['costs'] });
    } catch(error) {
        setCosts(originalCosts);
        toast({ title: "Error", description: `Could not delete cost: ${(error as Error).message}`, variant: "destructive" });
    }
  };

  const saveChanges = async () => {
    if (!selectedCost) return;

    const originalCosts = [...costs];
    const updatedCosts = costs.map(c => c.id === selectedCost.id ? selectedCost : c);
    
    setCosts(updatedCosts);
    setIsDialogOpen(false);

    try {
        await updateCostMutation.mutateAsync(selectedCost);
        toast({ title: "Cost Updated", description: "Your changes have been saved." });
        queryClient.invalidateQueries({ queryKey: ['costs'] });
    } catch (error) {
        setCosts(originalCosts);
        toast({ title: "Error", description: `Could not update cost: ${(error as Error).message}`, variant: "destructive" });
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
    if (!filteredCosts || filteredCosts.length === 0) {
        toast({
            title: "No Data to Export",
            description: "There are no costs matching the current filters.",
            variant: "destructive",
        });
        return;
    }
    exportCostsCSV({
      costs: filteredCosts,
      costTypes,
      getMonthName,
    });
    toast({
      title: "Export Initiated",
      description: `An export of ${filteredCosts.length} cost records has started.`,
    });
  };

  const importFromCSV = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (!target.files) return;
      const file = target.files[0];
      if (file) {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: async (results) => {
            if (results.errors.length) {
              toast({ title: "Import Error", description: `Error parsing CSV: ${results.errors[0].message}`, variant: "destructive" });
              return;
            }

            const newCosts: NewCost[] = [];
            const rows = results.data as Record<string, string>[];
            
            for (const row of rows) {
              const year = parseInt(row.Year, 10);
              const month = getMonthNumber(row.Month);
              const cost_type = getCostTypeId(row.Category);

              if (!year || !month || !cost_type) {
                console.warn("Skipping invalid row:", row);
                continue;
              }

              const price = parseFloat(row['Unit Price']) || 0;
              const volume = parseFloat(row.Volume) || 1;

              newCosts.push({
                year,
                month,
                description: row.Description || "",
                price,
                volume,
                cost: price * volume,
                cost_type,
                is_cost: (row['Is Cost'] || 'TRUE').toUpperCase() === 'TRUE',
                is_checked: (row.Checked || 'FALSE').toUpperCase() === 'FALSE',
                notes: row.Notes || "",
                company_id: null,
                division_id: null,
                project_id: null,
                resource_id: null,
              });
            }

            if (newCosts.length === 0) {
              toast({ title: "No Data", description: "No valid data to import from file.", variant: "destructive" });
              return;
            }

            toast({ title: "Importing...", description: `Importing ${newCosts.length} new cost records.` });
            try {
              await Promise.all(newCosts.map(cost => createCostMutation.mutateAsync(cost)));
              toast({ title: "Import Successful", description: `Successfully imported ${newCosts.length} records.` });
              queryClient.invalidateQueries({ queryKey: ['costs'] });
            } catch (error) {
              toast({ title: "Import Failed", description: `An error occurred: ${(error as Error).message}`, variant: "destructive" });
            }
          },
        });
      }
    };
    input.click();
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

  const getCostTypeName = (costTypeId: string): string => {
    if (!costTypeId) return "";
    const costType = costTypes.find(c => c.id === costTypeId);
    return costType ? costType.code : "";
  };

  const getMonthNumber = (monthName: string): number => {
    if (!monthName) return 0;
    const month = MONTHS.find(m => m.label.toLowerCase() === monthName.toLowerCase().trim());
    return month ? month.value : 0;
  };

  const getCostTypeId = (costTypeCode: string): string => {
    if (!costTypeCode) return "";
    const costType = costTypes.find(c => c.code.toLowerCase() === costTypeCode.toLowerCase().trim());
    return costType ? costType.id : "";
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
    insertRowBelow,
    cloneRow,
    updateCost,
    openDialog,
    deleteCost,
    confirmDelete,
    saveChanges,
    cloneCosts,
    exportToCSV,
    importFromCSV,
    handleYearChange,
    handleMonthToggle,
    getMonthName,
    getCostTypeName,
    getCostTypeId,
  };
};
