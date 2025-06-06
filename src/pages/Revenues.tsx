
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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
import { DollarSign, Plus, Download, Edit, Eye, Save, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { NumberInput } from "@/components/ui/number-input";
import { formatNumber } from "@/lib/format";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from "@/components/ui/table";
import { useTableFilter } from "@/hooks/useTableFilter";

interface Revenue {
  id: string;
  year: number;
  month: number;
  description: string;
  unitPrice: number;
  volume: number;
  revenue: number;
  customer: string;
  project: string;
  currency: string;
  checked: boolean;
  notes: string;
}

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" }
];

const CUSTOMERS = ["ABC Technology", "XYZ Solutions", "TechCorp", "InnovateLab"];
const PROJECTS = ["Project Alpha", "Project Beta", "Project Gamma", "Project Delta"];
const CURRENCIES = ["USD", "EUR", "JPY", "VND"];

const Revenues = () => {
  const { toast } = useToast();
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [selectedMonths, setSelectedMonths] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRevenue, setSelectedRevenue] = useState<Revenue | null>(null);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit'>('view');
  
  // Delete confirmation dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [revenueToDelete, setRevenueToDelete] = useState<string | null>(null);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedRevenues = localStorage.getItem('revenues');
    if (savedRevenues) {
      setRevenues(JSON.parse(savedRevenues));
    }
  }, []);

  // Save data to localStorage whenever revenues change
  useEffect(() => {
    localStorage.setItem('revenues', JSON.stringify(revenues));
  }, [revenues]);

  // Get unique years from revenue data, including current year
  const availableYears = Array.from(new Set([...revenues.map(r => r.year), currentYear])).sort((a, b) => b - a);

  // Filter revenues based on selected year and months
  const baseRevenues = revenues.filter(revenue => {
    const yearMatch = revenue.year === parseInt(selectedYear);
    const monthMatch = selectedMonths.includes(revenue.month);
    return yearMatch && monthMatch;
  });

  // Add table filtering
  const { filteredData: filteredRevenues, setFilter, getActiveFilters } = useTableFilter(baseRevenues);

  const addNewRow = () => {
    const newRevenue: Revenue = {
      id: Date.now().toString(),
      year: parseInt(selectedYear),
      month: selectedMonths.length > 0 ? selectedMonths[0] : currentMonth,
      description: "",
      unitPrice: 0,
      volume: 0,
      revenue: 0,
      customer: CUSTOMERS[0],
      project: PROJECTS[0],
      currency: "USD",
      checked: false,
      notes: "",
    };
    setRevenues([...revenues, newRevenue]);
  };

  const updateRevenue = (id: string, field: keyof Revenue, value: any) => {
    setRevenues(revenues.map(revenue => {
      if (revenue.id === id) {
        const updated = { ...revenue, [field]: value };
        // Auto calculate revenue
        if (field === 'unitPrice' || field === 'volume') {
          updated.revenue = updated.unitPrice * updated.volume;
        }
        return updated;
      }
      return revenue;
    }));
  };

  const openDialog = (revenue: Revenue, mode: 'view' | 'edit') => {
    setSelectedRevenue(revenue);
    setDialogMode(mode);
    setIsDialogOpen(true);
  };

  const deleteRevenue = (id: string) => {
    setRevenueToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (revenueToDelete) {
      setRevenues(prev => prev.filter(revenue => revenue.id !== revenueToDelete));
      toast({
        title: "Deleted",
        description: "Item successfully deleted",
      });
      setIsDeleteDialogOpen(false);
      setRevenueToDelete(null);
    }
  };

  const saveChanges = () => {
    if (selectedRevenue) {
      updateRevenue(selectedRevenue.id, 'description', selectedRevenue.description);
      updateRevenue(selectedRevenue.id, 'unitPrice', selectedRevenue.unitPrice);
      updateRevenue(selectedRevenue.id, 'volume', selectedRevenue.volume);
      updateRevenue(selectedRevenue.id, 'customer', selectedRevenue.customer);
      updateRevenue(selectedRevenue.id, 'project', selectedRevenue.project);
      updateRevenue(selectedRevenue.id, 'currency', selectedRevenue.currency);
      updateRevenue(selectedRevenue.id, 'checked', selectedRevenue.checked);
      updateRevenue(selectedRevenue.id, 'notes', selectedRevenue.notes);
      setIsDialogOpen(false);
      toast({
        title: "Save Successful",
        description: "Revenue data has been updated",
      });
    }
  };

  const saveAllData = () => {
    localStorage.setItem('revenues', JSON.stringify(revenues));
    toast({
      title: "Save All Data",
      description: "All revenue data has been saved successfully",
    });
  };

  const exportToCSV = () => {
    toast({
      title: "Export Data",
      description: "Revenue data has been exported to CSV successfully",
    });
  };

  const handleYearChange = (value: string) => {
    setSelectedYear(value);
  };

  const handleMonthToggle = (monthValue: number) => {
    setSelectedMonths(prev => {
      const newMonths = prev.includes(monthValue) 
        ? prev.filter(m => m !== monthValue)
        : [...prev, monthValue].sort();
      return newMonths;
    });
  };

  const getMonthName = (monthNumber: number) => {
    const month = MONTHS.find(m => m.value === monthNumber);
    return month ? month.label : monthNumber.toString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Revenue Management"
        description="Record revenues by year and month"
        icon={DollarSign}
        actions={
          <>
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={saveAllData}>
              <Save className="h-4 w-4 mr-2" />
              Save All
            </Button>
            <Button onClick={addNewRow}>
              <Plus className="h-4 w-4 mr-2" />
              Add Row
            </Button>
          </>
        }
      />

      <div className="p-6">
        {/* Data Filter */}
        <Card className="bg-white mb-6">
          <CardHeader>
            <CardTitle>Data Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-start gap-8">
                {/* Year Filter */}
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

                {/* Month Filter */}
                <div className="flex-1">
                  <div className="grid grid-cols-6 gap-2">
                    {MONTHS.map((month) => (
                      <div key={month.value} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`month-${month.value}`}
                          checked={selectedMonths.includes(month.value)}
                          onCheckedChange={() => handleMonthToggle(month.value)}
                        />
                        <label 
                          htmlFor={`month-${month.value}`} 
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {month.label.substring(0, 3)}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Revenue Data ({filteredRevenues.length} records)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-blue-50">
                    <TableHead 
                      className="border border-gray-300"
                      showFilter={true}
                      filterData={baseRevenues}
                      filterField="year"
                      onFilter={setFilter}
                      activeFilters={getActiveFilters("year")}
                    >
                      Year
                    </TableHead>
                    <TableHead 
                      className="border border-gray-300"
                      showFilter={true}
                      filterData={baseRevenues}
                      filterField="month"
                      onFilter={setFilter}
                      activeFilters={getActiveFilters("month")}
                    >
                      Month
                    </TableHead>
                    <TableHead 
                      className="border border-gray-300"
                      showFilter={true}
                      filterData={baseRevenues}
                      filterField="description"
                      onFilter={setFilter}
                      activeFilters={getActiveFilters("description")}
                    >
                      Description
                    </TableHead>
                    <TableHead 
                      className="border border-gray-300 text-right"
                      showFilter={true}
                      filterData={baseRevenues}
                      filterField="unitPrice"
                      onFilter={setFilter}
                      activeFilters={getActiveFilters("unitPrice")}
                    >
                      Unit Price
                    </TableHead>
                    <TableHead 
                      className="border border-gray-300 text-right"
                      showFilter={true}
                      filterData={baseRevenues}
                      filterField="volume"
                      onFilter={setFilter}
                      activeFilters={getActiveFilters("volume")}
                    >
                      Volume
                    </TableHead>
                    <TableHead 
                      className="border border-gray-300 text-right"
                      showFilter={true}
                      filterData={baseRevenues}
                      filterField="revenue"
                      onFilter={setFilter}
                      activeFilters={getActiveFilters("revenue")}
                    >
                      Revenue
                    </TableHead>
                    <TableHead 
                      className="border border-gray-300"
                      showFilter={true}
                      filterData={baseRevenues}
                      filterField="customer"
                      onFilter={setFilter}
                      activeFilters={getActiveFilters("customer")}
                    >
                      Customer
                    </TableHead>
                    <TableHead 
                      className="border border-gray-300"
                      showFilter={true}
                      filterData={baseRevenues}
                      filterField="project"
                      onFilter={setFilter}
                      activeFilters={getActiveFilters("project")}
                    >
                      Project
                    </TableHead>
                    <TableHead 
                      className="border border-gray-300"
                      showFilter={true}
                      filterData={baseRevenues}
                      filterField="currency"
                      onFilter={setFilter}
                      activeFilters={getActiveFilters("currency")}
                    >
                      Currency
                    </TableHead>
                    <TableHead 
                      className="border border-gray-300 text-center"
                      showFilter={true}
                      filterData={baseRevenues}
                      filterField="checked"
                      onFilter={setFilter}
                      activeFilters={getActiveFilters("checked")}
                    >
                      Checked
                    </TableHead>
                    <TableHead 
                      className="border border-gray-300"
                      showFilter={true}
                      filterData={baseRevenues}
                      filterField="notes"
                      onFilter={setFilter}
                      activeFilters={getActiveFilters("notes")}
                    >
                      Notes
                    </TableHead>
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
                      <TableCell colSpan={12} className="border border-gray-300 p-8 text-center text-gray-500">
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
                          <Input
                            value={revenue.year.toString()}
                            onChange={(e) => updateRevenue(revenue.id, 'year', parseInt(e.target.value) || currentYear)}
                            className="border-0 p-1 h-8 text-center"
                            type="number"
                          />
                        </TableCell>
                        <TableCell className="border border-gray-300 p-1">
                          <Select
                            value={revenue.month.toString()}
                            onValueChange={(value) => updateRevenue(revenue.id, 'month', parseInt(value))}
                          >
                            <SelectTrigger className="border-0 p-1 h-8">
                              <SelectValue />
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
                          <Input
                            value={revenue.description}
                            onChange={(e) => updateRevenue(revenue.id, 'description', e.target.value)}
                            className="border-0 p-1 h-8"
                          />
                        </TableCell>
                        <TableCell className="border border-gray-300 p-1">
                          <NumberInput
                            value={revenue.unitPrice}
                            onChange={(value) => updateRevenue(revenue.id, 'unitPrice', value)}
                            className="border-0 p-1 h-8"
                          />
                        </TableCell>
                        <TableCell className="border border-gray-300 p-1">
                          <NumberInput
                            value={revenue.volume}
                            onChange={(value) => updateRevenue(revenue.id, 'volume', value)}
                            className="border-0 p-1 h-8"
                          />
                        </TableCell>
                        <TableCell className="border border-gray-300 p-1">
                          <Input
                            value={formatNumber(revenue.revenue)}
                            readOnly
                            className="border-0 p-1 h-8 bg-gray-50 text-right"
                          />
                        </TableCell>
                        <TableCell className="border border-gray-300 p-1">
                          <Select
                            value={revenue.customer}
                            onValueChange={(value) => updateRevenue(revenue.id, 'customer', value)}
                          >
                            <SelectTrigger className="border-0 p-1 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CUSTOMERS.map(customer => (
                                <SelectItem key={customer} value={customer}>{customer}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="border border-gray-300 p-1">
                          <Select
                            value={revenue.project}
                            onValueChange={(value) => updateRevenue(revenue.id, 'project', value)}
                          >
                            <SelectTrigger className="border-0 p-1 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PROJECTS.map(project => (
                                <SelectItem key={project} value={project}>{project}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="border border-gray-300 p-1">
                          <Select
                            value={revenue.currency}
                            onValueChange={(value) => updateRevenue(revenue.id, 'currency', value)}
                          >
                            <SelectTrigger className="border-0 p-1 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CURRENCIES.map(currency => (
                                <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="border border-gray-300 p-2 text-center">
                          <Checkbox
                            checked={revenue.checked}
                            onCheckedChange={(checked) => updateRevenue(revenue.id, 'checked', checked)}
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
                              onClick={() => openDialog(revenue, 'view')}
                              className="h-6 w-6 p-0"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDialog(revenue, 'edit')}
                              className="h-6 w-6 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteRevenue(revenue.id)}
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
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
      </div>

      {/* Regular detail dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'view' ? 'View Revenue' : 'Edit Revenue'}
            </DialogTitle>
          </DialogHeader>
          {selectedRevenue && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Year</label>
                  <div className="p-2 bg-gray-50 rounded">{selectedRevenue.year}</div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Month</label>
                  <div className="p-2 bg-gray-50 rounded">{getMonthName(selectedRevenue.month)}</div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                {dialogMode === 'view' ? (
                  <div className="p-2 bg-gray-50 rounded">{selectedRevenue.description}</div>
                ) : (
                  <Input
                    value={selectedRevenue.description}
                    onChange={(e) => setSelectedRevenue({...selectedRevenue, description: e.target.value})}
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Unit Price</label>
                  {dialogMode === 'view' ? (
                    <div className="p-2 bg-gray-50 rounded text-right">{formatNumber(selectedRevenue.unitPrice)}</div>
                  ) : (
                    <NumberInput
                      value={selectedRevenue.unitPrice}
                      onChange={(value) => setSelectedRevenue({...selectedRevenue, unitPrice: value})}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Volume</label>
                  {dialogMode === 'view' ? (
                    <div className="p-2 bg-gray-50 rounded text-right">{formatNumber(selectedRevenue.volume)}</div>
                  ) : (
                    <NumberInput
                      value={selectedRevenue.volume}
                      onChange={(value) => setSelectedRevenue({...selectedRevenue, volume: value})}
                    />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Revenue</label>
                <div className="p-2 bg-gray-50 rounded text-right">{formatNumber(selectedRevenue.unitPrice * selectedRevenue.volume)}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Customer</label>
                  {dialogMode === 'view' ? (
                    <div className="p-2 bg-gray-50 rounded">{selectedRevenue.customer}</div>
                  ) : (
                    <Select
                      value={selectedRevenue.customer}
                      onValueChange={(value) => setSelectedRevenue({...selectedRevenue, customer: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CUSTOMERS.map(customer => (
                          <SelectItem key={customer} value={customer}>{customer}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map(currency => (
                          <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Project</label>
                {dialogMode === 'view' ? (
                  <div className="p-2 bg-gray-50 rounded">{selectedRevenue.project}</div>
                ) : (
                  <Select
                    value={selectedRevenue.project}
                    onValueChange={(value) => setSelectedRevenue({...selectedRevenue, project: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECTS.map(project => (
                        <SelectItem key={project} value={project}>{project}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Checked</label>
                {dialogMode === 'view' ? (
                  <div className="p-2 bg-gray-50 rounded">{selectedRevenue.checked ? 'Yes' : 'No'}</div>
                ) : (
                  <div className="flex items-center space-x-2 p-2">
                    <Checkbox
                      checked={selectedRevenue.checked}
                      onCheckedChange={(checked) => setSelectedRevenue({...selectedRevenue, checked: Boolean(checked)})}
                    />
                    <span className="text-sm">{selectedRevenue.checked ? 'Yes' : 'No'}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                {dialogMode === 'view' ? (
                  <div className="p-2 bg-gray-50 rounded min-h-[60px]">{selectedRevenue.notes}</div>
                ) : (
                  <Input
                    value={selectedRevenue.notes}
                    onChange={(e) => setSelectedRevenue({...selectedRevenue, notes: e.target.value})}
                  />
                )}
              </div>

              {dialogMode === 'edit' && (
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveChanges}>
                    Save
                  </Button>
                </div>
              )}
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
  );
};

export default Revenues;
