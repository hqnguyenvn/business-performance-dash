
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { DollarSign, Plus, Save, Trash2, Eye, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from "@/components/ui/table";
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
import { useTableFilter } from "@/hooks/useTableFilter";
import { usePagination } from "@/hooks/usePagination";
import PaginationControls from "@/components/PaginationControls";
import { TableFilter } from "@/components/ui/table-filter";
import { revenueService, Revenue } from "@/services/revenueService";
import { exchangeRateService } from "@/services/exchangeRateService";
import {
  customersService,
  companiesService,
  divisionsService,
  projectsService,
  projectTypesService,
  resourcesService,
  currenciesService,
  MasterData
} from "@/services/masterDataService";
import RevenueFilters from "@/components/RevenueFilters";
import CloneDataDialog from "@/components/CloneDataDialog";
import RevenueDialog from "@/components/RevenueDialog";

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit'>('view');
  const [selectedRevenue, setSelectedRevenue] = useState<Revenue | null>(null);

  // Filter states - default to current year and months 1 to current month
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonths, setSelectedMonths] = useState(
    Array.from({ length: currentMonth }, (_, i) => i + 1)
  );

  // Add table filtering
  const { filteredData, setFilter, getActiveFilters } = useTableFilter(revenues);

  // Add pagination
  const {
    currentPage,
    totalPages,
    paginatedData,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    totalItems,
    startIndex,
    endIndex,
  } = usePagination({ data: filteredData });

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    loadFilteredRevenues();
  }, [selectedYear, selectedMonths]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      console.log("Loading data from Supabase...");
      
      // Load all data in parallel
      const [
        customersData,
        companiesData,
        divisionsData,
        projectsData,
        projectTypesData,
        resourcesData,
        currenciesData,
        exchangeRatesData
      ] = await Promise.all([
        customersService.getAll(),
        companiesService.getAll(),
        divisionsService.getAll(),
        projectsService.getAll(),
        projectTypesService.getAll(),
        resourcesService.getAll(),
        currenciesService.getAll(),
        exchangeRateService.getAll()
      ]);

      setCustomers(customersData);
      setCompanies(companiesData);
      setDivisions(divisionsData);
      setProjects(projectsData);
      setProjectTypes(projectTypesData);
      setResources(resourcesData);
      setCurrencies(currenciesData);
      setExchangeRates(exchangeRatesData);

      console.log("All data loaded successfully from Supabase");

    } catch (error) {
      console.error('Error loading data from Supabase:', error);
      toast({
        title: "Error",
        description: "Failed to load data from database",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFilteredRevenues = async () => {
    try {
      // Load all revenues for the selected year
      const revenuesData = await revenueService.getByFilters({
        year: selectedYear
      });
      
      setRevenues(revenuesData);
    } catch (error) {
      console.error('Error loading filtered revenues:', error);
      toast({
        title: "Error",
        description: "Failed to load filtered revenue data",
        variant: "destructive"
      });
    }
  };

  const getExchangeRate = (year: number, month: number, currencyId: string): number => {
    const currencyCode = getCurrencyCode(currencyId);
    const rate = exchangeRates.find(rate => 
      rate.year === year && 
      getMonthNumber(rate.month) === month && 
      rate.currencyID === currencyCode
    );
    return rate ? rate.exchangeRate : 0; // Return 0 if no exchange rate found
  };

  const getMonthNumber = (monthName: string): number => {
    const monthMap: { [key: string]: number } = {
      'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4,
      'May': 5, 'Jun': 6, 'Jul': 7, 'Aug': 8,
      'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
    };
    return monthMap[monthName] || 1;
  };

  const calculateVNDRevenue = (originalAmount: number, year: number, month: number, currencyId: string): number => {
    if (!originalAmount || !currencyId) return 0;
    const exchangeRate = getExchangeRate(year, month, currencyId);
    return originalAmount * exchangeRate;
  };

  const addNewRevenue = () => {
    const newRevenue: Revenue = {
      id: Date.now().toString(),
      year: selectedYear,
      month: selectedMonths[0] || currentMonth,
      customer_id: "",
      company_id: "",
      division_id: "",
      project_id: "",
      project_type_id: "",
      resource_id: "",
      currency_id: "",
      unit_price: 0,
      quantity: 1,
      original_amount: 0,
      vnd_revenue: 0,
      notes: "",
    };
    setRevenues(prev => [...prev, newRevenue]);
  };

  const addRevenueAfter = (afterId: string) => {
    const newRevenue: Revenue = {
      id: Date.now().toString(),
      year: selectedYear,
      month: selectedMonths[0] || currentMonth,
      customer_id: "",
      company_id: "",
      division_id: "",
      project_id: "",
      project_type_id: "",
      resource_id: "",
      currency_id: "",
      unit_price: 0,
      quantity: 1,
      original_amount: 0,
      vnd_revenue: 0,
      notes: "",
    };
    
    setRevenues(prev => {
      const index = prev.findIndex(item => item.id === afterId);
      const newArray = [...prev];
      newArray.splice(index + 1, 0, newRevenue);
      return newArray;
    });
  };

  const updateRevenue = (id: string, field: keyof Revenue, value: string | number) => {
    setRevenues(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // Auto-calculate original amount when unit price or quantity changes
        if (field === 'unit_price' || field === 'quantity') {
          if (updatedItem.unit_price && updatedItem.quantity) {
            updatedItem.original_amount = Number(updatedItem.unit_price) * Number(updatedItem.quantity);
          }
        }
        
        // Auto-calculate VND revenue
        if (field === 'original_amount' || field === 'unit_price' || field === 'quantity' || field === 'currency_id') {
          updatedItem.vnd_revenue = calculateVNDRevenue(
            updatedItem.original_amount, 
            updatedItem.year, 
            updatedItem.month, 
            updatedItem.currency_id || ""
          );
        }
        
        // Clear project when customer changes
        if (field === 'customer_id') {
          updatedItem.project_id = "";
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  const deleteRevenue = async (id: string) => {
    try {
      // Only delete from database if it's not a temporary ID (new items have timestamp IDs)
      const isNewItem = !isNaN(Number(id));
      if (!isNewItem) {
        await revenueService.delete(id);
      }
      
      setRevenues(prev => prev.filter(item => item.id !== id));
      toast({
        title: "Deleted",
        description: "Revenue record successfully deleted",
      });
    } catch (error) {
      console.error('Error deleting revenue:', error);
      toast({
        title: "Error",
        description: "Failed to delete revenue record",
        variant: "destructive"
      });
    }
  };

  const saveData = async () => {
    try {
      setSaving(true);
      const promises = revenues.map(async (item) => {
        // Check if it's a new item (has timestamp ID) or existing item
        const isNewItem = !isNaN(Number(item.id));
        
        if (isNewItem && (item.original_amount > 0 || item.vnd_revenue > 0)) {
          // Create new item
          const { id, ...itemData } = item;
          return await revenueService.create(itemData);
        } else if (!isNewItem && (item.original_amount > 0 || item.vnd_revenue > 0)) {
          // Update existing item
          return await revenueService.update(item.id, item);
        }
        return item;
      });

      const results = await Promise.all(promises);
      
      // Update the state with the returned data from database
      setRevenues(results.filter(Boolean));
      
      toast({
        title: "Saved",
        description: "Revenue data saved successfully",
      });
    } catch (error) {
      console.error('Error saving revenue data:', error);
      toast({
        title: "Error",
        description: "Failed to save revenue data",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCloneData = async (sourceYear: number, sourceMonth: number, targetYear: number, targetMonth: number) => {
    try {
      const sourceData = await revenueService.getByFilters({
        year: sourceYear,
        month: sourceMonth
      });

      if (sourceData.length === 0) {
        toast({
          title: "No Data",
          description: "No revenue data found for the selected source period",
          variant: "destructive"
        });
        return;
      }

      const clonedData = sourceData.map(item => ({
        ...item,
        id: Date.now().toString() + Math.random(),
        year: targetYear,
        month: targetMonth
      }));

      setRevenues(prev => [...prev, ...clonedData]);
      
      toast({
        title: "Success",
        description: `Cloned ${clonedData.length} revenue records`,
      });
    } catch (error) {
      console.error('Error cloning data:', error);
      toast({
        title: "Error",
        description: "Failed to clone revenue data",
        variant: "destructive"
      });
    }
  };

  const openDialog = (revenue: Revenue, mode: 'view' | 'edit') => {
    setSelectedRevenue(revenue);
    setDialogMode(mode);
    setDialogOpen(true);
  };

  const handleDialogSave = (updatedRevenue: Revenue) => {
    setRevenues(prev => prev.map(item => 
      item.id === updatedRevenue.id ? updatedRevenue : item
    ));
  };

  // Get filtered projects based on selected customer
  const getFilteredProjects = (customerId: string) => {
    if (!customerId) return projects;
    return projects.filter(project => project.customer_id === customerId);
  };

  const getCustomerCode = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.code : "";
  };

  const getCompanyCode = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    return company ? company.code : "";
  };

  const getDivisionCode = (divisionId: string) => {
    const division = divisions.find(d => d.id === divisionId);
    return division ? division.code : "";
  };

  const getProjectCode = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.code : "";
  };

  const getProjectTypeCode = (projectTypeId: string) => {
    const projectType = projectTypes.find(pt => pt.id === projectTypeId);
    return projectType ? projectType.code : "";
  };

  const getResourceCode = (resourceId: string) => {
    const resource = resources.find(r => r.id === resourceId);
    return resource ? resource.code : "";
  };

  const getCurrencyCode = (currencyId: string) => {
    const currency = currencies.find(c => c.id === currencyId);
    return currency ? currency.code : "";
  };

  // Filter display data based on selected months
  const displayRevenues = filteredData.filter(revenue => 
    selectedMonths.includes(revenue.month)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading revenues...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Revenue Management"
        description="Manage revenue records and financial data"
        icon={DollarSign}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={saveData} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button onClick={addNewRevenue}>
              <Plus className="h-4 w-4 mr-2" />
              Add New
            </Button>
          </div>
        }
      />

      <div className="p-6">
        <RevenueFilters
          selectedYear={selectedYear}
          selectedMonths={selectedMonths}
          onYearChange={setSelectedYear}
          onMonthChange={setSelectedMonths}
        />

        <Card className="bg-white">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Revenue Records</CardTitle>
              <CloneDataDialog onClone={handleCloneData} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="border border-gray-300">
                      No.
                      <TableFilter
                        data={displayRevenues}
                        field="id"
                        onFilter={setFilter}
                        activeFilters={getActiveFilters("id")}
                      />
                    </TableHead>
                    <TableHead className="border border-gray-300">
                      Year
                      <TableFilter
                        data={displayRevenues}
                        field="year"
                        onFilter={setFilter}
                        activeFilters={getActiveFilters("year")}
                      />
                    </TableHead>
                    <TableHead className="border border-gray-300">
                      Month
                      <TableFilter
                        data={displayRevenues}
                        field="month"
                        onFilter={setFilter}
                        activeFilters={getActiveFilters("month")}
                      />
                    </TableHead>
                    <TableHead className="border border-gray-300">
                      Customer
                      <TableFilter
                        data={displayRevenues}
                        field="customer_id"
                        onFilter={setFilter}
                        activeFilters={getActiveFilters("customer_id")}
                      />
                    </TableHead>
                    <TableHead className="border border-gray-300">
                      Company
                      <TableFilter
                        data={displayRevenues}
                        field="company_id"
                        onFilter={setFilter}
                        activeFilters={getActiveFilters("company_id")}
                      />
                    </TableHead>
                    <TableHead className="border border-gray-300">
                      Division
                      <TableFilter
                        data={displayRevenues}
                        field="division_id"
                        onFilter={setFilter}
                        activeFilters={getActiveFilters("division_id")}
                      />
                    </TableHead>
                    <TableHead className="border border-gray-300">
                      Project
                      <TableFilter
                        data={displayRevenues}
                        field="project_id"
                        onFilter={setFilter}
                        activeFilters={getActiveFilters("project_id")}
                      />
                    </TableHead>
                    <TableHead className="border border-gray-300">
                      Project Type
                      <TableFilter
                        data={displayRevenues}
                        field="project_type_id"
                        onFilter={setFilter}
                        activeFilters={getActiveFilters("project_type_id")}
                      />
                    </TableHead>
                    <TableHead className="border border-gray-300">
                      Resource
                      <TableFilter
                        data={displayRevenues}
                        field="resource_id"
                        onFilter={setFilter}
                        activeFilters={getActiveFilters("resource_id")}
                      />
                    </TableHead>
                    <TableHead className="border border-gray-300">
                      Currency
                      <TableFilter
                        data={displayRevenues}
                        field="currency_id"
                        onFilter={setFilter}
                        activeFilters={getActiveFilters("currency_id")}
                      />
                    </TableHead>
                    <TableHead className="border border-gray-300">
                      Unit Price
                      <TableFilter
                        data={displayRevenues}
                        field="unit_price"
                        onFilter={setFilter}
                        activeFilters={getActiveFilters("unit_price")}
                      />
                    </TableHead>
                    <TableHead className="border border-gray-300">
                      BMM
                      <TableFilter
                        data={displayRevenues}
                        field="quantity"
                        onFilter={setFilter}
                        activeFilters={getActiveFilters("quantity")}
                      />
                    </TableHead>
                    <TableHead className="border border-gray-300">
                      Original Revenue
                      <TableFilter
                        data={displayRevenues}
                        field="original_amount"
                        onFilter={setFilter}
                        activeFilters={getActiveFilters("original_amount")}
                      />
                    </TableHead>
                    <TableHead className="border border-gray-300">
                      VND Revenue
                      <TableFilter
                        data={displayRevenues}
                        field="vnd_revenue"
                        onFilter={setFilter}
                        activeFilters={getActiveFilters("vnd_revenue")}
                      />
                    </TableHead>
                    <TableHead className="border border-gray-300">
                      Notes
                      <TableFilter
                        data={displayRevenues}
                        field="notes"
                        onFilter={setFilter}
                        activeFilters={getActiveFilters("notes")}
                      />
                    </TableHead>
                    <TableHead className="border border-gray-300 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((revenue, index) => (
                    <TableRow key={revenue.id} className="hover:bg-gray-50">
                      <TableCell className="border border-gray-300 p-1 text-center">
                        {startIndex + index + 1}
                      </TableCell>
                      <TableCell className="border border-gray-300 p-1">
                        <Input
                          type="number"
                          value={revenue.year}
                          onChange={(e) => updateRevenue(revenue.id, 'year', parseInt(e.target.value) || 0)}
                          className="border-0 p-1 h-8"
                        />
                      </TableCell>
                      <TableCell className="border border-gray-300 p-1">
                        <Input
                          type="number"
                          min={1}
                          max={12}
                          value={revenue.month}
                          onChange={(e) => updateRevenue(revenue.id, 'month', parseInt(e.target.value) || 0)}
                          className="border-0 p-1 h-8"
                        />
                      </TableCell>
                      <TableCell className="border border-gray-300 p-1">
                        <Select
                          value={revenue.customer_id || ""}
                          onValueChange={(value) => updateRevenue(revenue.id, 'customer_id', value)}
                        >
                          <SelectTrigger className="border-0 p-1 h-8">
                            <SelectValue placeholder="Select customer" />
                          </SelectTrigger>
                          <SelectContent>
                            {customers.map((customer) => (
                              <SelectItem key={customer.id} value={customer.id}>
                                {customer.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="border border-gray-300 p-1">
                        <Select
                          value={revenue.company_id || ""}
                          onValueChange={(value) => updateRevenue(revenue.id, 'company_id', value)}
                        >
                          <SelectTrigger className="border-0 p-1 h-8">
                            <SelectValue placeholder="Select company" />
                          </SelectTrigger>
                          <SelectContent>
                            {companies.map((company) => (
                              <SelectItem key={company.id} value={company.id}>
                                {company.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="border border-gray-300 p-1">
                        <Select
                          value={revenue.division_id || ""}
                          onValueChange={(value) => updateRevenue(revenue.id, 'division_id', value)}
                        >
                          <SelectTrigger className="border-0 p-1 h-8">
                            <SelectValue placeholder="Select division" />
                          </SelectTrigger>
                          <SelectContent>
                            {divisions.map((division) => (
                              <SelectItem key={division.id} value={division.id}>
                                {division.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="border border-gray-300 p-1">
                        <Select
                          value={revenue.project_id || ""}
                          onValueChange={(value) => updateRevenue(revenue.id, 'project_id', value)}
                        >
                          <SelectTrigger className="border-0 p-1 h-8">
                            <SelectValue placeholder="Select project" />
                          </SelectTrigger>
                          <SelectContent>
                            {getFilteredProjects(revenue.customer_id || "").map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="border border-gray-300 p-1">
                        <Select
                          value={revenue.project_type_id || ""}
                          onValueChange={(value) => updateRevenue(revenue.id, 'project_type_id', value)}
                        >
                          <SelectTrigger className="border-0 p-1 h-8">
                            <SelectValue placeholder="Select project type" />
                          </SelectTrigger>
                          <SelectContent>
                            {projectTypes.map((projectType) => (
                              <SelectItem key={projectType.id} value={projectType.id}>
                                {projectType.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="border border-gray-300 p-1">
                        <Select
                          value={revenue.resource_id || ""}
                          onValueChange={(value) => updateRevenue(revenue.id, 'resource_id', value)}
                        >
                          <SelectTrigger className="border-0 p-1 h-8">
                            <SelectValue placeholder="Select resource" />
                          </SelectTrigger>
                          <SelectContent>
                            {resources.map((resource) => (
                              <SelectItem key={resource.id} value={resource.id}>
                                {resource.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="border border-gray-300 p-1">
                        <Select
                          value={revenue.currency_id || ""}
                          onValueChange={(value) => updateRevenue(revenue.id, 'currency_id', value)}
                        >
                          <SelectTrigger className="border-0 p-1 h-8">
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            {currencies.map((currency) => (
                              <SelectItem key={currency.id} value={currency.id}>
                                {currency.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="border border-gray-300 p-1">
                        <NumberInput
                          value={revenue.unit_price || 0}
                          onChange={(value) => updateRevenue(revenue.id, 'unit_price', value)}
                          className="border-0 p-1 h-8 text-right"
                          formatter={(value) => Math.round(value).toLocaleString()}
                        />
                      </TableCell>
                      <TableCell className="border border-gray-300 p-1">
                        <NumberInput
                          value={revenue.quantity || 1}
                          onChange={(value) => updateRevenue(revenue.id, 'quantity', value)}
                          className="border-0 p-1 h-8 text-right"
                          formatter={(value) => Math.round(value).toLocaleString()}
                        />
                      </TableCell>
                      <TableCell className="border border-gray-300 p-1">
                        <NumberInput
                          value={revenue.original_amount}
                          onChange={() => {}} // readonly
                          className="border-0 p-1 h-8 bg-gray-100 text-right"
                          disabled
                          formatter={(value) => Math.round(value).toLocaleString()}
                        />
                      </TableCell>
                      <TableCell className="border border-gray-300 p-1">
                        <NumberInput
                          value={revenue.vnd_revenue}
                          onChange={() => {}} // readonly
                          className="border-0 p-1 h-8 bg-gray-100 text-right"
                          disabled
                          formatter={(value) => Math.round(value).toLocaleString()}
                        />
                      </TableCell>
                      <TableCell className="border border-gray-300 p-1">
                        <Input
                          value={revenue.notes || ""}
                          onChange={(e) => updateRevenue(revenue.id, 'notes', e.target.value)}
                          className="border-0 p-1 h-8"
                        />
                      </TableCell>
                      <TableCell className="border border-gray-300 p-2 text-center">
                        <div className="flex gap-1 justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addRevenueAfter(revenue.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDialog(revenue, 'view')}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDialog(revenue, 'edit')}
                            className="text-orange-600 hover:text-orange-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
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
                                <AlertDialogAction
                                  onClick={() => deleteRevenue(revenue.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
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
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        revenue={selectedRevenue}
        mode={dialogMode}
        customers={customers}
        companies={companies}
        divisions={divisions}
        projects={projects}
        projectTypes={projectTypes}
        resources={resources}
        currencies={currencies}
        onSave={handleDialogSave}
      />
    </div>
  );
};

export default Revenues;
