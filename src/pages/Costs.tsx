
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Receipt, Plus, Download, Edit, Eye, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { NumberInput } from "@/components/ui/number-input";
import { formatNumber, parseFormattedNumber } from "@/lib/format";

interface Cost {
  id: string;
  year: number;
  month: number;
  description: string;
  price: number;
  volume: number;
  cost: number;
  category: string;
  isCost: boolean;
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

const COST_CATEGORIES = [
  "Infrastructure", "Admin", "SalesVN", "Benefit", "Office renting", "Process", 
  "Insurance", "Tax", "Training", "Outsourcing", "Marketing", "Dividend", 
  "Recruitment", "Salary", "Charity", "Bonus", "AriaService", "BusinessTrip", "Bankfee", "SaleSPLUS"
];

const Costs = () => {
  const { toast } = useToast();
  const [costs, setCosts] = useState<Cost[]>([]);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [selectedMonths, setSelectedMonths] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCost, setSelectedCost] = useState<Cost | null>(null);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit'>('view');

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedCosts = localStorage.getItem('costs');
    if (savedCosts) {
      setCosts(JSON.parse(savedCosts));
    }
  }, []);

  // Save data to localStorage whenever costs change
  useEffect(() => {
    localStorage.setItem('costs', JSON.stringify(costs));
  }, [costs]);

  // Get unique years from cost data, including current year
  const availableYears = Array.from(new Set([...costs.map(c => c.year), currentYear])).sort((a, b) => b - a);

  // Filter costs based on selected year and months
  const filteredCosts = costs.filter(cost => {
    const yearMatch = cost.year === parseInt(selectedYear);
    const monthMatch = selectedMonths.includes(cost.month);
    return yearMatch && monthMatch;
  });

  const addNewRow = () => {
    const newCost: Cost = {
      id: Date.now().toString(),
      year: parseInt(selectedYear),
      month: selectedMonths.length > 0 ? selectedMonths[0] : currentMonth,
      description: "",
      price: 0,
      volume: 0,
      cost: 0,
      category: "Infrastructure",
      isCost: true,
      checked: false,
      notes: "",
    };
    setCosts([...costs, newCost]);
  };

  const updateCost = (id: string, field: keyof Cost, value: any) => {
    setCosts(costs.map(cost => {
      if (cost.id === id) {
        const updated = { ...cost, [field]: value };
        // Auto calculate cost
        if (field === 'price' || field === 'volume') {
          updated.cost = updated.price * updated.volume;
        }
        return updated;
      }
      return cost;
    }));
  };

  const openDialog = (cost: Cost, mode: 'view' | 'edit') => {
    setSelectedCost(cost);
    setDialogMode(mode);
    setIsDialogOpen(true);
  };

  const saveChanges = () => {
    if (selectedCost) {
      updateCost(selectedCost.id, 'description', selectedCost.description);
      updateCost(selectedCost.id, 'price', selectedCost.price);
      updateCost(selectedCost.id, 'volume', selectedCost.volume);
      updateCost(selectedCost.id, 'category', selectedCost.category);
      updateCost(selectedCost.id, 'isCost', selectedCost.isCost);
      updateCost(selectedCost.id, 'checked', selectedCost.checked);
      updateCost(selectedCost.id, 'notes', selectedCost.notes);
      setIsDialogOpen(false);
      toast({
        title: "Save Successful",
        description: "Cost data has been updated",
      });
    }
  };

  const saveAllData = () => {
    localStorage.setItem('costs', JSON.stringify(costs));
    toast({
      title: "Save All Data",
      description: "All cost data has been saved successfully",
    });
  };

  const exportToCSV = () => {
    toast({
      title: "Export Data",
      description: "Cost data has been exported to CSV successfully",
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
        title="Cost Management"
        description="Record costs by year and month"
        icon={Receipt}
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
                  <span className="text-sm text-gray-600 min-w-[40px]">Year</span>
                </div>

                {/* Month Filter */}
                <div className="flex-1">
                  <div className="mb-2">
                    <span className="text-sm text-gray-600">Months</span>
                  </div>
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
            <CardTitle>Cost Data ({filteredCosts.length} records)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-red-50">
                    <th className="border border-gray-300 p-2 text-left font-medium">Year</th>
                    <th className="border border-gray-300 p-2 text-left font-medium">Month</th>
                    <th className="border border-gray-300 p-2 text-left font-medium">Description</th>
                    <th className="border border-gray-300 p-2 text-right font-medium">Unit Price</th>
                    <th className="border border-gray-300 p-2 text-right font-medium">Volume</th>
                    <th className="border border-gray-300 p-2 text-right font-medium">Cost</th>
                    <th className="border border-gray-300 p-2 text-left font-medium">Category</th>
                    <th className="border border-gray-300 p-2 text-center font-medium">Is Cost</th>
                    <th className="border border-gray-300 p-2 text-center font-medium">Checked</th>
                    <th className="border border-gray-300 p-2 text-left font-medium">Notes</th>
                    <th className="border border-gray-300 p-2 text-center font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCosts.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="border border-gray-300 p-8 text-center text-gray-500">
                        {costs.length === 0 
                          ? "No data available. Click \"Add Row\" to start entering data."
                          : "No data matches the selected filters. Try adjusting the year or month selection."
                        }
                      </td>
                    </tr>
                  ) : (
                    filteredCosts.map((cost) => (
                      <tr key={cost.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-1">
                          <Input
                            value={cost.year.toString()}
                            onChange={(e) => updateCost(cost.id, 'year', parseInt(e.target.value) || currentYear)}
                            className="border-0 p-1 h-8 text-center"
                            type="number"
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <Select
                            value={cost.month.toString()}
                            onValueChange={(value) => updateCost(cost.id, 'month', parseInt(value))}
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
                        </td>
                        <td className="border border-gray-300 p-1">
                          <Input
                            value={cost.description}
                            onChange={(e) => updateCost(cost.id, 'description', e.target.value)}
                            className="border-0 p-1 h-8"
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <NumberInput
                            value={cost.price}
                            onChange={(value) => updateCost(cost.id, 'price', value)}
                            className="border-0 p-1 h-8"
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <NumberInput
                            value={cost.volume}
                            onChange={(value) => updateCost(cost.id, 'volume', value)}
                            className="border-0 p-1 h-8"
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <Input
                            value={formatNumber(cost.cost)}
                            readOnly
                            className="border-0 p-1 h-8 bg-gray-50 text-right"
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <Select
                            value={cost.category}
                            onValueChange={(value) => updateCost(cost.id, 'category', value)}
                          >
                            <SelectTrigger className="border-0 p-1 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {COST_CATEGORIES.map(category => (
                                <SelectItem key={category} value={category}>{category}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="border border-gray-300 p-2 text-center">
                          <Checkbox
                            checked={cost.isCost}
                            onCheckedChange={(checked) => updateCost(cost.id, 'isCost', checked)}
                          />
                        </td>
                        <td className="border border-gray-300 p-2 text-center">
                          <Checkbox
                            checked={cost.checked}
                            onCheckedChange={(checked) => updateCost(cost.id, 'checked', checked)}
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <Input
                            value={cost.notes}
                            onChange={(e) => updateCost(cost.id, 'notes', e.target.value)}
                            className="border-0 p-1 h-8"
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDialog(cost, 'view')}
                              className="h-6 w-6 p-0"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDialog(cost, 'edit')}
                              className="h-6 w-6 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'view' ? 'View Cost' : 'Edit Cost'}
            </DialogTitle>
          </DialogHeader>
          {selectedCost && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Year</label>
                  <div className="p-2 bg-gray-50 rounded">{selectedCost.year}</div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Month</label>
                  <div className="p-2 bg-gray-50 rounded">{getMonthName(selectedCost.month)}</div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                {dialogMode === 'view' ? (
                  <div className="p-2 bg-gray-50 rounded">{selectedCost.description}</div>
                ) : (
                  <Input
                    value={selectedCost.description}
                    onChange={(e) => setSelectedCost({...selectedCost, description: e.target.value})}
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Unit Price</label>
                  {dialogMode === 'view' ? (
                    <div className="p-2 bg-gray-50 rounded text-right">{formatNumber(selectedCost.price)}</div>
                  ) : (
                    <Input
                      value={formatNumber(selectedCost.price)}
                      onChange={(e) => {
                        const value = parseFormattedNumber(e.target.value);
                        setSelectedCost({...selectedCost, price: value});
                      }}
                      className="text-right"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Volume</label>
                  {dialogMode === 'view' ? (
                    <div className="p-2 bg-gray-50 rounded text-right">{formatNumber(selectedCost.volume)}</div>
                  ) : (
                    <Input
                      value={formatNumber(selectedCost.volume)}
                      onChange={(e) => {
                        const value = parseFormattedNumber(e.target.value);
                        setSelectedCost({...selectedCost, volume: value});
                      }}
                      className="text-right"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Cost</label>
                <div className="p-2 bg-gray-50 rounded text-right">{formatNumber(selectedCost.price * selectedCost.volume)}</div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Cost Category</label>
                {dialogMode === 'view' ? (
                  <div className="p-2 bg-gray-50 rounded">{selectedCost.category}</div>
                ) : (
                  <Select
                    value={selectedCost.category}
                    onValueChange={(value) => setSelectedCost({...selectedCost, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COST_CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Is Cost</label>
                  {dialogMode === 'view' ? (
                    <div className="p-2 bg-gray-50 rounded">{selectedCost.isCost ? 'Yes' : 'No'}</div>
                  ) : (
                    <div className="flex items-center space-x-2 p-2">
                      <Checkbox
                        checked={selectedCost.isCost}
                        onCheckedChange={(checked) => setSelectedCost({...selectedCost, isCost: Boolean(checked)})}
                      />
                      <span className="text-sm">{selectedCost.isCost ? 'Yes' : 'No'}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Checked</label>
                  {dialogMode === 'view' ? (
                    <div className="p-2 bg-gray-50 rounded">{selectedCost.checked ? 'Yes' : 'No'}</div>
                  ) : (
                    <div className="flex items-center space-x-2 p-2">
                      <Checkbox
                        checked={selectedCost.checked}
                        onCheckedChange={(checked) => setSelectedCost({...selectedCost, checked: Boolean(checked)})}
                      />
                      <span className="text-sm">{selectedCost.checked ? 'Yes' : 'No'}</span>
                    </div>
                  )}
                </div>
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
    </div>
  );
};

export default Costs;
