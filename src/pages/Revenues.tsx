
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { DollarSign, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { revenueService, Revenue } from "@/services/revenueService";
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      console.log("Loading data from Supabase...");
      
      // Load all data in parallel
      const [
        revenuesData,
        customersData,
        companiesData,
        divisionsData,
        projectsData,
        projectTypesData,
        resourcesData,
        currenciesData
      ] = await Promise.all([
        revenueService.getAll(),
        customersService.getAll(),
        companiesService.getAll(),
        divisionsService.getAll(),
        projectsService.getAll(),
        projectTypesService.getAll(),
        resourcesService.getAll(),
        currenciesService.getAll()
      ]);

      setRevenues(revenuesData);
      setCustomers(customersData);
      setCompanies(companiesData);
      setDivisions(divisionsData);
      setProjects(projectsData);
      setProjectTypes(projectTypesData);
      setResources(resourcesData);
      setCurrencies(currenciesData);

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

  const addNewRevenue = () => {
    const newRevenue: Revenue = {
      id: Date.now().toString(),
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      customer_id: "",
      company_id: "",
      division_id: "",
      project_id: "",
      project_type_id: "",
      resource_id: "",
      currency_id: "",
      unit_price: 0,
      quantity: 0,
      original_amount: 0,
      vnd_revenue: 0,
      notes: "",
    };
    setRevenues(prev => [...prev, newRevenue]);
  };

  const updateRevenue = (id: string, field: keyof Revenue, value: string | number) => {
    setRevenues(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // Auto-calculate VND revenue when original amount or unit price/quantity changes
        if (field === 'original_amount' || field === 'unit_price' || field === 'quantity') {
          if (updatedItem.unit_price && updatedItem.quantity) {
            updatedItem.original_amount = Number(updatedItem.unit_price) * Number(updatedItem.quantity);
          }
          // For now, assume VND revenue equals original amount (can be enhanced with exchange rates)
          updatedItem.vnd_revenue = updatedItem.original_amount;
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

  // Get filtered projects based on selected customer
  const getFilteredProjects = (customerId: string) => {
    if (!customerId) return projects;
    return projects.filter(project => project.customer_id === customerId);
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : "";
  };

  const getCompanyName = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    return company ? company.name : "";
  };

  const getDivisionName = (divisionId: string) => {
    const division = divisions.find(d => d.id === divisionId);
    return division ? division.name : "";
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : "";
  };

  const getProjectTypeName = (projectTypeId: string) => {
    const projectType = projectTypes.find(pt => pt.id === projectTypeId);
    return projectType ? projectType.name : "";
  };

  const getResourceName = (resourceId: string) => {
    const resource = resources.find(r => r.id === resourceId);
    return resource ? resource.name : "";
  };

  const getCurrencyCode = (currencyId: string) => {
    const currency = currencies.find(c => c.id === currencyId);
    return currency ? currency.code : "";
  };

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
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Revenue Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="border border-gray-300">Year</TableHead>
                    <TableHead className="border border-gray-300">Month</TableHead>
                    <TableHead className="border border-gray-300">Customer</TableHead>
                    <TableHead className="border border-gray-300">Company</TableHead>
                    <TableHead className="border border-gray-300">Division</TableHead>
                    <TableHead className="border border-gray-300">Project</TableHead>
                    <TableHead className="border border-gray-300">Project Type</TableHead>
                    <TableHead className="border border-gray-300">Resource</TableHead>
                    <TableHead className="border border-gray-300">Currency</TableHead>
                    <TableHead className="border border-gray-300">Unit Price</TableHead>
                    <TableHead className="border border-gray-300">Quantity</TableHead>
                    <TableHead className="border border-gray-300">Original Amount</TableHead>
                    <TableHead className="border border-gray-300">VND Revenue</TableHead>
                    <TableHead className="border border-gray-300">Notes</TableHead>
                    <TableHead className="border border-gray-300 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((revenue) => (
                    <TableRow key={revenue.id} className="hover:bg-gray-50">
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
                                {customer.name}
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
                                {company.name}
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
                                {division.name}
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
                                {project.name}
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
                                {projectType.name}
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
                                {resource.name}
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
                        <Input
                          type="number"
                          step="0.01"
                          value={revenue.unit_price || ""}
                          onChange={(e) => updateRevenue(revenue.id, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="border-0 p-1 h-8"
                        />
                      </TableCell>
                      <TableCell className="border border-gray-300 p-1">
                        <Input
                          type="number"
                          step="0.01"
                          value={revenue.quantity || ""}
                          onChange={(e) => updateRevenue(revenue.id, 'quantity', parseFloat(e.target.value) || 0)}
                          className="border-0 p-1 h-8"
                        />
                      </TableCell>
                      <TableCell className="border border-gray-300 p-1">
                        <Input
                          type="number"
                          step="0.01"
                          value={revenue.original_amount}
                          onChange={(e) => updateRevenue(revenue.id, 'original_amount', parseFloat(e.target.value) || 0)}
                          className="border-0 p-1 h-8"
                        />
                      </TableCell>
                      <TableCell className="border border-gray-300 p-1">
                        <Input
                          type="number"
                          step="0.01"
                          value={revenue.vnd_revenue}
                          onChange={(e) => updateRevenue(revenue.id, 'vnd_revenue', parseFloat(e.target.value) || 0)}
                          className="border-0 p-1 h-8"
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
    </div>
  );
};

export default Revenues;
