import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { DollarSign, Plus, Download, Eye, Edit, Trash2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatNumber } from "@/lib/format";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from "@/components/ui/table";

interface Revenue {
  id: string;
  customerID: string;
  invoiceTo: string;
  division: string;
  projectCode: string;
  projectName: string;
  projectType: string;
  resourceType: string;
  startDate: string;
  estimatedEndDate: string;
  originalUnitPrice: number;
  chargeByJapan: number;
  offshoreUnitPrice: number;
  currency: string;
  year: number;
  month: number;
  bmm: number;
  originalRevenue: number;
  vndRevenue: number;
  notes: string;
}

interface MasterData {
  id: string;
  code: string;
  name: string;
  description?: string;
}

const MONTHS = [
  { value: 1, label: "Jan" },
  { value: 2, label: "Feb" },
  { value: 3, label: "Mar" },
  { value: 4, label: "Apr" },
  { value: 5, label: "May" },
  { value: 6, label: "Jun" },
  { value: 7, label: "Jul" },
  { value: 8, label: "Aug" },
  { value: 9, label: "Sep" },
  { value: 10, label: "Oct" },
  { value: 11, label: "Nov" },
  { value: 12, label: "Dec" },
];

const Revenues = () => {
  const { toast } = useToast();
  const STORAGE_KEY = 'revenue-data';
  
  // Load initial data from localStorage
  const [revenues, setRevenues] = useState<Revenue[]>(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      return savedData ? JSON.parse(savedData) : [];
    } catch (error) {
      console.error('Error loading revenue data from localStorage:', error);
      return [];
    }
  });
  
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // getMonth() returns 0-11
  
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [selectedMonths, setSelectedMonths] = useState<number[]>(
    Array.from({ length: currentMonth }, (_, i) => i + 1)
  );
  const [selectedRevenue, setSelectedRevenue] = useState<Revenue | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit'>('view');

  // Add delete confirmation state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [revenueToDelete, setRevenueToDelete] = useState<string | null>(null);

  // Master data - in a real app, this would come from a shared context or API
  const [customers] = useState<MasterData[]>([
    { id: "1", code: "CUST001", name: "ABC Technology Company", description: "VIP Customer" },
    { id: "2", code: "CUST002", name: "XYZ Solutions Ltd", description: "Regular Customer" },
  ]);

  const [companies] = useState<MasterData[]>([
    { id: "1", code: "COMP001", name: "ABC Co., Ltd", description: "Main Company" },
    { id: "2", code: "COMP002", name: "XYZ Branch", description: "Southern Branch" },
  ]);

  const [divisions] = useState<MasterData[]>([
    { id: "1", code: "DIV001", name: "Development Department", description: "R&D Department" },
    { id: "2", code: "DIV002", name: "Sales Department", description: "Sales Department" },
  ]);

  const [projects] = useState<MasterData[]>([
    { id: "1", code: "PRJ001", name: "ERP Project", description: "Enterprise Resource Planning System" },
    { id: "2", code: "PRJ002", name: "CRM Project", description: "Customer Relationship Management" },
  ]);

  const [projectTypes] = useState<MasterData[]>([
    { id: "1", code: "TYPE001", name: "New Development", description: "New project from scratch" },
    { id: "2", code: "TYPE002", name: "Maintenance", description: "Current system maintenance" },
  ]);

  const [currencies] = useState<MasterData[]>([
    { id: "1", code: "USD", name: "US Dollar", description: "US Dollar" },
    { id: "2", code: "VND", name: "Vietnam Dong", description: "Vietnam Dong" },
    { id: "3", code: "JPY", name: "Japanese Yen", description: "Japanese Yen" },
  ]);

  // Get unique years from revenue data, including current year
  const availableYears = Array.from(new Set([...revenues.map(r => r.year), currentYear])).sort((a, b) => b - a);

  // Filter revenues based on selected year and months
  const filteredRevenues = revenues.filter(revenue => {
    const yearMatch = revenue.year === parseInt(selectedYear);
    const monthMatch = selectedMonths.includes(revenue.month);
    console.log(`Filtering revenue ${revenue.id}: year=${revenue.year}, month=${revenue.month}, yearMatch=${yearMatch}, monthMatch=${monthMatch}`);
    return yearMatch && monthMatch;
  });

  console.log('Selected year:', selectedYear);
  console.log('Selected months:', selectedMonths);
  console.log('Total revenues:', revenues.length);
  console.log('Filtered revenues:', filteredRevenues.length);

  // Save to localStorage whenever revenues change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(revenues));
    } catch (error) {
      console.error('Error saving revenue data to localStorage:', error);
    }
  }, [revenues]);

  const addNewRow = () => {
    const newRevenue: Revenue = {
      id: Date.now().toString(),
      customerID: "",
      invoiceTo: "",
      division: "",
      projectCode: "",
      projectName: "",
      projectType: "",
      resourceType: "",
      startDate: "",
      estimatedEndDate: "",
      originalUnitPrice: 0,
      chargeByJapan: 0,
      offshoreUnitPrice: 0,
      currency: "",
      year: parseInt(selectedYear), // Use selected year for new records
      month: selectedMonths.length > 0 ? selectedMonths[0] : currentMonth, // Use first selected month
      bmm: 0,
      originalRevenue: 0,
      vndRevenue: 0,
      notes: "",
    };
    setRevenues([...revenues, newRevenue]);
    setHasUnsavedChanges(true);
  };

  const updateRevenue = (id: string, field: keyof Revenue, value: any) => {
    setRevenues(revenues.map(revenue => {
      if (revenue.id === id) {
        const updated = { ...revenue, [field]: value };
        // Auto calculate original revenue
        if (field === 'bmm' || field === 'offshoreUnitPrice') {
          updated.originalRevenue = updated.bmm * updated.offshoreUnitPrice;
          updated.vndRevenue = updated.originalRevenue * 24000; // Assume exchange rate
        }
        return updated;
      }
      return revenue;
    }));
    setHasUnsavedChanges(true);
  };

  const handleSaveAll = () => {
    // Recalculate all revenue values before saving
    const updatedRevenues = revenues.map(revenue => {
      const updated = { ...revenue };
      updated.originalRevenue = updated.bmm * updated.offshoreUnitPrice;
      updated.vndRevenue = updated.originalRevenue * 24000;
      return updated;
    });
    
    setRevenues(updatedRevenues);
    setHasUnsavedChanges(false);
    
    // Ensure data is saved to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRevenues));
      toast({
        title: "Saved successfully",
        description: `Saved all ${updatedRevenues.length} revenue records to local storage`,
      });
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      toast({
        title: "Save failed",
        description: "Could not save data to local storage",
        variant: "destructive",
      });
    }
  };

  const handleYearChange = (value: string) => {
    console.log('Year changed to:', value);
    setSelectedYear(value);
  };

  const handleMonthToggle = (monthValue: number) => {
    console.log('Month toggled:', monthValue);
    setSelectedMonths(prev => {
      const newMonths = prev.includes(monthValue) 
        ? prev.filter(m => m !== monthValue)
        : [...prev, monthValue].sort();
      console.log('New selected months:', newMonths);
      return newMonths;
    });
  };

  const handleView = (revenue: Revenue) => {
    setSelectedRevenue(revenue);
    setDialogMode('view');
    setIsDialogOpen(true);
  };

  const handleEdit = (revenue: Revenue) => {
    setSelectedRevenue(revenue);
    setDialogMode('edit');
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    // Open confirmation dialog instead of deleting immediately
    setRevenueToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (revenueToDelete) {
      const updatedRevenues = revenues.filter(revenue => revenue.id !== revenueToDelete);
      setRevenues(updatedRevenues);
      setHasUnsavedChanges(true);
      toast({
        title: "Deleted successfully",
        description: "Revenue record has been deleted",
      });
      // Close dialog and reset state
      setIsDeleteDialogOpen(false);
      setRevenueToDelete(null);
    }
  };

  const handleSave = () => {
    if (selectedRevenue) {
      setRevenues(revenues.map(revenue => {
        if (revenue.id === selectedRevenue.id) {
          const updated = { ...selectedRevenue };
          // Auto calculate revenues when saving
          updated.originalRevenue = updated.bmm * updated.offshoreUnitPrice;
          updated.vndRevenue = updated.originalRevenue * 24000; // Assume exchange rate
          return updated;
        }
        return revenue;
      }));
      setIsDialogOpen(false);
      setHasUnsavedChanges(true);
      toast({
        title: "Saved successfully",
        description: "Revenue information has been updated",
      });
    }
  };

  const exportToCSV = () => {
    toast({
      title: "Export data",
      description: "Data has been exported to CSV file successfully",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Revenue Management"
        description="Record workload by year and month"
        icon={DollarSign}
        actions={
          <>
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            {hasUnsavedChanges && (
              <Button onClick={handleSaveAll} className="bg-green-600 hover:bg-green-700">
                <Save className="h-4 w-4 mr-2" />
                Save All
              </Button>
            )}
            <Button onClick={addNewRow}>
              <Plus className="h-4 w-4 mr-2" />
              Add Row
            </Button>
          </>
        }
      />

      <div className="p-6">
        {/* Filter Section */}
        <Card className="bg-white mb-6">
          <CardHeader>
            <CardTitle>Data Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Year and Month Filter in same row */}
              <div className="flex items-start gap-8">
                {/* Year Filter - removed the label text */}
                <div className="flex items-center gap-4">
                  <Select value={selectedYear} onValueChange={handleYearChange}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Month Filter - removed the label text */}
                <div className="flex-1">
                  <div className="grid grid-cols-6 gap-4">
                    {MONTHS.map(month => (
                      <div key={month.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`month-${month.value}`}
                          checked={selectedMonths.includes(month.value)}
                          onCheckedChange={() => handleMonthToggle(month.value)}
                        />
                        <label 
                          htmlFor={`month-${month.value}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {month.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {hasUnsavedChanges && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <span className="text-yellow-800 font-medium">
                Unsaved changes
              </span>
            </div>
          </div>
        )}

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Revenue Data ({filteredRevenues.length} records)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-blue-50">
                    <TableHead className="border border-gray-300">Customer ID</TableHead>
                    <TableHead className="border border-gray-300">Invoice To</TableHead>
                    <TableHead className="border border-gray-300">Division</TableHead>
                    <TableHead className="border border-gray-300">Project Code</TableHead>
                    <TableHead className="border border-gray-300">Project Name</TableHead>
                    <TableHead className="border border-gray-300">Project Type</TableHead>
                    <TableHead className="border border-gray-300 text-right">Year</TableHead>
                    <TableHead className="border border-gray-300">Month</TableHead>
                    <TableHead className="border border-gray-300 text-right">BMM</TableHead>
                    <TableHead className="border border-gray-300 text-right">Unit Price</TableHead>
                    <TableHead className="border border-gray-300">Currency</TableHead>
                    <TableHead className="border border-gray-300 text-right">Original Revenue</TableHead>
                    <TableHead className="border border-gray-300 text-right">VND Revenue</TableHead>
                    <TableHead className="border border-gray-300">Notes</TableHead>
                    <TableHead className="border border-gray-300 text-center">
                      Actions
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={addNewRow}
                        className="h-6 w-6 p-0 ml-1"
                        title="Add New Row"
                      >
                        <Plus className="h-4 w-4 text-blue-600" />
                      </Button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRevenues.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={15} className="border border-gray-300 p-8 text-center text-gray-500">
                        {revenues.length === 0 
                          ? "No data available. Click \"Add Row\" to start entering data."
                          : "No data matches the selected filters. Try adjusting the year or month selection."
                        }
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRevenues.map((revenue) => (
                      <TableRow key={revenue.id} className="hover:bg-gray-50">
                        <TableCell className="border border-gray-300 p-1">
                          <Select
                            value={revenue.customerID}
                            onValueChange={(value) => updateRevenue(revenue.id, 'customerID', value)}
                          >
                            <SelectTrigger className="border-0 p-1 h-8">
                              <SelectValue placeholder="Select Customer" />
                            </SelectTrigger>
                            <SelectContent>
                              {customers.map(customer => (
                                <SelectItem key={customer.id} value={customer.code}>
                                  {customer.code} - {customer.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="border border-gray-300 p-1">
                          <Select
                            value={revenue.invoiceTo}
                            onValueChange={(value) => updateRevenue(revenue.id, 'invoiceTo', value)}
                          >
                            <SelectTrigger className="border-0 p-1 h-8">
                              <SelectValue placeholder="Select Company" />
                            </SelectTrigger>
                            <SelectContent>
                              {companies.map(company => (
                                <SelectItem key={company.id} value={company.code}>
                                  {company.code} - {company.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="border border-gray-300 p-1">
                          <Select
                            value={revenue.division}
                            onValueChange={(value) => updateRevenue(revenue.id, 'division', value)}
                          >
                            <SelectTrigger className="border-0 p-1 h-8">
                              <SelectValue placeholder="Select Division" />
                            </SelectTrigger>
                            <SelectContent>
                              {divisions.map(division => (
                                <SelectItem key={division.id} value={division.code}>
                                  {division.code} - {division.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="border border-gray-300 p-1">
                          <Select
                            value={revenue.projectCode}
                            onValueChange={(value) => updateRevenue(revenue.id, 'projectCode', value)}
                          >
                            <SelectTrigger className="border-0 p-1 h-8">
                              <SelectValue placeholder="Select Project" />
                            </SelectTrigger>
                            <SelectContent>
                              {projects.map(project => (
                                <SelectItem key={project.id} value={project.code}>
                                  {project.code} - {project.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="border border-gray-300 p-1">
                          <Input
                            value={revenue.projectName}
                            onChange={(e) => updateRevenue(revenue.id, 'projectName', e.target.value)}
                            className="border-0 p-1 h-8"
                          />
                        </TableCell>
                        <TableCell className="border border-gray-300 p-1">
                          <Select
                            value={revenue.projectType}
                            onValueChange={(value) => updateRevenue(revenue.id, 'projectType', value)}
                          >
                            <SelectTrigger className="border-0 p-1 h-8">
                              <SelectValue placeholder="Select Type" />
                            </SelectTrigger>
                            <SelectContent>
                              {projectTypes.map(type => (
                                <SelectItem key={type.id} value={type.code}>
                                  {type.code} - {type.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="border border-gray-300 p-1">
                          <NumberInput
                            value={revenue.year}
                            onChange={(value) => updateRevenue(revenue.id, 'year', value || currentYear)}
                            className="border-0 p-1 h-8"
                          />
                        </TableCell>
                        <TableCell className="border border-gray-300 p-1">
                          <Select
                            value={revenue.month.toString()}
                            onValueChange={(value) => updateRevenue(revenue.id, 'month', parseInt(value))}
                          >
                            <SelectTrigger className="border-0 p-1 h-8">
                              <SelectValue placeholder="Month" />
                            </SelectTrigger>
                            <SelectContent>
                              {MONTHS.map(month => (
                                <SelectItem key={month.value} value={month.value.toString()}>
                                  {month.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="border border-gray-300 p-1">
                          <NumberInput
                            value={revenue.bmm}
                            onChange={(value) => updateRevenue(revenue.id, 'bmm', value)}
                            className="border-0 p-1 h-8"
                          />
                        </TableCell>
                        <TableCell className="border border-gray-300 p-1">
                          <Input
                            value={formatNumber(revenue.offshoreUnitPrice)}
                            onChange={(e) => {
                              const value = e.target.value.replace(/,/g, '');
                              const numValue = parseFloat(value);
                              if (!isNaN(numValue) || value === '') {
                                updateRevenue(revenue.id, 'offshoreUnitPrice', numValue || 0);
                              }
                            }}
                            className="border-0 p-1 h-8 text-right"
                          />
                        </TableCell>
                        <TableCell className="border border-gray-300 p-1">
                          <Select
                            value={revenue.currency}
                            onValueChange={(value) => updateRevenue(revenue.id, 'currency', value)}
                          >
                            <SelectTrigger className="border-0 p-1 h-8">
                              <SelectValue placeholder="Currency" />
                            </SelectTrigger>
                            <SelectContent>
                              {currencies.map(currency => (
                                <SelectItem key={currency.id} value={currency.code}>
                                  {currency.code} - {currency.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="border border-gray-300 p-1">
                          <Input
                            value={formatNumber(revenue.originalRevenue)}
                            readOnly
                            className="border-0 p-1 h-8 bg-gray-50 text-right"
                          />
                        </TableCell>
                        <TableCell className="border border-gray-300 p-1">
                          <Input
                            value={formatNumber(revenue.vndRevenue)}
                            readOnly
                            className="border-0 p-1 h-8 bg-gray-50 text-right"
                          />
                        </TableCell>
                        <TableCell className="border border-gray-300 p-1">
                          <Input
                            value={revenue.notes}
                            onChange={(e) => updateRevenue(revenue.id, 'notes', e.target.value)}
                            className="border-0 p-1 h-8"
                          />
                        </TableCell>
                        <TableCell className="border border-gray-300 p-1">
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleView(revenue)}
                              className="h-7 w-7 p-0"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(revenue)}
                              className="h-7 w-7 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(revenue.id)}
                              className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Detail Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {dialogMode === 'view' ? 'View Details' : 'Edit'} Revenue
              </DialogTitle>
            </DialogHeader>
            {selectedRevenue && (
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Customer ID</label>
                  {dialogMode === 'view' ? (
                    <div className="p-2 bg-gray-50 rounded">{selectedRevenue.customerID}</div>
                  ) : (
                    <Select
                      value={selectedRevenue.customerID}
                      onValueChange={(value) => setSelectedRevenue({...selectedRevenue, customerID: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map(customer => (
                          <SelectItem key={customer.id} value={customer.code}>
                            {customer.code} - {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Invoice To</label>
                  {dialogMode === 'view' ? (
                    <div className="p-2 bg-gray-50 rounded">{selectedRevenue.invoiceTo}</div>
                  ) : (
                    <Select
                      value={selectedRevenue.invoiceTo}
                      onValueChange={(value) => setSelectedRevenue({...selectedRevenue, invoiceTo: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select company" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map(company => (
                          <SelectItem key={company.id} value={company.code}>
                            {company.code} - {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Division</label>
                  {dialogMode === 'view' ? (
                    <div className="p-2 bg-gray-50 rounded">{selectedRevenue.division}</div>
                  ) : (
                    <Select
                      value={selectedRevenue.division}
                      onValueChange={(value) => setSelectedRevenue({...selectedRevenue, division: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select division" />
                      </SelectTrigger>
                      <SelectContent>
                        {divisions.map(division => (
                          <SelectItem key={division.id} value={division.code}>
                            {division.code} - {division.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Project Code</label>
                  {dialogMode === 'view' ? (
                    <div className="p-2 bg-gray-50 rounded">{selectedRevenue.projectCode}</div>
                  ) : (
                    <Select
                      value={selectedRevenue.projectCode}
                      onValueChange={(value) => setSelectedRevenue({...selectedRevenue, projectCode: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map(project => (
                          <SelectItem key={project.id} value={project.code}>
                            {project.code} - {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Project Name</label>
                  {dialogMode === 'view' ? (
                    <div className="p-2 bg-gray-50 rounded">{selectedRevenue.projectName}</div>
                  ) : (
                    <Input
                      value={selectedRevenue.projectName}
                      onChange={(e) => setSelectedRevenue({...selectedRevenue, projectName: e.target.value})}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Project Type</label>
                  {dialogMode === 'view' ? (
                    <div className="p-2 bg-gray-50 rounded">{selectedRevenue.projectType}</div>
                  ) : (
                    <Select
                      value={selectedRevenue.projectType}
                      onValueChange={(value) => setSelectedRevenue({...selectedRevenue, projectType: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select project type" />
                      </SelectTrigger>
                      <SelectContent>
                        {projectTypes.map(type => (
                          <SelectItem key={type.id} value={type.code}>
                            {type.code} - {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Year</label>
                  {dialogMode === 'view' ? (
                    <div className="p-2 bg-gray-50 rounded text-right">{selectedRevenue.year}</div>
                  ) : (
                    <NumberInput
                      value={selectedRevenue.year}
                      onChange={(value) => setSelectedRevenue({...selectedRevenue, year: value || currentYear})}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Month</label>
                  {dialogMode === 'view' ? (
                    <div className="p-2 bg-gray-50 rounded">
                      {MONTHS.find(m => m.value === selectedRevenue.month)?.label}
                    </div>
                  ) : (
                    <Select
                      value={selectedRevenue.month.toString()}
                      onValueChange={(value) => setSelectedRevenue({...selectedRevenue, month: parseInt(value)})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map(month => (
                          <SelectItem key={month.value} value={month.value.toString()}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">BMM</label>
                  {dialogMode === 'view' ? (
                    <div className="p-2 bg-gray-50 rounded text-right">{selectedRevenue.bmm}</div>
                  ) : (
                    <NumberInput
                      value={selectedRevenue.bmm}
                      onChange={(value) => setSelectedRevenue({...selectedRevenue, bmm: value})}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Unit Price</label>
                  {dialogMode === 'view' ? (
                    <div className="p-2 bg-gray-50 rounded text-right">{formatNumber(selectedRevenue.offshoreUnitPrice)}</div>
                  ) : (
                    <Input
                      value={formatNumber(selectedRevenue.offshoreUnitPrice)}
                      onChange={(e) => {
                        const value = e.target.value.replace(/,/g, '');
                        const numValue = parseFloat(value);
                        if (!isNaN(numValue) || value === '') {
                          setSelectedRevenue({...selectedRevenue, offshoreUnitPrice: numValue || 0});
                        }
                      }}
                      className="text-right"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Currency</label>
                  {dialogMode === 'view' ? (
                    <div className="p-2 bg-gray-50 rounded">{selectedRevenue.currency}</div>
                  ) : (
                    <Select
                      value={selectedRevenue.currency}
                      onValueChange={(value) => setSelectedRevenue({...selectedRevenue, currency: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map(currency => (
                          <SelectItem key={currency.id} value={currency.code}>
                            {currency.code} - {currency.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Original Revenue</label>
                  <div className="p-2 bg-gray-50 rounded text-right">{formatNumber(selectedRevenue.originalRevenue)}</div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">VND Revenue</label>
                  <div className="p-2 bg-gray-50 rounded text-right">{formatNumber(selectedRevenue.vndRevenue)}</div>
                </div>

                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-medium">Notes</label>
                  {dialogMode === 'view' ? (
                    <div className="p-2 bg-gray-50 rounded">{selectedRevenue.notes}</div>
                  ) : (
                    <Input
                      value={selectedRevenue.notes}
                      onChange={(e) => setSelectedRevenue({...selectedRevenue, notes: e.target.value})}
                    />
                  )}
                </div>
              </div>
            )}
            {dialogMode === 'edit' && (
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  Save
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete confirmation dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this revenue record.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setRevenueToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Revenues;
