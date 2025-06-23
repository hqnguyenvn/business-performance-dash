
import { useCostsState, Cost as CostType, MONTHS } from './costs/useCostsState';
import { useCostsMutations } from './costs/useCostsMutations';
import { useCostsActions } from './costs/useCostsActions';
import { useCostsDialogs } from './costs/useCostsDialogs';
import { useCostsIO } from './costs/useCostsIO';

export type Cost = CostType;
export { MONTHS };

export const useCosts = () => {
  const {
    costs,
    setCosts,
    selectedYear,
    selectedMonths,
    isLoading,
    costTypes,
    availableYears,
    filteredCosts,
    currentPage,
    pageSize,
    totalCount,
    totalPages,
    handleYearChange,
    handleMonthToggle,
    handlePageChange,
    getMonthName,
    getCostTypeName,
    getMonthNumber,
    getCostTypeId,
  } = useCostsState();

  const { createCostMutation, updateCostMutation, deleteCostMutation, batchCreateCostMutation } = useCostsMutations();

  const {
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
  } = useCostsDialogs({
    costs,
    setCosts,
    updateCostMutation,
    deleteCostMutation,
  });

  const { addNewRow, insertRowBelow, cloneRow, updateCost } = useCostsActions({
    costs,
    setCosts,
    costTypes,
    selectedYear,
    selectedMonths,
    createCostMutation,
    updateCostMutation,
  });

  const { cloneCosts, exportToCSV, importFromCSV } = useCostsIO({
    filteredCosts,
    costTypes,
    createCostMutation,
    batchCreateCostMutation,
    getMonthName,
    getMonthNumber,
    getCostTypeId,
  });

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
    isLoading,
    costTypes,
    availableYears,
    filteredCosts,
    // Pagination
    currentPage,
    pageSize,
    totalCount,
    totalPages,
    handlePageChange,
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
  };
};

