import React, { useState } from "react";
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
import { usePagination } from "@/hooks/usePagination";
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
  const {
    currentPage,
    totalPages,
    paginatedData: paginatedRevenues,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    totalItems,
    startIndex,
    endIndex,
  } = usePagination({ data: revenues, itemsPerPage: 5 });

  const [revenueInDialog, setRevenueInDialog] = useState<Revenue | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit'>('view');
  const [searchTerm, setSearchTerm] = useState("");

  const handleYearChange = (year: number) => {
    setSearchParams({ ...searchParams, year, page: 1 });
  };

  const handleMonthChange = (months: number[]) => {
    setSearchParams({ ...searchParams, months, page: 1 });
  };

  const handlePageChange = (page: number) => {
    setSearchParams({ ...searchParams, page });
  };

  const handlePageSizeChange = (pageSize: number) => {
    setSearchParams({ ...searchParams, page: 1, pageSize });
  };

  const handleSearch = () => {
    // Filter revenues based on search term
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
      
      // Update displayed data without changing API params
      setRevenues(filtered);
    } else {
      // Reset to original data
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
      setRevenues(updatedRevenues);

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
      
      const createdRevenue = await createRevenue(newRevenue);
      console.log('New revenue created:', createdRevenue);
      
      // Add to the end of current revenues list
      setRevenues([...revenues, createdRevenue]);
      
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
    try {
      console.log('Inserting row below index:', afterIndex);
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
      
      const createdRevenue = await createRevenue(newRevenue);
      console.log('New revenue created:', createdRevenue);
      
      // Insert the new row at the correct position
      const updatedRevenues = [...revenues];
      updatedRevenues.splice(afterIndex + 1, 0, createdRevenue);
      setRevenues(updatedRevenues);
      
      toast({
        title: "New revenue record inserted successfully!",
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
    try {
      console.log('Cloning revenue:', sourceRevenue);
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
      
      const newRevenue = await createRevenue(clonedData);
      console.log('Cloned revenue created:', newRevenue);
      
      // Insert the new revenue right after the source revenue in the list
      const updatedRevenues = [...revenues];
      updatedRevenues.splice(afterIndex + 1, 0, newRevenue);
      setRevenues(updatedRevenues);
      
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
              revenues={paginatedRevenues}
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
              onPageChange={goToPage}
              onNextPage={goToNextPage}
              onPreviousPage={goToPreviousPage}
              totalItems={totalItems}
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
