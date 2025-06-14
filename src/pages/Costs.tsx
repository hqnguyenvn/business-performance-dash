
import { Skeleton } from "@/components/ui/skeleton";
import { useCosts } from "@/hooks/useCosts";
import { CostsHeader } from "@/components/costs/CostsHeader";
import { CostsToolbar } from "@/components/costs/CostsToolbar";
import { CostsTable } from "@/components/costs/CostsTable";
import { CostDialogs } from "@/components/costs/CostDialogs";

const Costs = () => {
  const {
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
  } = useCosts();

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-24 w-full mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CostsHeader />

      <div className="p-6">
        <CostsToolbar
          selectedYear={selectedYear}
          handleYearChange={handleYearChange}
          availableYears={availableYears}
          selectedMonths={selectedMonths}
          handleMonthToggle={handleMonthToggle}
          importFromCSV={importFromCSV}
          exportToCSV={exportToCSV}
          saveAllData={saveAllData}
          addNewRow={addNewRow}
          onClone={cloneCosts}
        />

        <CostsTable
          costs={costs}
          filteredCosts={filteredCosts}
          costTypes={costTypes}
          updateCost={updateCost}
          openDialog={openDialog}
          deleteCost={deleteCost}
          addNewRow={addNewRow}
        />
      </div>

      <CostDialogs
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        dialogMode={dialogMode}
        selectedCost={selectedCost}
        setSelectedCost={setSelectedCost}
        saveChanges={saveChanges}
        isDeleteDialogOpen={isDeleteDialogOpen}
        setIsDeleteDialogOpen={setIsDeleteDialogOpen}
        confirmDelete={confirmDelete}
        setCostToDelete={setCostToDelete}
        costTypes={costTypes}
        getMonthName={getMonthName}
        getCostTypeName={getCostTypeName}
      />
    </div>
  );
};

export default Costs;
