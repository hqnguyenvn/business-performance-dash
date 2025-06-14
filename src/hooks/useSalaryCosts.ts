
import { useSalaryCostsState, SalaryCost as SalaryCostType, MONTHS } from './salary-costs/useSalaryCostsState';
import { useSalaryCostsMutations } from './salary-costs/useSalaryCostsMutations';
import { useSalaryCostsActions } from './salary-costs/useSalaryCostsActions';
import { useSalaryCostsDialogs } from './salary-costs/useSalaryCostsDialogs';
import { useSalaryCostsIO } from './salary-costs/useSalaryCostsIO';

export type SalaryCost = SalaryCostType;
export { MONTHS };

export const useSalaryCosts = () => {
  const {
    salaryCosts,
    setSalaryCosts,
    selectedYear,
    selectedMonths,
    isLoading,
    companies,
    divisions,
    customers,
    availableYears,
    filteredSalaryCosts,
    handleYearChange,
    handleMonthToggle,
    getMonthName,
    getMasterDataName,
    getMonthNumber,
    getMasterDataId,
  } = useSalaryCostsState();

  const {
    isDialogOpen, setIsDialogOpen,
    selectedCost, setSelectedCost,
    dialogMode,
    isDeleteDialogOpen, setIsDeleteDialogOpen,
    costToDelete, setCostToDelete,
    openDialog, deleteCost, confirmDelete, saveChanges,
  } = useSalaryCostsDialogs({ setSalaryCosts });

  const { addNewRow, insertRowBelow, cloneRow, updateSalaryCost } = useSalaryCostsActions({
    salaryCosts,
    setSalaryCosts,
    companies,
    divisions,
    customers,
    selectedYear,
    selectedMonths,
  });

  const { exportToCSV, importFromCSV, cloneSalaryCosts } = useSalaryCostsIO({
    filteredSalaryCosts,
    companies,
    divisions,
    customers,
    getMonthName,
    getMonthNumber,
    getMasterDataName,
    getMasterDataId,
  });

  return {
    salaryCosts,
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
    companies,
    divisions,
    customers,
    availableYears,
    filteredSalaryCosts,
    addNewRow,
    insertRowBelow,
    cloneRow,
    updateSalaryCost,
    openDialog,
    deleteCost,
    confirmDelete,
    saveChanges,
    cloneSalaryCosts,
    exportToCSV,
    importFromCSV,
    handleYearChange,
    handleMonthToggle,
    getMonthName,
    getMasterDataName,
  };
};
