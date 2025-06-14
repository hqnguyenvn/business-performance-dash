
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
import { useRevenueDialog } from "@/hooks/useRevenueDialog"; // Correctly import new hook
import { useRevenueCrudOperations } from "@/hooks/useRevenueCrudOperations"; // Correctly import new hook
import { Revenue } from "@/services/revenueService"; // Keep if used for type annotations

const Revenues = () => {
  const { toast } = useToast();
  const {
    revenues,
    setRevenues, // Passed to useRevenueCrudOperations
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
    fetchData, // Passed to useRevenueCrudOperations
    handleSaveRevenue, // This is for the dialog save, comes from useRevenueData
    handleDeleteRevenue, // This is for row delete, comes from useRevenueData
  } = useRevenueData();

  const revenueCalculations = useRevenueCalculations(currencies, exchangeRates);
  const { getMonthName, getMonthNumber, calculateVNDRevenue } = revenueCalculations;

  // Use the new useRevenueDialog hook
  const {
    revenueInDialog,
    isDialogOpen,
    dialogMode,
    handleOpenDialog,
    // handleCloseDialog, // RevenueDialog uses setIsDialogOpen directly from the hook
    setIsDialogOpen,
  } = useRevenueDialog();

  // Use the new useRevenueCrudOperations hook
  const {
    handleCellEdit,
    handleAddNewRow,
    handleInsertRowBelow,
    handleCloneRevenue,
  } = useRevenueCrudOperations(
    { revenues, setRevenues, fetchData, searchParams },
    { getMonthNumber, calculateVNDRevenue } // Pass calculation functions needed by the hook
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
    // This search function's behavior depends on whether search is client-side or server-side.
    // If client-side via useTableFilter in RevenueTable, searchTerm should be passed as a prop.
    // If server-side, setSearchParams should include the search term and fetchData will use it.
    console.log("Search triggered with term:", searchTerm);
    // For now, assume RevenueTable will use `searchTerm` prop for its internal filtering,
    // or if search is server-side, `useRevenueData` would need to handle `searchParams.q`.
    // If search term is empty, refetch to clear any server-side search query.
    if (!searchTerm.trim()) {
      // Example: if server-side and searchParams had a query field 'q'
      // const { q, ...rest } = searchParams;
      // setSearchParams(rest);
      fetchData(); // Refetch if clearing a server-side search or to reset client state
    } else {
      // If server-side search is active:
      // setSearchParams(prev => ({ ...prev, q: searchTerm, page: 1 }));
      // If client-side, ensure RevenueTable receives `searchTerm`
    }
  };
  
  // Placeholder functions for CSV and Clone Data (these were simple logs)
  const handleImportCSV = () => { console.log("Import CSV clicked"); toast({title: "Import CSV: Not yet implemented."}); };
  const handleExportCSV = () => { console.log("Export CSV clicked"); toast({title: "Export CSV: Not yet implemented."}); };
  const handleCloneData = () => { console.log("Clone Data clicked"); toast({title: "Clone Data: Not yet implemented."});};


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
                onAddNewRow={handleAddNewRow} // From useRevenueCrudOperations
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
              onCellEdit={handleCellEdit} // From useRevenueCrudOperations
              onInsertRowBelow={handleInsertRowBelow} // From useRevenueCrudOperations
              onCloneRevenue={handleCloneRevenue} // From useRevenueCrudOperations
              onOpenDialog={handleOpenDialog} // From useRevenueDialog
              onDeleteRevenue={handleDeleteRevenue} // From useRevenueData
              // Pass searchTerm to RevenueTable if it handles client-side filtering with it
              // currentSearchTerm={searchTerm} 
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
        onOpenChange={setIsDialogOpen} // Control via useRevenueDialog
        revenue={revenueInDialog} // From useRevenueDialog
        mode={dialogMode} // From useRevenueDialog
        customers={customers}
        companies={companies}
        divisions={divisions}
        projects={projects}
        projectTypes={projectTypes}
        resources={resources}
        currencies={currencies}
        onSave={handleSaveRevenue} // From useRevenueData (handles create/update from dialog)
      />
    </div>
  );
}; // Ensure this closing brace for the Revenues component is correctly placed.

export default Revenues;

