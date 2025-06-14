
import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import RevenueFilters from "@/components/RevenueFilters";
import RevenueTable from "@/components/RevenueTable";
import RevenueSearch from "@/components/RevenueSearch";
import RevenueActions from "@/components/RevenueActions";
import RevenueDialog from "@/components/RevenueDialog";
import PaginationControls from "@/components/PaginationControls";
import { useToast } from "@/hooks/use-toast";
import { useRevenueData } from "@/hooks/useRevenueData";
import { useRevenueCalculations } from "@/hooks/useRevenueCalculations";
import { useRevenueDialog } from "@/hooks/useRevenueDialog";
import { useRevenueCrudOperations } from "@/hooks/useRevenueCrudOperations";
import { exportRevenueCSV } from "@/utils/csvExport";
import { Revenue } from "@/services/revenueService";

const Revenues = () => {
  const { toast } = useToast();
  const {
    revenues,
    setRevenues,
    customers,
    companies,
    divisions,
    projects,
    projectTypes,
    resources,
    currencies,
    exchangeRates,
    searchParams,
    setSearchParams,
    total,
    fetchData,
    handleSaveRevenue,
    handleDeleteRevenue,
  } = useRevenueData();

  const revenueCalculations = useRevenueCalculations(currencies, exchangeRates);
  const { getMonthName, getMonthNumber, calculateVNDRevenue } = revenueCalculations;

  const {
    revenueInDialog,
    isDialogOpen,
    dialogMode,
    handleOpenDialog,
    setIsDialogOpen,
  } = useRevenueDialog();

  const {
    handleCellEdit,
    handleAddNewRow,
    handleInsertRowBelow,
    handleCloneRevenue,
  } = useRevenueCrudOperations(
    { revenues, setRevenues, fetchData, searchParams },
    { getMonthNumber, calculateVNDRevenue }
  );

  const currentPage = useMemo(() => searchParams.page || 1, [searchParams.page]);
  const itemsPerPage = useMemo(() => searchParams.pageSize || 5, [searchParams.pageSize]);
  const totalPages = useMemo(() => Math.ceil(total / itemsPerPage), [total, itemsPerPage]);
  
  const startIndex = useMemo(() => (currentPage - 1) * itemsPerPage + 1, [currentPage, itemsPerPage]);
  const endIndex = useMemo(() => Math.min(currentPage * itemsPerPage, total), [currentPage, itemsPerPage, total]);

  const [searchTerm, setSearchTerm] = useState("");

  const handleYearChange = (year: number) => {
    setSearchParams((prev) => ({ ...prev, year, page: 1 }));
  };

  const handleMonthChange = (months: number[]) => {
    setSearchParams((prev) => ({ ...prev, months, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    const effectivePageSize = searchParams.pageSize || 5;
    const calculatedTotalPages = Math.ceil(total / effectivePageSize);
    
    let newPage = page;
    if (page < 1) {
      newPage = 1;
    } else if (page > calculatedTotalPages && calculatedTotalPages > 0) {
      newPage = calculatedTotalPages;
    }
    if (searchParams.page !== newPage) {
       setSearchParams((prev) => ({ ...prev, page: newPage }));
    }
  };
  
  const handleSearch = () => {
    console.log("Search triggered with term:", searchTerm);
    if (!searchTerm.trim()) {
      fetchData();
    } else {
      // If server-side search is active:
      // setSearchParams(prev => ({ ...prev, q: searchTerm, page: 1 }));
      // If client-side, ensure RevenueTable receives `searchTerm`
    }
  };
  
  const handleImportCSV = () => { 
    console.log("Import CSV clicked"); 
    toast({title: "Import CSV: Not yet implemented."}); 
  };

  const handleExportCSV = () => {
    try {
      exportRevenueCSV({
        revenues,
        customers,
        companies,
        divisions,
        projects,
        projectTypes,
        resources,
        currencies,
        getMonthName,
        calculateVNDRevenue,
      });
      
      toast({
        title: "CSV exported successfully!",
        description: "Revenue data has been downloaded as CSV file.",
      });
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "There was an error exporting the CSV file.",
      });
    }
  };

  const handleCloneData = () => { 
    console.log("Clone Data clicked"); 
    toast({title: "Clone Data: Not yet implemented."});
  };

  return (
    <div>
      <PageHeader
        title="Revenue Management"
        description="Manage revenue information"
      />

      <div className="p-6">
        <RevenueFilters
          selectedYear={searchParams.year || new Date().getFullYear()}
          selectedMonths={searchParams.months || []}
          onYearChange={handleYearChange}
          onMonthChange={handleMonthChange}
        />

        <Card>
          <CardHeader>
            <CardTitle>Revenue Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
              <RevenueSearch
                searchTerm={searchTerm}
                onSearchTermChange={setSearchTerm}
                onSearch={handleSearch}
              />
              <RevenueActions
                onImportCSV={handleImportCSV}
                onExportCSV={handleExportCSV}
                onCloneData={handleCloneData}
                onAddNewRow={handleAddNewRow}
              />
            </div>

            <RevenueTable
              revenues={revenues}
              customers={customers}
              companies={companies}
              divisions={divisions}
              projects={projects}
              projectTypes={projectTypes}
              resources={resources}
              currencies={currencies}
              searchParams={searchParams} 
              getMonthName={getMonthName}
              calculateVNDRevenue={calculateVNDRevenue}
              onCellEdit={handleCellEdit}
              onInsertRowBelow={handleInsertRowBelow}
              onCloneRevenue={handleCloneRevenue}
              onOpenDialog={handleOpenDialog}
              onDeleteRevenue={handleDeleteRevenue}
            />
            
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              onNextPage={() => { if (currentPage < totalPages) handlePageChange(currentPage + 1);}}
              onPreviousPage={() => { if (currentPage > 1) handlePageChange(currentPage - 1);}}
              totalItems={total}
              startIndex={startIndex}
              endIndex={endIndex}
            />
          </CardContent>
        </Card>
      </div>

      <RevenueDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        revenue={revenueInDialog}
        mode={dialogMode}
        customers={customers}
        companies={companies}
        divisions={divisions}
        projects={projects}
        projectTypes={projectTypes}
        resources={resources}
        currencies={currencies}
        onSave={handleSaveRevenue}
      />
    </div>
  );
};

export default Revenues;
