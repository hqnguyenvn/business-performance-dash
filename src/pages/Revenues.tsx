
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
import { useToast } from "@/hooks/use-toast"; // Kept for any direct toast usage if needed, though most are in hooks now
import { useRevenueData } from "@/hooks/useRevenueData";
import { useRevenueCalculations } from "@/hooks/useRevenueCalculations";
import { useRevenueDialog } from "@/hooks/useRevenueDialog";
import { useRevenueCrudOperations } from "@/hooks/useRevenueCrudOperations";
import { Revenue } from "@/services/revenueService"; // Keep if used for type annotations

const Revenues = () => {
  const { toast } = useToast(); // Retain if any direct toasts are used here, otherwise can be removed.
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
    handleSaveRevenue, // This is for the dialog save, comes from useRevenueData
    handleDeleteRevenue, // This is for row delete, comes from useRevenueData
  } = useRevenueData();

  const revenueCalculations = useRevenueCalculations(currencies, exchangeRates);
  const { getMonthName, calculateVNDRevenue } = revenueCalculations;

  const {
    revenueInDialog,
    isDialogOpen,
    dialogMode,
    handleOpenDialog,
    // handleCloseDialog, // Not directly called from here, RevenueDialog uses setIsDialogOpen
    setIsDialogOpen,
  } = useRevenueDialog();

  const {
    handleCellEdit,
    handleAddNewRow,
    handleInsertRowBelow,
    handleCloneRevenue,
  } = useRevenueCrudOperations(
    { revenues, setRevenues, fetchData, searchParams },
    revenueCalculations
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
  
  // const handlePageSizeChange = (pageSize: number) => { // This was not used by PaginationControls currently
  //   setSearchParams((prev) => ({ ...prev, page: 1, pageSize }));
  // };

  const handleSearch = () => {
    // This search logic remains as it was, potentially for server-side search integration
    // or to influence filtering if RevenueTable uses `searchTerm` prop.
    // Current client-side filtering is primarily handled by `useTableFilter` within `RevenueTable`.
    console.log("Search triggered with term:", searchTerm);
    if (searchTerm.trim()) {
      // If search is server-side:
      // setSearchParams(prev => ({ ...prev, q: searchTerm, page: 1 }));
      // If client-side and RevenueTable uses a `currentSearchTerm` prop, just ensure state is updated.
      // The actual filtering happens in RevenueTable via useTableFilter.
      // For now, this function might be a placeholder or trigger an API call if searchParams includes searchTerm.
      // The useTableFilter in RevenueTable should ideally get the searchTerm.
      // Let's assume the intention is that filtering happens in RevenueTable based on a passed prop.
      // If `searchTerm` is meant for server-side, `useRevenueData`'s `fetchData` would need to use it.
      // The current `fetchData` in `useRevenueData` doesn't use a generic query `q`.
      // This `handleSearch` currently doesn't directly filter data for `RevenueTable` if `useTableFilter` is active there.
      // It's kept for structural integrity during refactor.
    } else {
      // If clearing a server-side search:
      // setSearchParams(prev => {
      //   const { q, ...rest } = prev;
      //   return { ...rest, page: 1 };
      // });
      fetchData(); // Refetch if search term was cleared and was part of API query
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
                onSearch={handleSearch} // This onSearch might need to pass searchTerm to RevenueTable's filter
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
              // currentSearchTerm={searchTerm} // Pass this if RevenueTable's useTableFilter needs it
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
};

export default Revenues;
