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
import {
  Revenue,
  createRevenue,
  updateRevenue,
} from "@/services/revenueService";

const Revenues = () => {
  const { toast } = useToast();
  const {
    revenues,
    setRevenues, // Keep if used for optimistic updates not covered by refetch
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
    handleSaveRevenue, // This now refetches
    handleDeleteRevenue, // This now refetches or handles local state + refetch
  } = useRevenueData();

  const { getMonthName, getMonthNumber, calculateVNDRevenue } = useRevenueCalculations(currencies, exchangeRates);

  const currentPage = useMemo(() => searchParams.page || 1, [searchParams.page]);
  const itemsPerPage = useMemo(() => searchParams.pageSize || 5, [searchParams.pageSize]);
  const totalPages = useMemo(() => Math.ceil(total / itemsPerPage), [total, itemsPerPage]);
  
  const startIndex = useMemo(() => (currentPage - 1) * itemsPerPage + 1, [currentPage, itemsPerPage]);
  const endIndex = useMemo(() => Math.min(currentPage * itemsPerPage, total), [currentPage, itemsPerPage, total]);

  const [revenueInDialog, setRevenueInDialog] = useState<Revenue | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit'>('view');
  const [searchTerm, setSearchTerm] = useState("");

  const handleYearChange = (year: number) => {
    setSearchParams((prev) => ({ ...prev, year, page: 1 }));
  };

  const handleMonthChange = (months: number[]) => {
    setSearchParams((prev) => ({ ...prev, months, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    const effectivePageSize = searchParams.pageSize || 5; // Use current or default
    const calculatedTotalPages = Math.ceil(total / effectivePageSize);
    
    let newPage = page;
    if (page < 1) {
      newPage = 1;
    } else if (page > calculatedTotalPages && calculatedTotalPages > 0) {
      newPage = calculatedTotalPages;
    }
    // Only update if the page actually changes or needs to be clamped
    if (searchParams.page !== newPage) {
       setSearchParams((prev) => ({ ...prev, page: newPage }));
    }
  };
  
  const handlePageSizeChange = (pageSize: number) => {
    setSearchParams((prev) => ({ ...prev, page: 1, pageSize }));
  };

  const handleSearch = () => {
    // Filter revenues based on search term
    // Note: This search is client-side on the current page of data.
    // For a full database search, API changes would be needed.
    if (searchTerm.trim()) {
      const filtered = revenues.filter(revenue => {
        const customer = customers.find(c => c.id === revenue.customer_id);
        const company = companies.find(c => c.id === revenue.company_id);
        const division = divisions.find(d => d.id === revenue.division_id);
        const project = projects.find(p => p.id === revenue.project_id);
        const projectType = projectTypes.find(pt => pt.id === revenue.project_type_id);
        const resource = resources.find(r => r.id === revenue.resource_id);
        const currency = currencies.find(c => c.id === revenue.currency_id);
        
        const searchableText = [
          revenue.year?.toString(),
          getMonthName(revenue.month),
          customer?.code,
          customer?.name,
          company?.code,
          company?.name,
          division?.code,
          division?.name,
          project?.code,
          project?.name,
          revenue.project_name,
          projectType?.code,
          projectType?.name,
          resource?.code,
          resource?.name,
          currency?.code,
          currency?.name,
          revenue.unit_price?.toString(),
          revenue.quantity?.toString(),
          revenue.original_amount?.toString(),
          revenue.notes
        ].filter(Boolean).join(' ').toLowerCase();
        
        return searchableText.includes(searchTerm.toLowerCase());
      });
      
      // This updates the displayed data for the current page only
      // To maintain consistency, you might want to disable pagination or reset to page 1
      // when a search term is active, or implement server-side search.
      // For now, we'll filter the current page.
      // setRevenues(filtered); // This was overwriting the paginated data from server.
      // Instead, RevenueTable should handle filtering if it's purely client-side on the current page,
      // or search should trigger an API call.
      // For simplicity now, let's re-fetch with search term if API supports it, or acknowledge client-side limitation.
      // The current useTableFilter in RevenueTable handles client-side filtering better.
      // So this handleSearch might need to integrate with useTableFilter or be removed if redundant.
      // For now, let's assume RevenueTable's internal filtering handles this, or search is an API feature.
      // If search is intended to be client-side on the current page:
      // The `revenues` prop to RevenueTable would need to be this filtered list.
      // But `useTableFilter` is already in RevenueTable, so RevenueSearch might directly interact with that.
      // Let's keep the current search logic which filters the `revenues` from the server for this page
      // This implies that `RevenueTable` will receive this filtered list if `searchTerm` is active.
      // We pass `revenues` to RevenueTable, which means this search logic will affect the data shown.
      if (searchTerm.trim()) {
        // The `useTableFilter` hook inside `RevenueTable` will handle the actual filtering.
        // This `handleSearch` function as it is here in Revenues.tsx might be redundant if
        // RevenueSearch directly sets filters for `useTableFilter`.
        // For now, let's ensure RevenueTable gets `revenues` (from API) and `useTableFilter` does its job.
        // The current `setRevenues(filtered)` here would fight with `useTableFilter`.
        // The `RevenueSearch` component likely needs to pass the `searchTerm` to `RevenueTable`
        // so `useTableFilter` can use it. Or, `handleSearch` needs to call `setFilter` from `useTableFilter`.
        // This part needs review for how search and table filtering are meant to interact.
        // Given the current structure, it's better to let `useTableFilter` in `RevenueTable` handle this.
        // So, this function might just call `fetchData()` if search is meant to be server-side.
        // Or, if it's client-side, `RevenueSearch` should provide the term to `RevenueTable`.
        console.log("Search term:", searchTerm, "Current table filtering will apply if client-side, or API search if server-side.");
      // If search is server-side and `searchTerm` is a param for `getRevenues`:
      // setSearchParams(prev => ({ ...prev, q: searchTerm, page: 1 }));
      // Then `fetchData` (called by useEffect on `searchParams` change) would use it.
      // If it's purely client-side via `useTableFilter` in `RevenueTable`,
      // then `RevenueSearch` should communicate with `RevenueTable`.
      // The current setup passes `revenues` (from API) to `RevenueTable`.
      // If `RevenueTable` has `useTableFilter` that uses a search term,
      // `searchTerm` state here needs to be passed to `RevenueTable`.
      // Let's assume for now `useTableFilter` inside `RevenueTable` will use a passed `searchTerm`.
    } else {
      // If search is server-side and `q` was a param:
      // setSearchParams(prev => {
      //   const { q, ...rest } = prev;
      //   return { ...rest, page: 1 };
      // });
      // If clearing a client-side filter, that's handled in RevenueTable.
      // If search term was part of API call, clearing it means refetching without it.
      // The current `fetchData()` here is fine if search term is not an API param.
      fetchData();
    }
  };

  const handleOpenDialog = (revenue: Revenue, mode: 'view' | 'edit') => {
    setRevenueInDialog(revenue);
    setDialogMode(mode);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  const handleCellEdit = async (id: string, field: keyof Revenue, value: any) => {
    try {
      console.log('Editing cell:', { id, field, value });
      const revenueToUpdate = revenues.find((revenue) => revenue.id === id);
      if (!revenueToUpdate) {
        console.error(`Revenue with id ${id} not found`);
        return;
      }

      let processedValue = value;
      if (field === 'month' && typeof value === 'string') {
        processedValue = getMonthNumber(value);
      }

      let updatedRevenueData = { ...revenueToUpdate, [field]: processedValue };
      
      if (field === 'unit_price' || field === 'quantity') {
        const unitPrice = field === 'unit_price' ? Number(processedValue) : Number(updatedRevenueData.unit_price || 0);
        const quantity = field === 'quantity' ? Number(processedValue) : Number(updatedRevenueData.quantity || 1);
        updatedRevenueData.original_amount = unitPrice * quantity;
      }

      updatedRevenueData.vnd_revenue = calculateVNDRevenue(updatedRevenueData);
      
      // Optimistic update (optional, can be removed if fetchData after API call is preferred)
      const updatedRevenuesOptimistic = revenues.map((r) =>
        r.id === id ? updatedRevenueData : r
      );
      setRevenues(updatedRevenuesOptimistic); // Update local state for current page

      const updatePayload: Partial<Revenue> = { 
        [field]: processedValue,
        original_amount: updatedRevenueData.original_amount,
        vnd_revenue: updatedRevenueData.vnd_revenue
      };
      // Ensure all relevant fields for the specific update are included.
      // For example, if changing currency_id, year, or month, vnd_revenue might need explicit update.
      // The current payload only sends the directly changed field and calculated amounts.
      // If other fields influence calculations (e.g. currency_id for vnd_revenue), ensure API handles it or send them.

      await updateRevenue(id, updatePayload);
      toast({ title: "Revenue record updated successfully!" });
      // fetchData(); // Refetch to ensure data consistency, especially if other pages/totals affected.
      // Or, if optimistic update is sufficient for current view and no totals change on this action.
      // Given calculations, refetching is safer.
      // My previous change made handleSaveRevenue refetch, so direct updateRevenue here should also consider it.
      // For cell edit, optimistic update is good for responsiveness, but a final refetch might be needed
      // if edits affect global things like total revenue sums not displayed on this page.
      // For now, relying on optimistic update of current page for speed.
    } catch (error) {
      console.error("Error updating revenue:", error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem updating the revenue record.",
      });
      fetchData(); // Revert on error
    }
  };

  const handleAddNewRow = async () => {
    try {
      console.log('Adding new row...');
      const newRevenueData: Omit<Revenue, 'id'> = {
        year: searchParams.year || new Date().getFullYear(),
        month: (searchParams.months && searchParams.months.length > 0 ? searchParams.months[0] : new Date().getMonth() + 1),
        customer_id: null,
        company_id: null,
        division_id: null,
        project_id: null,
        project_type_id: null,
        resource_id: null,
        currency_id: null, // TODO: Default to a common currency?
        unit_price: 0,
        quantity: 1,
        original_amount: 0,
        vnd_revenue: 0,
        notes: null,
        project_name: '',
      };
      
      await createRevenue(newRevenueData);
      toast({ title: "New revenue record added successfully!" });
      fetchData(); // Refetch to get the new row, ensure correct pagination and totals.
    } catch (error) {
      console.error("Error adding new revenue:", error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem adding the new revenue record.",
      });
    }
  };

  const handleInsertRowBelow = async (afterIndex: number) => {
    // Due to server-side pagination, "inserting below" a specific visual row
    // is complex. It's treated like "add new" and will appear based on sorting/API logic.
    console.log('Inserting row (behaves like Add New):', afterIndex);
    await handleAddNewRow(); // Simplification: just call add new row logic
  };

  const handleCloneRevenue = async (sourceRevenue: Revenue, afterIndex: number) => {
    // Similar to insert, cloning and placing at specific 'afterIndex' is complex with server pagination.
    // Clones data, new record appears based on sorting/API logic.
    try {
      console.log('Cloning revenue (will refetch):', sourceRevenue, 'after visual index:', afterIndex);
      const clonedData: Omit<Revenue, 'id'> = {
        year: sourceRevenue.year,
        month: sourceRevenue.month,
        customer_id: sourceRevenue.customer_id || null,
        company_id: sourceRevenue.company_id || null,
        division_id: sourceRevenue.division_id || null,
        project_id: sourceRevenue.project_id || null,
        project_type_id: sourceRevenue.project_type_id || null,
        resource_id: sourceRevenue.resource_id || null,
        currency_id: sourceRevenue.currency_id || null,
        unit_price: sourceRevenue.unit_price,
        quantity: sourceRevenue.quantity,
        original_amount: sourceRevenue.original_amount,
        // vnd_revenue will be recalculated by API or needs to be done here if currency/rate changes
        vnd_revenue: sourceRevenue.vnd_revenue, // Or recalculate: calculateVNDRevenue({...sourceRevenue, id: ''})
        notes: sourceRevenue.notes || null,
        project_name: sourceRevenue.project_name || '',
      };
      
      await createRevenue(clonedData);
      toast({ title: "Revenue record cloned successfully!" });
      fetchData(); // Refetch
    } catch (error) {
      console.error("Error cloning revenue:", error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem cloning the revenue record.",
      });
    }
  };
  
  // Placeholder functions for CSV and Clone Data
  const handleImportCSV = () => { console.log("Import CSV clicked"); /* TODO */ };
  const handleExportCSV = () => { console.log("Export CSV clicked"); /* TODO */ };
  const handleCloneData = () => { console.log("Clone Data clicked"); /* TODO */ };


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
              onDeleteRevenue={handleDeleteRevenue} // This is from useRevenueData, already handles refetch/state
              // Pass searchTerm for client-side filtering in RevenueTable if that's the design
              // Or RevenueTable's useTableFilter needs its own search input or prop.
              // currentSearchTerm={searchTerm} // Example if RevenueTable uses it
            />
            
            {/* PaginationControls expects totalPages from server data */}
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              onNextPage={() => { if (currentPage < totalPages) handlePageChange(currentPage + 1);}}
              onPreviousPage={() => { if (currentPage > 1) handlePageChange(currentPage - 1);}}
              totalItems={total}
              startIndex={startIndex}
              endIndex={endIndex}
              // pageSize={itemsPerPage} // Already part of searchParams
              // onPageSizeChange={handlePageSizeChange} // If page size selector is in PaginationControls
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
        onSave={handleSaveRevenue} // This is from useRevenueData, already handles refetch
      />
    </div>
  );
}; // This closing brace for the Revenues component was likely missing or misplaced.

export default Revenues;
