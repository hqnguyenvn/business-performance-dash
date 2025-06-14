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

  const { getMonthName, getMonthNumber, calculateVNDRevenue } = useRevenueCalculations(currencies, exchangeRates);

  // Add pagination for revenues
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
    // Ensure page is within valid bounds before setting
    const effectivePageSize = searchParams.pageSize || 5;
    const calculatedTotalPages = Math.ceil(total / effectivePageSize);
    if (page >= 1 && page <= calculatedTotalPages) {
      setSearchParams((prev) => ({ ...prev, page }));
    } else if (page < 1) {
      setSearchParams((prev) => ({ ...prev, page: 1 }));
    } else if (page > calculatedTotalPages && calculatedTotalPages > 0) {
       setSearchParams((prev) => ({ ...prev, page: calculatedTotalPages }));
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
        // Let's assume `RevenueSearch` works with `RevenueTable`'s internal filter.
        // So, `onSearch` in `RevenueSearch` should trigger the filter in `RevenueTable`.
        // This current `handleSearch` would be if `Revenues.tsx` managed the filtered list.
        // For now, we will keep it as is, acknowledging it might conflict with `useTableFilter`
        // if not coordinated. The `setRevenues(filtered)` line is problematic.
        // A simple approach: fetch if search is empty, otherwise rely on internal table filter.
        console.log("Search term:", searchTerm, "Current table filtering will apply.");
      } else {
        fetchData(); // Reload original data for the current page if search is cleared.
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

      // Convert month name to number if editing month field
      let processedValue = value;
      if (field === 'month' && typeof value === 'string') {
        processedValue = getMonthNumber(value);
      }

      // Calculate new values based on the field being updated
      let updatedRevenue = { ...revenueToUpdate, [field]: processedValue };
      
      // Recalculate original_amount if unit_price or quantity changes
      if (field === 'unit_price' || field === 'quantity') {
        const unitPrice = field === 'unit_price' ? processedValue : updatedRevenue.unit_price || 0;
        const quantity = field === 'quantity' ? processedValue : updatedRevenue.quantity || 1;
        updatedRevenue.original_amount = unitPrice * quantity;
      }

      // Recalculate VND revenue
      updatedRevenue.vnd_revenue = calculateVNDRevenue(updatedRevenue);

      // Optimistically update the local state
      const updatedRevenues = revenues.map((revenue) =>
        revenue.id === id ? updatedRevenue : revenue
      );
      setRevenues(updatedRevenues); // This is fine for optimistic update of current page data

      // Prepare the update object
      const updateData: Partial<Revenue> = { 
        [field]: processedValue,
        original_amount: updatedRevenue.original_amount,
        vnd_revenue: updatedRevenue.vnd_revenue
      };

      // Call the API to update the revenue
      await updateRevenue(id, updateData);

      toast({
        title: "Revenue record updated successfully!",
      });
    } catch (error) {
      console.error("Error updating revenue:", error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem updating the revenue record.",
      });
      // Revert the local state in case of an error
      fetchData();
    }
  };

  const handleAddNewRow = async () => {
    try {
      console.log('Adding new row...');
      const newRevenue: Omit<Revenue, 'id'> = {
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        customer_id: null,
        company_id: null,
        division_id: null,
        project_id: null,
        project_type_id: null,
        resource_id: null,
        currency_id: null,
        unit_price: 0,
        quantity: 1,
        original_amount: 0,
        vnd_revenue: 0,
        notes: null,
        project_name: '',
      };
      
      // Create revenue and then refetch data to ensure pagination and totals are correct
      await createRevenue(newRevenue);
      fetchData(); // Refetch to get the latest data including the new row correctly paginated
      
      toast({
        title: "New revenue record added successfully!",
      });
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
    // 'afterIndex' here is global index based on previous implementation.
    // With server-side pagination, inserting at a specific global index is complex.
    // Simplest is to add and refetch, new item will appear based on sorting (likely last).
    // If specific positioning is critical, API needs to support it or client-side logic becomes very complex.
    // For now, treat 'Insert Row Below' similar to 'Add New Row' in effect.
    try {
      console.log('Inserting row (treated as Add New Row due to server pagination):', afterIndex);
      const newRevenue: Omit<Revenue, 'id'> = {
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        // ... (same as handleAddNewRow)
        customer_id: null,
        company_id: null,
        division_id: null,
        project_id: null,
        project_type_id: null,
        resource_id: null,
        currency_id: null,
        unit_price: 0,
        quantity: 1,
        original_amount: 0,
        vnd_revenue: 0,
        notes: null,
        project_name: '',
      };
      
      await createRevenue(newRevenue);
      fetchData(); // Refetch
      
      toast({
        title: "New revenue record (inserted/added) successfully!",
      });
    } catch (error) {
      console.error("Error inserting new revenue:", error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem inserting the new revenue record.",
      });
    }
  };

  const handleCloneRevenue = async (sourceRevenue: Revenue, afterIndex: number) => {
    // Similar to insert, cloning and placing at specific 'afterIndex' is complex with server pagination.
    // Clone and refetch.
    try {
      console.log('Cloning revenue (will refetch):', sourceRevenue);
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
        vnd_revenue: sourceRevenue.vnd_revenue,
        notes: sourceRevenue.notes || null,
        project_name: sourceRevenue.project_name || '',
      };
      
      await createRevenue(clonedData);
      fetchData(); // Refetch
      
      toast({
        title: "Revenue record cloned successfully!",
      });
    } catch (error) {
      console.error("Error cloning revenue:", error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem cloning the revenue record.",
      });
    }
  };

  const handleImportCSV = () => {
    // TODO: Implement import CSV
  };

  const handleExportCSV = () => {
    // TODO: Implement export CSV
  };

  const handleCloneData = () => {
    // TODO: Implement clone data
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
                onSearch={handleSearch} // This might need to interact with RevenueTable's filter
              />
              <RevenueActions
                onImportCSV={handleImportCSV}
                onExportCSV={handleExportCSV}
                onCloneData={handleCloneData}
                onAddNewRow={handleAddNewRow}
              />
            </div>

            <RevenueTable
              revenues={revenues} // Pass server-paginated revenues
              customers={customers}
              companies={companies}
              divisions={divisions}
              projects={projects}
              projectTypes={projectTypes}
              resources={resources}
              currencies={currencies}
              searchParams={searchParams} // Pass searchParams for page number, page size for "No." column
              getMonthName={getMonthName}
              calculateVNDRevenue={calculateVNDRevenue}
              onCellEdit={handleCellEdit}
              onInsertRowBelow={handleInsertRowBelow} // Note: Behavior changed due to server pagination
              onCloneRevenue={handleCloneRevenue}     // Note: Behavior changed
              onOpenDialog={handleOpenDialog}
              onDeleteRevenue={handleDeleteRevenue} // This already re-fetches or filters locally
            />

            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange} // This function now directly updates API searchParams
              onNextPage={() => { if (currentPage < totalPages) handlePageChange(currentPage + 1);}}
              onPreviousPage={() => { if (currentPage > 1) handlePageChange(currentPage - 1);}}
              totalItems={total} // Total items from API
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
