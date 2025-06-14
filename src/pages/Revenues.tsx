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
import { Edit, Copy, Trash2, Upload, Plus, Eye, Search } from "lucide-react";
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
import { useTableFilter } from "@/hooks/useTableFilter";

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
  const [searchTerm, setSearchTerm] = useState("");

  // Table filtering
  const { filteredData, setFilter, clearAllFilters, getActiveFilters } = useTableFilter(revenues);

  const fetchData = useCallback(async () => {
    try {
      console.log('Fetching data with params:', searchParams);
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

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
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

  const getMonthName = (monthNumber: number): string => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                       "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return monthNames[monthNumber - 1] || "Jan";
  };

  const getMonthNumber = (monthName: string): number => {
    const monthMap: { [key: string]: number } = {
      'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4,
      'May': 5, 'Jun': 6, 'Jul': 7, 'Aug': 8,
      'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
    };
    return monthMap[monthName] || 1;
  };

  const calculateVNDRevenue = (revenue: Revenue) => {
    if (!revenue.original_amount || !revenue.currency_id) return 0;
    
    // Find the currency code first
    const currency = currencies.find(c => c.id === revenue.currency_id);
    if (!currency) return 0;
    
    // Find the exchange rate for the specific year and month
    const exchangeRate = exchangeRates.find(rate => 
      rate.year === revenue.year && 
      rate.month === getMonthName(revenue.month) &&
      rate.currencyID === currency.code
    );
    
    if (exchangeRate) {
      return revenue.original_amount * exchangeRate.exchangeRate;
    }
    
    return 0;
  };

  const handleCellEdit = async (id: string, field: keyof Revenue, value: any) => {
    try {
      console.log('Editing cell:', { id, field, value });
      setIsInlineEditing(true);
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
    } finally {
      setIsInlineEditing(false);
      setEditingCell(null);
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

  const renderEditableCell = (revenue: Revenue, field: keyof Revenue, value: any, type: 'text' | 'number' | 'select' | 'month', options?: any[]) => {
    const isEditing = editingCell?.id === revenue.id && editingCell?.field === field;
    
    if (isEditing && type === 'select' && options) {
      return (
        <Select 
          value={value || ''} 
          onValueChange={(newValue) => handleCellEdit(revenue.id, field, newValue)}
          onOpenChange={(open) => {
            if (!open) setEditingCell(null);
          }}
          open={true}
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

    if (isEditing && type === 'month') {
      const monthOptions = [
        { value: 1, label: 'Jan' }, { value: 2, label: 'Feb' }, { value: 3, label: 'Mar' },
        { value: 4, label: 'Apr' }, { value: 5, label: 'May' }, { value: 6, label: 'Jun' },
        { value: 7, label: 'Jul' }, { value: 8, label: 'Aug' }, { value: 9, label: 'Sep' },
        { value: 10, label: 'Oct' }, { value: 11, label: 'Nov' }, { value: 12, label: 'Dec' }
      ];
      
      return (
        <Select 
          value={value?.toString() || ''} 
          onValueChange={(newValue) => handleCellEdit(revenue.id, field, parseInt(newValue))}
          onOpenChange={(open) => {
            if (!open) setEditingCell(null);
          }}
          open={true}
        >
          <SelectTrigger className="w-full h-8">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((option) => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
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
          step={field === 'quantity' ? "0.1" : "1"}
          value={value || 0}
          onChange={(e) => {
            const newValue = parseFloat(e.target.value) || 0;
            handleCellEdit(revenue.id, field, newValue);
          }}
          onBlur={(e) => {
            const newValue = parseFloat(e.target.value) || 0;
            handleCellEdit(revenue.id, field, newValue);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const newValue = parseFloat((e.target as HTMLInputElement).value) || 0;
              handleCellEdit(revenue.id, field, newValue);
            }
          }}
          className="w-full h-8 text-right"
          autoFocus
        />
      );
    }
    
    if (isEditing && type === 'text') {
      return (
        <Input
          value={value || ''}
          onChange={(e) => handleCellEdit(revenue.id, field, e.target.value)}
          onBlur={(e) => handleCellEdit(revenue.id, field, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleCellEdit(revenue.id, field, (e.target as HTMLInputElement).value);
            }
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
      if (field === 'year') {
        return value?.toString() || '';
      }
      if (field === 'month') {
        return getMonthName(value);
      }
      if (type === 'number') {
        if (field === 'quantity') {
          return (value || 0).toFixed(1);
        }
        return (value || 0).toLocaleString();
      }
      return value || '';
    };
    
    const alignmentClass = (type === 'number' || field === 'unit_price' || field === 'quantity') ? 'text-right' : '';
    
    return (
      <div 
        className={`w-full h-8 px-2 py-1 cursor-pointer hover:bg-gray-50 flex items-center ${alignmentClass}`}
        onClick={() => setEditingCell({ id: revenue.id, field })}
      >
        {displayValue()}
      </div>
    );
  };

  // Prepare filter data for table filters
  const getFilterData = (field: string) => {
    return revenues.map(revenue => {
      let value = revenue[field as keyof Revenue];
      
      // Convert IDs to codes for display
      if (field === 'customer_id') {
        const customer = customers.find(c => c.id === value);
        value = customer?.code || '';
      } else if (field === 'company_id') {
        const company = companies.find(c => c.id === value);
        value = company?.code || '';
      } else if (field === 'division_id') {
        const division = divisions.find(d => d.id === value);
        value = division?.code || '';
      } else if (field === 'project_id') {
        const project = projects.find(p => p.id === value);
        value = project?.code || '';
      } else if (field === 'project_type_id') {
        const projectType = projectTypes.find(pt => pt.id === value);
        value = projectType?.code || '';
      } else if (field === 'resource_id') {
        const resource = resources.find(r => r.id === value);
        value = resource?.code || '';
      } else if (field === 'currency_id') {
        const currency = currencies.find(c => c.id === value);
        value = currency?.code || '';
      } else if (field === 'month') {
        value = getMonthName(value as number);
      }
      
      return { [field]: value };
    });
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
              <div className="flex gap-2 md:w-1/3">
                <Input
                  type="search"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  className="flex-1"
                />
                <Button variant="outline" onClick={handleSearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
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

            <div className="border rounded-lg">
              <div className="overflow-x-auto max-h-[600px]">
                <Table>
                  <TableCaption>
                    A list of your recent revenue records.
                  </TableCaption>
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow>
                      <TableHead className="w-[50px] border-r">No.</TableHead>
                      <TableHead 
                        className="w-[60px] border-r"
                        showFilter={true}
                        filterData={getFilterData('year')}
                        filterField="year"
                        onFilter={setFilter}
                        activeFilters={getActiveFilters('year')}
                      >
                        Year
                      </TableHead>
                      <TableHead 
                        className="w-[60px] border-r"
                        showFilter={true}
                        filterData={getFilterData('month')}
                        filterField="month"
                        onFilter={setFilter}
                        activeFilters={getActiveFilters('month')}
                      >
                        Month
                      </TableHead>
                      <TableHead 
                        className="w-[100px] border-r"
                        showFilter={true}
                        filterData={getFilterData('customer_id')}
                        filterField="customer_id"
                        onFilter={setFilter}
                        activeFilters={getActiveFilters('customer_id')}
                      >
                        Customer
                      </TableHead>
                      <TableHead 
                        className="w-[100px] border-r"
                        showFilter={true}
                        filterData={getFilterData('company_id')}
                        filterField="company_id"
                        onFilter={setFilter}
                        activeFilters={getActiveFilters('company_id')}
                      >
                        Company
                      </TableHead>
                      <TableHead 
                        className="w-[100px] border-r"
                        showFilter={true}
                        filterData={getFilterData('division_id')}
                        filterField="division_id"
                        onFilter={setFilter}
                        activeFilters={getActiveFilters('division_id')}
                      >
                        Division
                      </TableHead>
                      <TableHead 
                        className="w-[100px] border-r"
                        showFilter={true}
                        filterData={getFilterData('project_id')}
                        filterField="project_id"
                        onFilter={setFilter}
                        activeFilters={getActiveFilters('project_id')}
                      >
                        Project
                      </TableHead>
                      <TableHead 
                        className="w-[120px] border-r"
                        showFilter={true}
                        filterData={getFilterData('project_name')}
                        filterField="project_name"
                        onFilter={setFilter}
                        activeFilters={getActiveFilters('project_name')}
                      >
                        Project Name
                      </TableHead>
                      <TableHead 
                        className="w-[100px] border-r"
                        showFilter={true}
                        filterData={getFilterData('project_type_id')}
                        filterField="project_type_id"
                        onFilter={setFilter}
                        activeFilters={getActiveFilters('project_type_id')}
                      >
                        Project Type
                      </TableHead>
                      <TableHead 
                        className="w-[100px] border-r"
                        showFilter={true}
                        filterData={getFilterData('resource_id')}
                        filterField="resource_id"
                        onFilter={setFilter}
                        activeFilters={getActiveFilters('resource_id')}
                      >
                        Resource
                      </TableHead>
                      <TableHead 
                        className="w-[80px] border-r"
                        showFilter={true}
                        filterData={getFilterData('currency_id')}
                        filterField="currency_id"
                        onFilter={setFilter}
                        activeFilters={getActiveFilters('currency_id')}
                      >
                        Currency
                      </TableHead>
                      <TableHead className="w-[100px] text-right border-r">Unit Price</TableHead>
                      <TableHead className="w-[80px] text-right border-r">BMM</TableHead>
                      <TableHead className="w-[120px] text-right border-r">Original Revenue</TableHead>
                      <TableHead className="w-[120px] text-right border-r">VND Revenue</TableHead>
                      <TableHead 
                        className="w-[120px] border-r"
                        showFilter={true}
                        filterData={getFilterData('notes')}
                        filterField="notes"
                        onFilter={setFilter}
                        activeFilters={getActiveFilters('notes')}
                      >
                        Notes
                      </TableHead>
                      <TableHead className="w-[140px] text-center sticky right-0 bg-white border-l-2 border-gray-200 z-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((revenue, index) => (
                      <TableRow key={revenue.id}>
                        <TableCell className="font-medium border-r">{(searchParams.page! - 1) * searchParams.pageSize! + index + 1}</TableCell>
                        <TableCell className="border-r">
                          {renderEditableCell(revenue, 'year', revenue.year, 'number')}
                        </TableCell>
                        <TableCell className="border-r">
                          {renderEditableCell(revenue, 'month', revenue.month, 'month')}
                        </TableCell>
                        <TableCell className="border-r">
                          {renderEditableCell(revenue, 'customer_id', revenue.customer_id, 'select', customers)}
                        </TableCell>
                        <TableCell className="border-r">
                          {renderEditableCell(revenue, 'company_id', revenue.company_id, 'select', companies)}
                        </TableCell>
                        <TableCell className="border-r">
                          {renderEditableCell(revenue, 'division_id', revenue.division_id, 'select', divisions)}
                        </TableCell>
                        <TableCell className="border-r">
                          {renderEditableCell(revenue, 'project_id', revenue.project_id, 'select', projects)}
                        </TableCell>
                        <TableCell className="border-r">
                          {renderEditableCell(revenue, 'project_name', revenue.project_name, 'text')}
                        </TableCell>
                        <TableCell className="border-r">
                          {renderEditableCell(revenue, 'project_type_id', revenue.project_type_id, 'select', projectTypes)}
                        </TableCell>
                        <TableCell className="border-r">
                          {renderEditableCell(revenue, 'resource_id', revenue.resource_id, 'select', resources)}
                        </TableCell>
                        <TableCell className="border-r">
                          {renderEditableCell(revenue, 'currency_id', revenue.currency_id, 'select', currencies)}
                        </TableCell>
                        <TableCell className="text-right border-r">
                          {renderEditableCell(revenue, 'unit_price', revenue.unit_price, 'number')}
                        </TableCell>
                        <TableCell className="text-right border-r">
                          {renderEditableCell(revenue, 'quantity', revenue.quantity, 'number')}
                        </TableCell>
                        <TableCell className="text-right border-r">
                          <div className="px-2 py-1">
                            {(revenue.original_amount || 0).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right border-r">
                          <div className="px-2 py-1">
                            {calculateVNDRevenue(revenue).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell className="border-r">
                          {renderEditableCell(revenue, 'notes', revenue.notes, 'text')}
                        </TableCell>
                        <TableCell className="text-center sticky right-0 bg-white border-l-2 border-gray-200 z-20">
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
            </div>

            <PaginationControls
              currentPage={searchParams.page!}
              totalPages={Math.ceil(total / searchParams.pageSize!)}
              onPageChange={handlePageChange}
              onNextPage={() => handlePageChange(searchParams.page! + 1)}
              onPreviousPage={() => handlePageChange(searchParams.page! - 1)}
              totalItems={total}
              startIndex={(searchParams.page! - 1) * searchParams.pageSize! + 1}
              endIndex={Math.min(searchParams.page! * searchParams.pageSize!, total)}
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
