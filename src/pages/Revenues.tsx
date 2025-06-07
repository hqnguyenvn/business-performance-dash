
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
} from "@/components/ui/dialog";
import { formatNumber, parseFormattedNumber } from "@/lib/format";

interface RevenueData {
  id: string;
  year: number;
  month: string;
  bmm: number;
  revenue: number;
  companyID: string;
}

interface MasterData {
  id: string;
  code: string;
  name: string;
  description?: string;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const mockRevenues: RevenueData[] = [
  {
    id: "1",
    year: 2024,
    month: "Jan",
    bmm: 15.5,
    revenue: 1200000000,
    companyID: "1",
  },
  {
    id: "2",
    year: 2024,
    month: "Feb",
    bmm: 16.0,
    revenue: 1300000000,
    companyID: "2",
  },
  {
    id: "3",
    year: 2024,
    month: "Mar",
    bmm: 17.2,
    revenue: 1450000000,
    companyID: "1",
  },
  {
    id: "4",
    year: 2024,
    month: "Apr",
    bmm: 15.8,
    revenue: 1250000000,
    companyID: "3",
  },
  {
    id: "5",
    year: 2024,
    month: "May",
    bmm: 16.5,
    revenue: 1350000000,
    companyID: "2",
  },
];

const mockCompanies: MasterData[] = [
  {
    id: "1",
    code: "ABC",
    name: "ABC Company",
  },
  {
    id: "2",
    code: "XYZ",
    name: "XYZ Corporation",
  },
  {
    id: "3",
    code: "LMN",
    name: "LMN Enterprises",
  },
];

const Revenues = () => {
  const { toast } = useToast();
  const [revenues, setRevenues] = useState<RevenueData[]>(mockRevenues);
  const [filteredRevenues, setFilteredRevenues] = useState<RevenueData[]>(mockRevenues);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [filterYear, setFilterYear] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    applyFilters();
  }, [revenues, filterYear]);

  const addNewRevenue = () => {
    const newRevenue: RevenueData = {
      id: Date.now().toString(),
      year: new Date().getFullYear(),
      month: "Jan",
      bmm: 0,
      revenue: 0,
      companyID: "1",
    };
    setRevenues(prev => [...prev, newRevenue]);
  };

  const updateRevenue = (id: string, field: keyof RevenueData, value: string | number) => {
    setRevenues(prev => prev.map(revenue =>
      revenue.id === id ? { ...revenue, [field]: value } : revenue
    ));
  };

  const handleRevenueChange = (id: string, value: string) => {
    const numericValue = parseFormattedNumber(value);
    updateRevenue(id, 'revenue', numericValue);
  };

  const deleteRevenue = (id: string) => {
    setRevenues(prev => prev.filter(revenue => revenue.id !== id));
    toast({
      title: "Deleted",
      description: "Revenue data deleted successfully",
    });
    setDeleteId(null);
  };

  const saveData = () => {
    toast({
      title: "Saved",
      description: "Revenue data saved successfully",
    });
  };

  const applyFilters = () => {
    let filtered = [...revenues];

    if (filterYear) {
      filtered = filtered.filter(revenue => revenue.year === filterYear);
    }

    setFilteredRevenues(filtered);
  };

  const clearFilters = () => {
    setFilterYear(null);
    setIsFilterDialogOpen(false);
    setFilteredRevenues([...revenues]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Revenue Management"
        description="BMM & Revenue by year and month"
        icon={Plus}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={saveData}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button onClick={addNewRevenue}>
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
              <CardTitle>Revenue List</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-blue-50">
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
                    <th className="border border-gray-300 p-2 text-right font-medium">BMM</th>
                    <th className="border border-gray-300 p-2 text-right font-medium">Revenue</th>
                    <th className="border border-gray-300 p-2 text-center font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRevenues.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="border border-gray-300 p-8 text-center text-gray-500">
                        No data available. Click "Add Row" to start entering data.
                      </td>
                    </tr>
                  ) : (
                    filteredRevenues.map((revenue, index) => (
                      <tr key={revenue.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-2 text-center text-sm text-gray-600">
                          {index + 1}
                        </td>
                        <td className="border border-gray-300 p-1">
                          <Input
                            type="number"
                            value={revenue.year}
                            onChange={(e) => updateRevenue(revenue.id, 'year', parseInt(e.target.value) || 0)}
                            className="border-0 p-1 h-8"
                            onFocus={(e) => e.target.select()}
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <Select value={revenue.month} onValueChange={(value) => updateRevenue(revenue.id, 'month', value)}>
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
                            value={revenue.companyID}
                            onValueChange={(value) => updateRevenue(revenue.id, 'companyID', value)}
                          >
                            <SelectTrigger className="border-0 p-1 h-8">
                              <SelectValue placeholder="Select company" />
                            </SelectTrigger>
                            <SelectContent>
                              {mockCompanies.map(company => (
                                <SelectItem key={company.id} value={company.id}>
                                  {company.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="border border-gray-300 p-1">
                          <Input
                            type="number"
                            value={revenue.bmm}
                            onChange={(e) => updateRevenue(revenue.id, 'bmm', parseFloat(e.target.value) || 0)}
                            className="border-0 p-1 h-8 text-right"
                            onFocus={(e) => e.target.select()}
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <Input
                            type="text"
                            value={formatNumber(revenue.revenue)}
                            onChange={(e) => handleRevenueChange(revenue.id, e.target.value)}
                            className="border-0 p-1 h-8 text-right"
                            onFocus={(e) => e.target.select()}
                          />
                        </td>
                        <td className="border border-gray-300 p-2 text-center">
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
                                  Are you sure you want to delete this revenue data? This action cannot be undone.
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

      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Filter Revenues</DialogTitle>
            <DialogDescription>
              Filter revenue data by year.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="year" className="text-right text-sm font-medium leading-none text-gray-800">
                Year
              </label>
              <Input
                type="number"
                id="year"
                value={filterYear || ''}
                onChange={(e) => setFilterYear(e.target.value === '' ? null : parseInt(e.target.value))}
                className="col-span-3 h-10"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={clearFilters}>
              Clear Filters
            </Button>
            <Button type="submit" onClick={applyFilters}>
              Apply Filters
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your revenue data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteRevenue(deleteId || '')}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Revenues;
