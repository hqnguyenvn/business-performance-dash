import { Skeleton } from "@/components/ui/skeleton";
import { useCosts } from "@/hooks/useCosts";
import { CostsHeader } from "@/components/costs/CostsHeader";
import { CostsToolbar } from "@/components/costs/CostsToolbar";
import { CostsTable } from "@/components/costs/CostsTable";
import { CostDialogs } from "@/components/costs/CostDialogs";
import { Button } from "@/components/ui/button";
import { Plus, Download, Save, Import } from "lucide-react";
import CloneCostDialog from "@/components/costs/CloneCostDialog";

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
    insertRowBelow,
    cloneRow,
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
        />

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Cost Data</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={importFromCSV}>
                <Import className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <CloneCostDialog onClone={cloneCosts} />
              <Button onClick={addNewRow}>
                <Plus className="h-4 w-4 mr-2" />
                Add Row
              </Button>
            </div>
          </div>
          <CostsTable
            costs={costs}
            filteredCosts={filteredCosts}
            costTypes={costTypes}
            updateCost={updateCost}
            openDialog={openDialog}
            deleteCost={deleteCost}
            addNewRow={addNewRow}
            insertRowBelow={insertRowBelow}
            cloneRow={cloneRow}
          />
        </div>
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
