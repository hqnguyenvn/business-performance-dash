
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCosts } from "@/hooks/useCosts";
import { CostsHeader } from "@/components/costs/CostsHeader";
import { CostsToolbar } from "@/components/costs/CostsToolbar";
import { CostsTable } from "@/components/costs/CostsTable";
import { CostDialogs } from "@/components/costs/CostDialogs";
import { CostsImportStatus } from "@/components/costs/CostsImportStatus";
import PaginationControls from "@/components/PaginationControls";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Import } from "lucide-react";
import CloneCostDialog from "@/components/costs/CloneCostDialog";

const Costs = () => {
  const {
    costs,
    selectedYear,
    selectedMonths,
    setSelectedMonths,
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
    currentPage,
    pageSize,
    totalCount,
    totalPages,
    handlePageChange,
    handlePageSizeChange,
    addNewRow,
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

  const effectivePageSize = typeof pageSize === 'number' ? pageSize : totalCount;
  const startIndex = totalCount > 0 ? (currentPage - 1) * effectivePageSize + 1 : 0;
  const endIndex = pageSize === 'all' ? totalCount : Math.min(currentPage * effectivePageSize, totalCount);

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
          setSelectedMonths={setSelectedMonths}
        />

        <Card>
          <CardHeader>
            <CardTitle>Cost Data ({totalCount} total records)</CardTitle>
          </CardHeader>
          <CardContent>
          <CostsImportStatus 
            isImporting={false}
          />
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
            <div />
            <div className="flex items-center gap-2 flex-wrap">
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={totalCount}
                startIndex={startIndex}
                endIndex={endIndex}
                pageSize={pageSize}
                onPageSizeChange={handlePageSizeChange}
                position="top"
              />
              <Button variant="outline" onClick={importFromCSV}>
                <Import className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
              <Button variant="outline" onClick={exportToCSV}>
                <Upload className="h-4 w-4 mr-2" />
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
          
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            pageSize={pageSize}
            totalItems={totalCount}
            startIndex={startIndex}
            endIndex={endIndex}
            position="bottom"
          />
          </CardContent>
        </Card>
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
