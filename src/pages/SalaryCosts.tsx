
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
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Users, Plus, Download, Trash2, Eye, Edit, MoreHorizontal, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { NumberInput } from "@/components/ui/number-input";
import { formatNumber } from "@/lib/format";

interface SalaryCost {
  id: string;
  year: number;
  month: string;
  company: string;
  division: string;
  customerID: string;
  amount: number;
  notes: string;
}

interface MasterData {
  id: string;
  code: string;
  name: string;
  description?: string;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const SalaryCosts = () => {
  const { toast } = useToast();
  const [salaryCosts, setSalaryCosts] = useState<SalaryCost[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonths, setSelectedMonths] = useState<string[]>(MONTHS);
  
  // Master data for dropdowns
  const [companies, setCompanies] = useState<MasterData[]>([
    { id: "1", code: "COMP001", name: "Parent Company", description: "Main company" },
    { id: "2", code: "COMP002", name: "Hanoi Branch", description: "Northern branch" },
  ]);
  
  const [divisions, setDivisions] = useState<MasterData[]>([
    { id: "1", code: "DIV001", name: "Development Department", description: "R&D division" },
    { id: "2", code: "DIV002", name: "Sales Department", description: "Sales division" },
  ]);
  
  const [customers, setCustomers] = useState<MasterData[]>([
    { id: "1", code: "CUST001", name: "ABC Technology Company", description: "VIP customer" },
    { id: "2", code: "CUST002", name: "XYZ Solutions Ltd", description: "Regular customer" },
  ]);

  // View/Edit dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCost, setSelectedCost] = useState<SalaryCost | null>(null);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit'>('view');

  // Delete confirmation dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [costToDelete, setCostToDelete] = useState<string | null>(null);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedSalaryCosts = localStorage.getItem('salaryCosts');
    if (savedSalaryCosts) {
      setSalaryCosts(JSON.parse(savedSalaryCosts));
    }
  }, []);

  // Save data to localStorage whenever salaryCosts change
  useEffect(() => {
    localStorage.setItem('salaryCosts', JSON.stringify(salaryCosts));
  }, [salaryCosts]);

  // Get unique years from cost data, including current year
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from(new Set([...(salaryCosts.map(c => c.year) || []), currentYear])).sort((a, b) => b - a);

  // Filter salary costs based on selected year and months
  const filteredSalaryCosts = salaryCosts.filter(cost => {
    const yearMatch = cost.year === parseInt(selectedYear);
    const monthMatch = selectedMonths.includes(cost.month);
    return yearMatch && monthMatch;
  });

  const addNewRow = () => {
    const newSalaryCost: SalaryCost = {
      id: Date.now().toString(),
      year: parseInt(selectedYear),
      month: selectedMonths.length > 0 ? selectedMonths[0] : "Jan",
      company: "",
      division: "",
      customerID: "",
      amount: 0,
      notes: "",
    };
    setSalaryCosts([...salaryCosts, newSalaryCost]);
  };

  const updateSalaryCost = (id: string, field: keyof SalaryCost, value: any) => {
    setSalaryCosts(salaryCosts.map(cost => 
      cost.id === id ? { ...cost, [field]: value } : cost
    ));
  };

  const deleteSalaryCost = (id: string) => {
    setCostToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (costToDelete) {
      setSalaryCosts(prev => prev.filter(cost => cost.id !== costToDelete));
      toast({
        title: "Deleted",
        description: "Salary cost record has been deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setCostToDelete(null);
    }
  };

  const openDialog = (cost: SalaryCost, mode: 'view' | 'edit') => {
    setSelectedCost(cost);
    setDialogMode(mode);
    setIsDialogOpen(true);
  };

  const saveChanges = () => {
    if (selectedCost) {
      setSalaryCosts(prev => 
        prev.map(cost => cost.id === selectedCost.id ? selectedCost : cost)
      );
      toast({
        title: "Changes Saved",
        description: "Salary cost record has been updated successfully",
      });
      setIsDialogOpen(false);
    }
  };

  const saveAllData = () => {
    localStorage.setItem('salaryCosts', JSON.stringify(salaryCosts));
    toast({
      title: "Save All Data",
      description: "All salary cost data has been saved successfully",
    });
  };

  const exportToCSV = () => {
    toast({
      title: "Export Data",
      description: "Salary cost data has been exported to CSV successfully",
    });
  };

  const handleYearChange = (value: string) => {
    setSelectedYear(value);
  };

  const handleMonthToggle = (month: string) => {
    setSelectedMonths(prev => {
      if (prev.includes(month)) {
        return prev.filter(m => m !== month);
      } else {
        return [...prev, month];
      }
    });
  };

  const getCompanyOptions = () => {
    return companies.map(company => (
      <SelectItem key={company.id} value={company.code}>
        {company.name}
      </SelectItem>
    ));
  };

  const getDivisionOptions = () => {
    return divisions.map(division => (
      <SelectItem key={division.id} value={division.code}>
        {division.name}
      </SelectItem>
    ));
  };

  const getCustomerOptions = () => {
    return customers.map(customer => (
      <SelectItem key={customer.id} value={customer.code}>
        {customer.name}
      </SelectItem>
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Salary Costs by Customer"
        description="Record salary costs by customer"
        icon={Users}
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
                      <div key={month} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`month-${month}`}
                          checked={selectedMonths.includes(month)}
                          onCheckedChange={() => handleMonthToggle(month)}
                        />
                        <label 
                          htmlFor={`month-${month}`} 
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {month}
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
            <div className="flex items-center justify-between">
              <CardTitle>Salary Cost Data ({filteredSalaryCosts.length} records)</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-purple-50">
                    <th className="border border-gray-300 p-2 text-left font-medium">Year</th>
                    <th className="border border-gray-300 p-2 text-left font-medium">Month</th>
                    <th className="border border-gray-300 p-2 text-left font-medium">Company</th>
                    <th className="border border-gray-300 p-2 text-left font-medium">Division</th>
                    <th className="border border-gray-300 p-2 text-left font-medium">Customer ID</th>
                    <th className="border border-gray-300 p-2 text-left font-medium">Amount</th>
                    <th className="border border-gray-300 p-2 text-left font-medium">Notes</th>
                    <th className="border border-gray-300 p-2 text-center font-medium">
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
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSalaryCosts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="border border-gray-300 p-8 text-center text-gray-500">
                        No data available. Click "Add Row" to start entering data.
                      </td>
                    </tr>
                  ) : (
                    filteredSalaryCosts.map((salaryCost) => (
                      <tr key={salaryCost.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-1">
                          <Input
                            type="number"
                            value={salaryCost.year.toString()}
                            onChange={(e) => updateSalaryCost(salaryCost.id, 'year', parseInt(e.target.value) || currentYear)}
                            className="border-0 p-1 h-8"
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <Select
                            value={salaryCost.month}
                            onValueChange={(value) => updateSalaryCost(salaryCost.id, 'month', value)}
                          >
                            <SelectTrigger className="border-0 p-1 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {MONTHS.map(month => (
                                <SelectItem key={month} value={month}>{month}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="border border-gray-300 p-1">
                          <Select
                            value={salaryCost.company}
                            onValueChange={(value) => updateSalaryCost(salaryCost.id, 'company', value)}
                          >
                            <SelectTrigger className="border-0 p-1 h-8">
                              <SelectValue placeholder="Select company" />
                            </SelectTrigger>
                            <SelectContent>
                              {getCompanyOptions()}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="border border-gray-300 p-1">
                          <Select
                            value={salaryCost.division}
                            onValueChange={(value) => updateSalaryCost(salaryCost.id, 'division', value)}
                          >
                            <SelectTrigger className="border-0 p-1 h-8">
                              <SelectValue placeholder="Select division" />
                            </SelectTrigger>
                            <SelectContent>
                              {getDivisionOptions()}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="border border-gray-300 p-1">
                          <Select
                            value={salaryCost.customerID}
                            onValueChange={(value) => updateSalaryCost(salaryCost.id, 'customerID', value)}
                          >
                            <SelectTrigger className="border-0 p-1 h-8">
                              <SelectValue placeholder="Select customer" />
                            </SelectTrigger>
                            <SelectContent>
                              {getCustomerOptions()}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="border border-gray-300 p-1">
                          <NumberInput
                            value={salaryCost.amount}
                            onChange={(value) => updateSalaryCost(salaryCost.id, 'amount', value)}
                            className="border-0 p-1 h-8 text-right"
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <Input
                            value={salaryCost.notes}
                            onChange={(e) => updateSalaryCost(salaryCost.id, 'notes', e.target.value)}
                            className="border-0 p-1 h-8"
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <div className="flex justify-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-36">
                                <DropdownMenuItem onClick={() => openDialog(salaryCost, 'view')}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  <span>View</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openDialog(salaryCost, 'edit')}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  <span>Edit</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => deleteSalaryCost(salaryCost.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  <span>Delete</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'view' ? 'View Salary Cost' : 'Edit Salary Cost'}
            </DialogTitle>
          </DialogHeader>
          {selectedCost && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Year</label>
                  {dialogMode === 'view' ? (
                    <div className="p-2 bg-gray-50 rounded">{selectedCost.year}</div>
                  ) : (
                    <Input
                      type="number"
                      value={selectedCost.year.toString()}
                      onChange={(e) => setSelectedCost({...selectedCost, year: parseInt(e.target.value) || currentYear})}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Month</label>
                  {dialogMode === 'view' ? (
                    <div className="p-2 bg-gray-50 rounded">{selectedCost.month}</div>
                  ) : (
                    <Select
                      value={selectedCost.month}
                      onValueChange={(value) => setSelectedCost({...selectedCost, month: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map(month => (
                          <SelectItem key={month} value={month}>{month}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Company</label>
                {dialogMode === 'view' ? (
                  <div className="p-2 bg-gray-50 rounded">{selectedCost.company}</div>
                ) : (
                  <Select
                    value={selectedCost.company}
                    onValueChange={(value) => setSelectedCost({...selectedCost, company: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      {getCompanyOptions()}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Division</label>
                {dialogMode === 'view' ? (
                  <div className="p-2 bg-gray-50 rounded">{selectedCost.division}</div>
                ) : (
                  <Select
                    value={selectedCost.division}
                    onValueChange={(value) => setSelectedCost({...selectedCost, division: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select division" />
                    </SelectTrigger>
                    <SelectContent>
                      {getDivisionOptions()}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Customer ID</label>
                {dialogMode === 'view' ? (
                  <div className="p-2 bg-gray-50 rounded">{selectedCost.customerID}</div>
                ) : (
                  <Select
                    value={selectedCost.customerID}
                    onValueChange={(value) => setSelectedCost({...selectedCost, customerID: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {getCustomerOptions()}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Amount</label>
                {dialogMode === 'view' ? (
                  <div className="p-2 bg-gray-50 rounded text-right">{formatNumber(selectedCost.amount)}</div>
                ) : (
                  <NumberInput
                    value={selectedCost.amount}
                    onChange={(value) => setSelectedCost({...selectedCost, amount: value})}
                    className="text-right"
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                {dialogMode === 'view' ? (
                  <div className="p-2 bg-gray-50 rounded min-h-[60px]">{selectedCost.notes}</div>
                ) : (
                  <Input
                    value={selectedCost.notes}
                    onChange={(e) => setSelectedCost({...selectedCost, notes: e.target.value})}
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
              This action cannot be undone. This will permanently delete this salary cost record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCostToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SalaryCosts;
