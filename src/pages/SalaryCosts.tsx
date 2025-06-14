
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, Plus, Save, Upload, Download } from "lucide-react";
import { useSalaryCosts, MONTHS } from "@/hooks/useSalaryCosts";
import { SalaryCostsTable } from "@/components/salary-costs/SalaryCostsTable";
import { SalaryCostDialogs } from "@/components/salary-costs/SalaryCostDialogs";

const SalaryCosts = () => {
  const {
    salaryCosts,
    setSalaryCosts,
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
    deleteSalaryCost,
    confirmDelete,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    costToDelete,
    setCostToDelete,
    openDialog,
    saveChangesFromDialog,
    isDialogOpen,
    setIsDialogOpen,
    dialogMode,
    selectedCost,
    setSelectedCost,
    saveAllData,
    getMonthName,
    getMasterDataName,
  } = useSalaryCosts();

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
      <PageHeader
        title="Salary Costs by Customer"
        description="Record salary costs by customer"
        icon={Users}
        actions={
          <>
            <Button variant="outline" onClick={() => { /* TODO: export */ }}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={saveAllData}>
              <Save className="h-4 w-4 mr-2" />
              Save All
            </Button>
            <Button onClick={addNewRow}>
              <Plus className="h-4 w-4 mr-2" />
              Add Row
            </Button>
          </>
        }
      />

      <div className="p-6">
        <Card className="bg-white mb-6">
          <CardHeader>
            <CardTitle>Data Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-8">
              <div className="flex items-center gap-4">
                <Select value={selectedYear} onValueChange={handleYearChange}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {availableYears.map(year => (
                      <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <div className="grid grid-cols-6 gap-2">
                  {MONTHS.map((month) => (
                    <div key={month.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`month-${month.id}`}
                        checked={selectedMonths.includes(month.id)}
                        onCheckedChange={() => handleMonthToggle(month.id)}
                      />
                      <label htmlFor={`month-${month.id}`} className="text-sm font-medium cursor-pointer">{month.name}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Salary Cost Data ({filteredSalaryCosts.length} records)</CardTitle>
          </CardHeader>
          <CardContent>
            <SalaryCostsTable
              costs={filteredSalaryCosts}
              updateCost={updateSalaryCost}
              deleteCost={deleteSalaryCost}
              openDialog={openDialog}
              companies={companies}
              divisions={divisions}
              customers={customers}
            />
          </CardContent>
        </Card>
      </div>

      <SalaryCostDialogs
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        dialogMode={dialogMode}
        selectedCost={selectedCost}
        setSelectedCost={setSelectedCost}
        saveChanges={saveChangesFromDialog}
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
