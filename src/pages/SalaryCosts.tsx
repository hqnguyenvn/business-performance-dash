
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Upload, Import } from "lucide-react";
import { useSalaryCosts } from "@/hooks/useSalaryCosts";
import { SalaryCostsHeader } from "@/components/salary-costs/SalaryCostsHeader";
import { SalaryCostsToolbar } from "@/components/salary-costs/SalaryCostsToolbar";
import { SalaryCostsTable } from "@/components/salary-costs/SalaryCostsTable";
import { SalaryCostDialogs } from "@/components/salary-costs/SalaryCostDialogs";
import CloneSalaryCostDialog from "@/components/salary-costs/CloneSalaryCostDialog";
import PaginationControls from "@/components/PaginationControls";

const SalaryCosts = () => {
  const {
    salaryCosts,
    selectedYear,
    handleYearChange,
    selectedMonths,
    handleMonthToggle,
    availableYears,
    filteredSalaryCosts,
    isLoading,
    companies,
    divisions,
    customers,
    addNewRow,
    updateSalaryCost,
    deleteCost,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    costToDelete,
    setCostToDelete,
    openDialog,
    saveChanges,
    isDialogOpen,
    setIsDialogOpen,
    dialogMode,
    selectedCost,
    setSelectedCost,
    getMonthName,
    getMasterDataName,
    insertRowBelow,
    cloneRow,
    exportToCSV,
    importFromCSV,
    cloneSalaryCosts,
    confirmDelete,
    // Pagination
    currentPage,
    setCurrentPage,
    pageSize,
    totalRecords,
    totalPages,
  } = useSalaryCosts();

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-24 w-full mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Calculate pagination values
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalRecords);

  return (
    <div className="min-h-screen bg-gray-50">
      <SalaryCostsHeader />

      <div className="p-6">
        <SalaryCostsToolbar
          selectedYear={selectedYear}
          handleYearChange={handleYearChange}
          availableYears={availableYears}
          selectedMonths={selectedMonths}
          handleMonthToggle={handleMonthToggle}
        />

        <Card className="bg-white">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                Cost Per Customer ({totalRecords} total records, showing {filteredSalaryCosts.length} on page {currentPage})
              </CardTitle>
              <div className="flex items-center gap-2">
                 <Button variant="outline" onClick={importFromCSV}>
                  <Import className="h-4 w-4 mr-2" />
                  Import CSV
                </Button>
                <Button variant="outline" onClick={exportToCSV}>
                  <Upload className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <CloneSalaryCostDialog onClone={cloneSalaryCosts} />
                <Button onClick={addNewRow}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Row
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <SalaryCostsTable
              costs={filteredSalaryCosts}
              updateCost={updateSalaryCost}
              deleteCost={deleteCost}
              openDialog={openDialog}
              insertRowBelow={insertRowBelow}
              cloneRow={cloneRow}
              companies={companies}
              divisions={divisions}
              customers={customers}
            />
            
            {totalPages > 1 && (
              <div className="mt-4">
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={totalRecords}
                  startIndex={startIndex}
                  endIndex={endIndex}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <SalaryCostDialogs
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
        companies={companies}
        divisions={divisions}
        customers={customers}
        getMonthName={getMonthName}
        getMasterDataName={getMasterDataName}
      />
    </div>
  );
};

export default SalaryCosts;
