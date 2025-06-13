
import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import RevenueFilters from "@/components/RevenueFilters";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import RevenueDialog from "@/components/RevenueDialog";
import { Badge } from "@/components/ui/badge";
import { Edit, Copy, Trash2, Upload, Plus, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Revenue,
  RevenueSearchParams,
  createRevenue,
  updateRevenue,
  deleteRevenue,
  getRevenues,
} from "@/services/revenueService";
import {
  MasterData,
  getMasterDatas,
} from "@/services/masterDataService";
import { formatCurrency } from "@/lib/format";
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { addMonths, format } from "date-fns"
import { DateRange } from "react-day-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import PaginationControls from "@/components/PaginationControls"
import CloneDataDialog from "@/components/CloneDataDialog"
import { NumberInput } from "@/components/ui/number-input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { exchangeRateService } from "@/services/exchangeRateService";

const Revenues = () => {
  const { toast } = useToast();
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [customers, setCustomers] = useState<MasterData[]>([]);
  const [companies, setCompanies] = useState<MasterData[]>([]);
  const [divisions, setDivisions] = useState<MasterData[]>([]);
  const [projects, setProjects] = useState<MasterData[]>([]);
  const [projectTypes, setProjectTypes] = useState<MasterData[]>([]);
  const [resources, setResources] = useState<MasterData[]>([]);
  const [currencies, setCurrencies] = useState<MasterData[]>([]);
  const [exchangeRates, setExchangeRates] = useState<any[]>([]);
  
  // Default to months 1 to current month
  const currentMonth = new Date().getMonth() + 1;
  const defaultMonths = Array.from({ length: currentMonth }, (_, i) => i + 1);
  
  const [searchParams, setSearchParams] = useState<RevenueSearchParams>({
    year: new Date().getFullYear(),
    months: defaultMonths,
    page: 1,
    pageSize: 10,
  });
  const [total, setTotal] = useState(0);
  const [revenueInDialog, setRevenueInDialog] = useState<Revenue | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit'>('view');
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [
        revenuesData,
        customersData,
        companiesData,
        divisionsData,
        projectsData,
        projectTypesData,
        resourcesData,
        currenciesData,
        exchangeRatesData,
      ] = await Promise.all([
        getRevenues(searchParams),
        getMasterDatas('customers'),
        getMasterDatas('companies'),
        getMasterDatas('divisions'),
        getMasterDatas('projects'),
        getMasterDatas('project_types'),
        getMasterDatas('resources'),
        getMasterDatas('currencies'),
        exchangeRateService.getAll(),
      ]);
      setRevenues(revenuesData.data);
      setTotal(revenuesData.total);
      setCustomers(customersData);
      setCompanies(companiesData);
      setDivisions(divisionsData);
      setProjects(projectsData);
      setProjectTypes(projectTypesData);
      setResources(resourcesData);
      setCurrencies(currenciesData);
      setExchangeRates(exchangeRatesData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem fetching data.",
      });
    }
  }, [searchParams, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleYearChange = (year: number) => {
    setSearchParams({ ...searchParams, year });
  };

  const handleMonthChange = (months: number[]) => {
    setSearchParams({ ...searchParams, months });
  };

  const handlePageChange = (page: number) => {
    setSearchParams({ ...searchParams, page });
  };

  const handlePageSizeChange = (pageSize: number) => {
    setSearchParams({ ...searchParams, page: 1, pageSize });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    // TODO: Implement search
  };

  const handleOpenDialog = (revenue: Revenue, mode: 'view' | 'edit') => {
    setRevenueInDialog(revenue);
    setDialogMode(mode);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  const handleSaveRevenue = async (revenue: Revenue) => {
    try {
      if (revenue.id) {
        await updateRevenue(revenue.id, revenue);
        toast({
          title: "Revenue record updated successfully!",
        });
      } else {
        await createRevenue(revenue);
        toast({
          title: "Revenue record created successfully!",
        });
      }
      fetchData();
    } catch (error) {
      console.error("Error saving revenue:", error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem saving the revenue record.",
      });
    } finally {
      handleCloseDialog();
    }
  };

  const handleDeleteRevenue = async (id: string) => {
    try {
      await deleteRevenue(id);
      setRevenues(revenues.filter((revenue) => revenue.id !== id));
      toast({
        title: "Revenue record deleted successfully!",
      });
    } catch (error) {
      console.error("Error deleting revenue:", error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem deleting the revenue record.",
      });
    }
  };

  const handleDuplicateRevenue = (revenue: Revenue) => {
    // TODO: Implement duplicate revenue
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

  const calculateVNDRevenue = (revenue: Revenue) => {
    if (!revenue.original_amount || !revenue.currency_id) return 0;
    
    // Find the exchange rate for the specific year and month
    const exchangeRate = exchangeRates.find(rate => 
      rate.year === revenue.year && 
      rate.month === getMonthName(revenue.month) &&
      rate.currencyID === (currencies.find(c => c.id === revenue.currency_id)?.code || '')
    );
    
    if (exchangeRate) {
      return revenue.original_amount * exchangeRate.exchangeRate;
    }
    
    return revenue.original_amount; // Default to original amount if no exchange rate found
  };

  const getMonthName = (monthNumber: number): string => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                       "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return monthNames[monthNumber - 1] || "Jan";
  };

  const handleCellEdit = async (id: string, field: keyof Revenue, value: any) => {
    try {
      setIsInlineEditing(true);
      const revenueToUpdate = revenues.find((revenue) => revenue.id === id);
      if (!revenueToUpdate) {
        console.error(`Revenue with id ${id} not found`);
        return;
      }

      // Calculate new values based on the field being updated
      let updatedRevenue = { ...revenueToUpdate, [field]: value };
      
      // Recalculate original_amount if unit_price or quantity changes
      if (field === 'unit_price' || field === 'quantity') {
        const unitPrice = field === 'unit_price' ? value : updatedRevenue.unit_price || 0;
        const quantity = field === 'quantity' ? value : updatedRevenue.quantity || 1;
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
        [field]: value,
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
    } finally {
      setIsInlineEditing(false);
      setEditingCell(null);
    }
  };

  const handleAddNewRow = async () => {
    try {
      const newRevenue: Omit<Revenue, 'id'> = {
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        customer_id: '',
        company_id: '',
        division_id: '',
        project_id: '',
        project_type_id: '',
        resource_id: '',
        currency_id: '',
        unit_price: 0,
        quantity: 1,
        original_amount: 0,
        vnd_revenue: 0,
        notes: '',
        project_name: '',
      };
      
      const createdRevenue = await createRevenue(newRevenue);
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
      const newRevenue: Omit<Revenue, 'id'> = {
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        customer_id: '',
        company_id: '',
        division_id: '',
        project_id: '',
        project_type_id: '',
        resource_id: '',
        currency_id: '',
        unit_price: 0,
        quantity: 1,
        original_amount: 0,
        vnd_revenue: 0,
        notes: '',
        project_name: '',
      };
      
      const createdRevenue = await createRevenue(newRevenue);
      
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
      const clonedRevenue = {
        ...sourceRevenue,
        id: '', // Remove id to create new record
        created_at: '',
        updated_at: '',
      };
      
      const newRevenue = await createRevenue(clonedRevenue);
      
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

  const renderEditableCell = (revenue: Revenue, field: keyof Revenue, value: any, type: 'text' | 'number' | 'select', options?: any[]) => {
    const isEditing = editingCell?.id === revenue.id && editingCell?.field === field;
    
    if (isEditing && type === 'select' && options) {
      return (
        <Select 
          value={value || ''} 
          onValueChange={(newValue) => handleCellEdit(revenue.id, field, newValue)}
          onOpenChange={(open) => {
            if (!open) setEditingCell(null);
          }}
        >
          <SelectTrigger className="w-full h-8">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    
    if (isEditing && type === 'number') {
      return (
        <Input
          type="number"
          value={value || 0}
          onChange={(e) => handleCellEdit(revenue.id, field, parseFloat(e.target.value) || 0)}
          onBlur={() => setEditingCell(null)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') setEditingCell(null);
          }}
          className="w-full h-8"
          autoFocus
        />
      );
    }
    
    if (isEditing && type === 'text') {
      return (
        <Input
          value={value || ''}
          onChange={(e) => handleCellEdit(revenue.id, field, e.target.value)}
          onBlur={() => setEditingCell(null)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') setEditingCell(null);
          }}
          className="w-full h-8"
          maxLength={field === 'project_name' ? 50 : undefined}
          autoFocus
        />
      );
    }
    
    // Display mode
    const displayValue = () => {
      if (type === 'select' && options) {
        const option = options.find(opt => opt.id === value);
        return option?.code || '';
      }
      if (type === 'number' && field === 'year') {
        return value?.toString() || '';
      }
      if (type === 'number') {
        return (value || 0).toLocaleString();
      }
      return value || '';
    };
    
    return (
      <div 
        className="w-full h-8 px-2 py-1 cursor-pointer hover:bg-gray-50 flex items-center"
        onClick={() => setEditingCell({ id: revenue.id, field })}
      >
        {displayValue()}
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        title="Revenue Management"
        description="Manage revenue information"
      />

      <div className="p-6">
        <RevenueFilters
          selectedYear={searchParams.year}
          selectedMonths={searchParams.months}
          onYearChange={handleYearChange}
          onMonthChange={handleMonthChange}
        />

        <Card>
          <CardHeader>
            <CardTitle>Revenue Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
              <Input
                type="search"
                placeholder="Search..."
                className="md:w-1/3"
                onChange={handleSearch}
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleImportCSV}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import CSV
                </Button>
                <Button variant="outline" onClick={handleExportCSV}>
                  <Upload className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <CloneDataDialog onClone={handleCloneData} />
                <Button variant="outline">
                  Save
                </Button>
                <Button onClick={handleAddNewRow}>
                  Add New
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableCaption>
                  A list of your recent revenue records.
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">No.</TableHead>
                    <TableHead className="w-[60px]">Year</TableHead>
                    <TableHead className="w-[60px]">Month</TableHead>
                    <TableHead className="w-[100px]">Customer</TableHead>
                    <TableHead className="w-[100px]">Company</TableHead>
                    <TableHead className="w-[100px]">Division</TableHead>
                    <TableHead className="w-[100px]">Project</TableHead>
                    <TableHead className="w-[120px]">Project Name</TableHead>
                    <TableHead className="w-[100px]">Project Type</TableHead>
                    <TableHead className="w-[100px]">Resource</TableHead>
                    <TableHead className="w-[80px]">Currency</TableHead>
                    <TableHead className="w-[100px] text-right">Unit Price</TableHead>
                    <TableHead className="w-[80px] text-right">Quantity</TableHead>
                    <TableHead className="w-[120px] text-right">Original Revenue</TableHead>
                    <TableHead className="w-[120px] text-right">VND Revenue</TableHead>
                    <TableHead className="w-[140px] text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revenues.map((revenue, index) => (
                    <TableRow key={revenue.id}>
                      <TableCell className="font-medium">{(searchParams.page - 1) * searchParams.pageSize + index + 1}</TableCell>
                      <TableCell>
                        {renderEditableCell(revenue, 'year', revenue.year, 'number')}
                      </TableCell>
                      <TableCell>
                        {renderEditableCell(revenue, 'month', revenue.month, 'number')}
                      </TableCell>
                      <TableCell>
                        {renderEditableCell(revenue, 'customer_id', revenue.customer_id, 'select', customers)}
                      </TableCell>
                      <TableCell>
                        {renderEditableCell(revenue, 'company_id', revenue.company_id, 'select', companies)}
                      </TableCell>
                      <TableCell>
                        {renderEditableCell(revenue, 'division_id', revenue.division_id, 'select', divisions)}
                      </TableCell>
                      <TableCell>
                        {renderEditableCell(revenue, 'project_id', revenue.project_id, 'select', projects)}
                      </TableCell>
                      <TableCell>
                        {renderEditableCell(revenue, 'project_name', revenue.project_name, 'text')}
                      </TableCell>
                      <TableCell>
                        {renderEditableCell(revenue, 'project_type_id', revenue.project_type_id, 'select', projectTypes)}
                      </TableCell>
                      <TableCell>
                        {renderEditableCell(revenue, 'resource_id', revenue.resource_id, 'select', resources)}
                      </TableCell>
                      <TableCell>
                        {renderEditableCell(revenue, 'currency_id', revenue.currency_id, 'select', currencies)}
                      </TableCell>
                      <TableCell className="text-right">
                        {renderEditableCell(revenue, 'unit_price', revenue.unit_price, 'number')}
                      </TableCell>
                      <TableCell className="text-right">
                        {renderEditableCell(revenue, 'quantity', revenue.quantity, 'number')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="px-2 py-1">
                          {(revenue.original_amount || 0).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="px-2 py-1">
                          {calculateVNDRevenue(revenue).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleInsertRowBelow(index)}
                            title="Add"
                            className="h-8 w-8"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleCloneRevenue(revenue, index)}
                            title="Clone"
                            className="h-8 w-8"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleOpenDialog(revenue, 'view')}
                            title="View"
                            className="h-8 w-8"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleOpenDialog(revenue, 'edit')}
                            title="Edit"
                            className="h-8 w-8"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="icon"
                                title="Delete"
                                className="h-8 w-8"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this revenue record? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteRevenue(revenue.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <PaginationControls
              currentPage={searchParams.page}
              totalPages={Math.ceil(total / searchParams.pageSize)}
              onPageChange={handlePageChange}
              onNextPage={() => handlePageChange(searchParams.page + 1)}
              onPreviousPage={() => handlePageChange(searchParams.page - 1)}
              totalItems={total}
              startIndex={(searchParams.page - 1) * searchParams.pageSize + 1}
              endIndex={Math.min(searchParams.page * searchParams.pageSize, total)}
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
