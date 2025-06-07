import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatNumber, parseFormattedNumber } from "@/lib/format";

interface CostData {
  id: string;
  year: number;
  month: string;
  company: string;
  salaryCost: number;
  materialCost: number;
  serviceCost: number;
  otherCost: number;
  totalCost: number;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const mockCosts: CostData[] = [
  {
    id: "1",
    year: 2024,
    month: "Jan",
    company: "ABC Corp",
    salaryCost: 150000000,
    materialCost: 80000000,
    serviceCost: 30000000,
    otherCost: 15000000,
    totalCost: 275000000,
  },
  {
    id: "2",
    year: 2024,
    month: "Feb",
    company: "ABC Corp",
    salaryCost: 155000000,
    materialCost: 85000000,
    serviceCost: 32000000,
    otherCost: 16000000,
    totalCost: 288000000,
  },
  {
    id: "3",
    year: 2024,
    month: "Jan",
    company: "XYZ Ltd",
    salaryCost: 120000000,
    materialCost: 65000000,
    serviceCost: 25000000,
    otherCost: 12000000,
    totalCost: 222000000,
  },
];

const Costs = () => {
  const { toast } = useToast();
  const [costs, setCosts] = useState<CostData[]>(mockCosts);
  const [filteredCosts, setFilteredCosts] = useState<CostData[]>(mockCosts);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [filterYear, setFilterYear] = useState("");
  const [filterMonth, setFilterMonth] = useState("");

  useEffect(() => {
    applyFilters();
  }, [costs, filterYear, filterMonth]);

  const addNewCost = () => {
    const newCost: CostData = {
      id: Date.now().toString(),
      year: new Date().getFullYear(),
      month: "Jan",
      company: "",
      salaryCost: 0,
      materialCost: 0,
      serviceCost: 0,
      otherCost: 0,
      totalCost: 0,
    };
    setCosts(prev => [...prev, newCost]);
  };

  const updateCost = (id: string, field: keyof CostData, value: string | number) => {
    setCosts(prev =>
      prev.map(cost => {
        if (cost.id === id) {
          const updatedCost = { ...cost, [field]: value };
          // Recalculate totalCost when any cost field changes
          if (field === 'salaryCost' || field === 'materialCost' || field === 'serviceCost' || field === 'otherCost') {
            updatedCost.totalCost =
              Number(updatedCost.salaryCost) +
              Number(updatedCost.materialCost) +
              Number(updatedCost.serviceCost) +
              Number(updatedCost.otherCost);
          }
          return updatedCost;
        }
        return cost;
      })
    );
  };

  const handleCostChange = (id: string, field: keyof CostData, value: string) => {
    const numericValue = parseFormattedNumber(value);
    updateCost(id, field, numericValue);
  };

  const deleteCost = (id: string) => {
    setCosts(prev => prev.filter(cost => cost.id !== id));
    toast({
      title: "Deleted",
      description: "Cost data deleted successfully",
    });
  };

  const saveData = () => {
    toast({
      title: "Saved",
      description: "Cost data saved successfully",
    });
  };

  const applyFilters = () => {
    let filteredData = [...costs];

    if (filterYear) {
      filteredData = filteredData.filter(cost => cost.year === Number(filterYear));
    }

    if (filterMonth) {
      filteredData = filteredData.filter(cost => cost.month === filterMonth);
    }

    setFilteredCosts(filteredData);
  };

  const clearFilters = () => {
    setFilterYear("");
    setFilterMonth("");
    setIsFilterDialogOpen(false);
    setFilteredCosts([...costs]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Cost Management"
        description="Record and manage cost data by year and month"
        icon={Plus}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={saveData}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button onClick={addNewCost}>
              <Plus className="h-4 w-4 mr-2" />
              Add Row
            </Button>
          </div>
        }
      />

      <div className="p-6">
        <Card className="bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Cost Data</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Filter Costs</DialogTitle>
                    <DialogDescription>
                      Filter cost data by year and month.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="year" className="text-right text-sm font-medium">
                        Year
                      </label>
                      <Input
                        type="number"
                        id="year"
                        value={filterYear}
                        onChange={e => setFilterYear(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="month" className="text-right text-sm font-medium">
                        Month
                      </label>
                      <Select value={filterMonth} onValueChange={setFilterMonth}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select a month" />
                        </SelectTrigger>
                        <SelectContent>
                          {MONTHS.map(month => (
                            <SelectItem key={month} value={month}>
                              {month}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <Button variant="ghost" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                    <Button onClick={() => setIsFilterDialogOpen(false)}>Apply Filters</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-red-50">
                    <th className="border border-gray-300 p-2 text-center font-medium w-16">No.</th>
                    <th className="border border-gray-300 p-2 text-left font-medium">
                      <div className="flex items-center justify-between">
                        <span>Year</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsFilterDialogOpen(true)}
                          className="h-6 w-6 p-0"
                          title="Filter"
                        >
                          <Filter className="h-4 w-4" />
                        </Button>
                      </div>
                    </th>
                    <th className="border border-gray-300 p-2 text-left font-medium">Month</th>
                    <th className="border border-gray-300 p-2 text-left font-medium">Company</th>
                    <th className="border border-gray-300 p-2 text-right font-medium">Salary Cost</th>
                    <th className="border border-gray-300 p-2 text-right font-medium">Material Cost</th>
                    <th className="border border-gray-300 p-2 text-right font-medium">Service Cost</th>
                    <th className="border border-gray-300 p-2 text-right font-medium">Other Cost</th>
                    <th className="border border-gray-300 p-2 text-right font-medium">Total Cost</th>
                    <th className="border border-gray-300 p-2 text-center font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCosts.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="border border-gray-300 p-8 text-center text-gray-500">
                        No data available. Click "Add Row" to start entering data.
                      </td>
                    </tr>
                  ) : (
                    filteredCosts.map((cost, index) => (
                      <tr key={cost.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-2 text-center text-sm text-gray-600">
                          {index + 1}
                        </td>
                        <td className="border border-gray-300 p-1">
                          <Input
                            type="number"
                            value={cost.year}
                            onChange={e => updateCost(cost.id, 'year', parseInt(e.target.value) || 0)}
                            className="border-0 p-1 h-8"
                            onFocus={e => e.target.select()}
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <Select value={cost.month} onValueChange={value => updateCost(cost.id, 'month', value)}>
                            <SelectTrigger className="border-0 p-1 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {MONTHS.map(month => (
                                <SelectItem key={month} value={month}>
                                  {month}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="border border-gray-300 p-1">
                          <Input
                            type="text"
                            value={cost.company}
                            onChange={e => updateCost(cost.id, 'company', e.target.value)}
                            className="border-0 p-1 h-8"
                            onFocus={e => e.target.select()}
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <Input
                            type="text"
                            value={formatNumber(cost.salaryCost)}
                            onChange={e => handleCostChange(cost.id, 'salaryCost', e.target.value)}
                            className="border-0 p-1 h-8 text-right"
                            onFocus={e => e.target.select()}
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <Input
                            type="text"
                            value={formatNumber(cost.materialCost)}
                            onChange={e => handleCostChange(cost.id, 'materialCost', e.target.value)}
                            className="border-0 p-1 h-8 text-right"
                            onFocus={e => e.target.select()}
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <Input
                            type="text"
                            value={formatNumber(cost.serviceCost)}
                            onChange={e => handleCostChange(cost.id, 'serviceCost', e.target.value)}
                            className="border-0 p-1 h-8 text-right"
                            onFocus={e => e.target.select()}
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <Input
                            type="text"
                            value={formatNumber(cost.otherCost)}
                            onChange={e => handleCostChange(cost.id, 'otherCost', e.target.value)}
                            className="border-0 p-1 h-8 text-right"
                            onFocus={e => e.target.select()}
                          />
                        </td>
                        <td className="border border-gray-300 p-2 text-right font-medium">
                          {formatNumber(cost.totalCost)}
                        </td>
                        <td className="border border-gray-300 p-2 text-center">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this cost data? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteCost(cost.id)} className="bg-red-600 hover:bg-red-700">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
    </div>
  );
};

export default Costs;
