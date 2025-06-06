
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
import { Users, Plus, Download, Edit, Eye, Save, Trash2 } from "lucide-react";
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

interface SalaryCost {
  id: string;
  year: number;
  month: number;
  employeeName: string;
  position: string;
  department: string;
  baseSalary: number;
  overtimeHours: number;
  overtimeRate: number;
  overtime: number;
  bonus: number;
  totalSalary: number;
  benefits: number;
  socialInsurance: number;
  totalCost: number;
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

const POSITIONS = ["Developer", "Senior Developer", "Team Lead", "Project Manager", "Designer", "QA Engineer"];
const DEPARTMENTS = ["Development", "Design", "QA", "Management", "Sales", "HR"];

const SalaryCosts = () => {
  const { toast } = useToast();
  const [salaryCosts, setSalaryCosts] = useState<SalaryCost[]>([]);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [selectedMonths, setSelectedMonths] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSalaryCost, setSelectedSalaryCost] = useState<SalaryCost | null>(null);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit'>('view');
  
  // Delete confirmation dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [salaryCostToDelete, setSalaryCostToDelete] = useState<string | null>(null);

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

  // Get unique years from salary cost data, including current year
  const availableYears = Array.from(new Set([...salaryCosts.map(s => s.year), currentYear])).sort((a, b) => b - a);

  // Filter salary costs based on selected year and months
  const baseSalaryCosts = salaryCosts.filter(salaryCost => {
    const yearMatch = salaryCost.year === parseInt(selectedYear);
    const monthMatch = selectedMonths.includes(salaryCost.month);
    return yearMatch && monthMatch;
  });

  // Add table filtering
  const { filteredData: filteredSalaryCosts, setFilter, getActiveFilters } = useTableFilter(baseSalaryCosts);

  const addNewRow = () => {
    const newSalaryCost: SalaryCost = {
      id: Date.now().toString(),
      year: parseInt(selectedYear),
      month: selectedMonths.length > 0 ? selectedMonths[0] : currentMonth,
      employeeName: "",
      position: POSITIONS[0],
      department: DEPARTMENTS[0],
      baseSalary: 0,
      overtimeHours: 0,
      overtimeRate: 0,
      overtime: 0,
      bonus: 0,
      totalSalary: 0,
      benefits: 0,
      socialInsurance: 0,
      totalCost: 0,
      checked: false,
      notes: "",
    };
    setSalaryCosts([...salaryCosts, newSalaryCost]);
  };

  const updateSalaryCost = (id: string, field: keyof SalaryCost, value: any) => {
    setSalaryCosts(salaryCosts.map(salaryCost => {
      if (salaryCost.id === id) {
        const updated = { ...salaryCost, [field]: value };
        // Auto calculate derived fields
        if (field === 'overtimeHours' || field === 'overtimeRate') {
          updated.overtime = updated.overtimeHours * updated.overtimeRate;
        }
        if (field === 'baseSalary' || field === 'overtime' || field === 'bonus' || updated.overtime !== salaryCost.overtime) {
          updated.totalSalary = updated.baseSalary + updated.overtime + updated.bonus;
        }
        if (field === 'benefits' || field === 'socialInsurance' || updated.totalSalary !== salaryCost.totalSalary) {
          updated.totalCost = updated.totalSalary + updated.benefits + updated.socialInsurance;
        }
        return updated;
      }
      return salaryCost;
    }));
  };

  const openDialog = (salaryCost: SalaryCost, mode: 'view' | 'edit') => {
    setSelectedSalaryCost(salaryCost);
    setDialogMode(mode);
    setIsDialogOpen(true);
  };

  const deleteSalaryCost = (id: string) => {
    setSalaryCostToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (salaryCostToDelete) {
      setSalaryCosts(prev => prev.filter(salaryCost => salaryCost.id !== salaryCostToDelete));
      toast({
        title: "Deleted",
        description: "Item successfully deleted",
      });
      setIsDeleteDialogOpen(false);
      setSalaryCostToDelete(null);
    }
  };

  const saveChanges = () => {
    if (selectedSalaryCost) {
      updateSalaryCost(selectedSalaryCost.id, 'employeeName', selectedSalaryCost.employeeName);
      updateSalaryCost(selectedSalaryCost.id, 'position', selectedSalaryCost.position);
      updateSalaryCost(selectedSalaryCost.id, 'department', selectedSalaryCost.department);
      updateSalaryCost(selectedSalaryCost.id, 'baseSalary', selectedSalaryCost.baseSalary);
      updateSalaryCost(selectedSalaryCost.id, 'overtimeHours', selectedSalaryCost.overtimeHours);
      updateSalaryCost(selectedSalaryCost.id, 'overtimeRate', selectedSalaryCost.overtimeRate);
      updateSalaryCost(selectedSalaryCost.id, 'bonus', selectedSalaryCost.bonus);
      updateSalaryCost(selectedSalaryCost.id, 'benefits', selectedSalaryCost.benefits);
      updateSalaryCost(selectedSalaryCost.id, 'socialInsurance', selectedSalaryCost.socialInsurance);
      updateSalaryCost(selectedSalaryCost.id, 'checked', selectedSalaryCost.checked);
      updateSalaryCost(selectedSalaryCost.id, 'notes', selectedSalaryCost.notes);
      setIsDialogOpen(false);
      toast({
        title: "Save Successful",
        description: "Salary cost data has been updated",
      });
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
        title="Salary Costs"
        description="Record salary costs by year and month"
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
            <CardTitle>Salary Cost Data ({filteredSalaryCosts.length} records)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-green-50">
                    <TableHead 
                      className="border border-gray-300"
                      showFilter={true}
                      filterData={baseSalaryCosts}
                      filterField="year"
                      onFilter={setFilter}
                      activeFilters={getActiveFilters("year")}
                    >
                      Year
                    </TableHead>
                    <TableHead 
                      className="border border-gray-300"
                      showFilter={true}
                      filterData={baseSalaryCosts}
                      filterField="month"
                      onFilter={setFilter}
                      activeFilters={getActiveFilters("month")}
                    >
                      Month
                    </TableHead>
                    <TableHead 
                      className="border border-gray-300"
                      showFilter={true}
                      filterData={baseSalaryCosts}
                      filterField="employeeName"
                      onFilter={setFilter}
                      activeFilters={getActiveFilters("employeeName")}
                    >
                      Employee Name
                    </TableHead>
                    <TableHead 
                      className="border border-gray-300"
                      showFilter={true}
                      filterData={baseSalaryCosts}
                      filterField="position"
                      onFilter={setFilter}
                      activeFilters={getActiveFilters("position")}
                    >
                      Position
                    </TableHead>
                    <TableHead 
                      className="border border-gray-300"
                      showFilter={true}
                      filterData={baseSalaryCosts}
                      filterField="department"
                      onFilter={setFilter}
                      activeFilters={getActiveFilters("department")}
                    >
                      Department
                    </TableHead>
                    <TableHead 
                      className="border border-gray-300 text-right"
                      showFilter={true}
                      filterData={baseSalaryCosts}
                      filterField="baseSalary"
                      onFilter={setFilter}
                      activeFilters={getActiveFilters("baseSalary")}
                    >
                      Base Salary
                    </TableHead>
                    <TableHead 
                      className="border border-gray-300 text-right"
                      showFilter={true}
                      filterData={baseSalaryCosts}
                      filterField="overtimeHours"
                      onFilter={setFilter}
                      activeFilters={getActiveFilters("overtimeHours")}
                    >
                      OT Hours
                    </TableHead>
                    <TableHead 
                      className="border border-gray-300 text-right"
                      showFilter={true}
                      filterData={baseSalaryCosts}
                      filterField="overtimeRate"
                      onFilter={setFilter}
                      activeFilters={getActiveFilters("overtimeRate")}
                    >
                      OT Rate
                    </TableHead>
                    <TableHead 
                      className="border border-gray-300 text-right"
                      showFilter={true}
                      filterData={baseSalaryCosts}
                      filterField="overtime"
                      onFilter={setFilter}
                      activeFilters={getActiveFilters("overtime")}
                    >
                      Overtime
                    </TableHead>
                    <TableHead 
                      className="border border-gray-300 text-right"
                      showFilter={true}
                      filterData={baseSalaryCosts}
                      filterField="bonus"
                      onFilter={setFilter}
                      activeFilters={getActiveFilters("bonus")}
                    >
                      Bonus
                    </TableHead>
                    <TableHead 
                      className="border border-gray-300 text-right"
                      showFilter={true}
                      filterData={baseSalaryCosts}
                      filterField="totalSalary"
                      onFilter={setFilter}
                      activeFilters={getActiveFilters("totalSalary")}
                    >
                      Total Salary
                    </TableHead>
                    <TableHead 
                      className="border border-gray-300 text-right"
                      showFilter={true}
                      filterData={baseSalaryCosts}
                      filterField="benefits"
                      onFilter={setFilter}
                      activeFilters={getActiveFilters("benefits")}
                    >
                      Benefits
                    </TableHead>
                    <TableHead 
                      className="border border-gray-300 text-right"
                      showFilter={true}
                      filterData={baseSalaryCosts}
                      filterField="socialInsurance"
                      onFilter={setFilter}
                      activeFilters={getActiveFilters("socialInsurance")}
                    >
                      Social Insurance
                    </TableHead>
                    <TableHead 
                      className="border border-gray-300 text-right"
                      showFilter={true}
                      filterData={baseSalaryCosts}
                      filterField="totalCost"
                      onFilter={setFilter}
                      activeFilters={getActiveFilters("totalCost")}
                    >
                      Total Cost
                    </TableHead>
                    <TableHead 
                      className="border border-gray-300 text-center"
                      showFilter={true}
                      filterData={baseSalaryCosts}
                      filterField="checked"
                      onFilter={setFilter}
                      activeFilters={getActiveFilters("checked")}
                    >
                      Checked
                    </TableHead>
                    <TableHead 
                      className="border border-gray-300"
                      showFilter={true}
                      filterData={baseSalaryCosts}
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
                  {filteredSalaryCosts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={17} className="border border-gray-300 p-8 text-center text-gray-500">
                        {salaryCosts.length === 0 
                          ? "No data available. Click \"Add Row\" to start entering data."
                          : "No data matches the selected filters. Try adjusting the year or month selection."
                        }
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSalaryCosts.map((salaryCost) => (
                      <TableRow key={salaryCost.id} className="hover:bg-gray-50">
                        <TableCell className="border border-gray-300 p-1">
                          <Input
                            value={salaryCost.year.toString()}
                            onChange={(e) => updateSalaryCost(salaryCost.id, 'year', parseInt(e.target.value) || currentYear)}
                            className="border-0 p-1 h-8 text-center"
                            type="number"
                          />
                        </TableCell>
                        <TableCell className="border border-gray-300 p-1">
                          <Select
                            value={salaryCost.month.toString()}
                            onValueChange={(value) => updateSalaryCost(salaryCost.id, 'month', parseInt(value))}
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
                            value={salaryCost.employeeName}
                            onChange={(e) => updateSalaryCost(salaryCost.id, 'employeeName', e.target.value)}
                            className="border-0 p-1 h-8"
                          />
                        </TableCell>
                        <TableCell className="border border-gray-300 p-1">
                          <Select
                            value={salaryCost.position}
                            onValueChange={(value) => updateSalaryCost(salaryCost.id, 'position', value)}
                          >
                            <SelectTrigger className="border-0 p-1 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {POSITIONS.map(position => (
                                <SelectItem key={position} value={position}>{position}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="border border-gray-300 p-1">
                          <Select
                            value={salaryCost.department}
                            onValueChange={(value) => updateSalaryCost(salaryCost.id, 'department', value)}
                          >
                            <SelectTrigger className="border-0 p-1 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {DEPARTMENTS.map(department => (
                                <SelectItem key={department} value={department}>{department}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="border border-gray-300 p-1">
                          <NumberInput
                            value={salaryCost.baseSalary}
                            onChange={(value) => updateSalaryCost(salaryCost.id, 'baseSalary', value)}
                            className="border-0 p-1 h-8"
                          />
                        </TableCell>
                        <TableCell className="border border-gray-300 p-1">
                          <NumberInput
                            value={salaryCost.overtimeHours}
                            onChange={(value) => updateSalaryCost(salaryCost.id, 'overtimeHours', value)}
                            className="border-0 p-1 h-8"
                          />
                        </TableCell>
                        <TableCell className="border border-gray-300 p-1">
                          <NumberInput
                            value={salaryCost.overtimeRate}
                            onChange={(value) => updateSalaryCost(salaryCost.id, 'overtimeRate', value)}
                            className="border-0 p-1 h-8"
                          />
                        </TableCell>
                        <TableCell className="border border-gray-300 p-1">
                          <Input
                            value={formatNumber(salaryCost.overtime)}
                            readOnly
                            className="border-0 p-1 h-8 bg-gray-50 text-right"
                          />
                        </TableCell>
                        <TableCell className="border border-gray-300 p-1">
                          <NumberInput
                            value={salaryCost.bonus}
                            onChange={(value) => updateSalaryCost(salaryCost.id, 'bonus', value)}
                            className="border-0 p-1 h-8"
                          />
                        </TableCell>
                        <TableCell className="border border-gray-300 p-1">
                          <Input
                            value={formatNumber(salaryCost.totalSalary)}
                            readOnly
                            className="border-0 p-1 h-8 bg-gray-50 text-right"
                          />
                        </TableCell>
                        <TableCell className="border border-gray-300 p-1">
                          <NumberInput
                            value={salaryCost.benefits}
                            onChange={(value) => updateSalaryCost(salaryCost.id, 'benefits', value)}
                            className="border-0 p-1 h-8"
                          />
                        </TableCell>
                        <TableCell className="border border-gray-300 p-1">
                          <NumberInput
                            value={salaryCost.socialInsurance}
                            onChange={(value) => updateSalaryCost(salaryCost.id, 'socialInsurance', value)}
                            className="border-0 p-1 h-8"
                          />
                        </TableCell>
                        <TableCell className="border border-gray-300 p-1">
                          <Input
                            value={formatNumber(salaryCost.totalCost)}
                            readOnly
                            className="border-0 p-1 h-8 bg-gray-50 text-right"
                          />
                        </TableCell>
                        <TableCell className="border border-gray-300 p-2 text-center">
                          <Checkbox
                            checked={salaryCost.checked}
                            onCheckedChange={(checked) => updateSalaryCost(salaryCost.id, 'checked', checked)}
                          />
                        </TableCell>
                        <TableCell className="border border-gray-300 p-1">
                          <Input
                            value={salaryCost.notes}
                            onChange={(e) => updateSalaryCost(salaryCost.id, 'notes', e.target.value)}
                            className="border-0 p-1 h-8"
                          />
                        </TableCell>
                        <TableCell className="border border-gray-300 p-1">
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDialog(salaryCost, 'view')}
                              className="h-6 w-6 p-0"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDialog(salaryCost, 'edit')}
                              className="h-6 w-6 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteSalaryCost(salaryCost.id)}
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
              {dialogMode === 'view' ? 'View Salary Cost' : 'Edit Salary Cost'}
            </DialogTitle>
          </DialogHeader>
          {selectedSalaryCost && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Year</label>
                  <div className="p-2 bg-gray-50 rounded">{selectedSalaryCost.year}</div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Month</label>
                  <div className="p-2 bg-gray-50 rounded">{getMonthName(selectedSalaryCost.month)}</div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Employee Name</label>
                {dialogMode === 'view' ? (
                  <div className="p-2 bg-gray-50 rounded">{selectedSalaryCost.employeeName}</div>
                ) : (
                  <Input
                    value={selectedSalaryCost.employeeName}
                    onChange={(e) => setSelectedSalaryCost({...selectedSalaryCost, employeeName: e.target.value})}
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Position</label>
                  {dialogMode === 'view' ? (
                    <div className="p-2 bg-gray-50 rounded">{selectedSalaryCost.position}</div>
                  ) : (
                    <Select
                      value={selectedSalaryCost.position}
                      onValueChange={(value) => setSelectedSalaryCost({...selectedSalaryCost, position: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {POSITIONS.map(position => (
                          <SelectItem key={position} value={position}>{position}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Department</label>
                  {dialogMode === 'view' ? (
                    <div className="p-2 bg-gray-50 rounded">{selectedSalaryCost.department}</div>
                  ) : (
                    <Select
                      value={selectedSalaryCost.department}
                      onValueChange={(value) => setSelectedSalaryCost({...selectedSalaryCost, department: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map(department => (
                          <SelectItem key={department} value={department}>{department}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Base Salary</label>
                {dialogMode === 'view' ? (
                  <div className="p-2 bg-gray-50 rounded text-right">{formatNumber(selectedSalaryCost.baseSalary)}</div>
                ) : (
                  <NumberInput
                    value={selectedSalaryCost.baseSalary}
                    onChange={(value) => setSelectedSalaryCost({...selectedSalaryCost, baseSalary: value})}
                  />
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">OT Hours</label>
                  {dialogMode === 'view' ? (
                    <div className="p-2 bg-gray-50 rounded text-right">{formatNumber(selectedSalaryCost.overtimeHours)}</div>
                  ) : (
                    <NumberInput
                      value={selectedSalaryCost.overtimeHours}
                      onChange={(value) => setSelectedSalaryCost({...selectedSalaryCost, overtimeHours: value})}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">OT Rate</label>
                  {dialogMode === 'view' ? (
                    <div className="p-2 bg-gray-50 rounded text-right">{formatNumber(selectedSalaryCost.overtimeRate)}</div>
                  ) : (
                    <NumberInput
                      value={selectedSalaryCost.overtimeRate}
                      onChange={(value) => setSelectedSalaryCost({...selectedSalaryCost, overtimeRate: value})}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Overtime</label>
                  <div className="p-2 bg-gray-50 rounded text-right">{formatNumber(selectedSalaryCost.overtimeHours * selectedSalaryCost.overtimeRate)}</div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Bonus</label>
                {dialogMode === 'view' ? (
                  <div className="p-2 bg-gray-50 rounded text-right">{formatNumber(selectedSalaryCost.bonus)}</div>
                ) : (
                  <NumberInput
                    value={selectedSalaryCost.bonus}
                    onChange={(value) => setSelectedSalaryCost({...selectedSalaryCost, bonus: value})}
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Total Salary</label>
                <div className="p-2 bg-gray-50 rounded text-right">{formatNumber(selectedSalaryCost.baseSalary + (selectedSalaryCost.overtimeHours * selectedSalaryCost.overtimeRate) + selectedSalaryCost.bonus)}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Benefits</label>
                  {dialogMode === 'view' ? (
                    <div className="p-2 bg-gray-50 rounded text-right">{formatNumber(selectedSalaryCost.benefits)}</div>
                  ) : (
                    <NumberInput
                      value={selectedSalaryCost.benefits}
                      onChange={(value) => setSelectedSalaryCost({...selectedSalaryCost, benefits: value})}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Social Insurance</label>
                  {dialogMode === 'view' ? (
                    <div className="p-2 bg-gray-50 rounded text-right">{formatNumber(selectedSalaryCost.socialInsurance)}</div>
                  ) : (
                    <NumberInput
                      value={selectedSalaryCost.socialInsurance}
                      onChange={(value) => setSelectedSalaryCost({...selectedSalaryCost, socialInsurance: value})}
                    />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Total Cost</label>
                <div className="p-2 bg-gray-50 rounded text-right">{formatNumber(selectedSalaryCost.baseSalary + (selectedSalaryCost.overtimeHours * selectedSalaryCost.overtimeRate) + selectedSalaryCost.bonus + selectedSalaryCost.benefits + selectedSalaryCost.socialInsurance)}</div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Checked</label>
                {dialogMode === 'view' ? (
                  <div className="p-2 bg-gray-50 rounded">{selectedSalaryCost.checked ? 'Yes' : 'No'}</div>
                ) : (
                  <div className="flex items-center space-x-2 p-2">
                    <Checkbox
                      checked={selectedSalaryCost.checked}
                      onCheckedChange={(checked) => setSelectedSalaryCost({...selectedSalaryCost, checked: Boolean(checked)})}
                    />
                    <span className="text-sm">{selectedSalaryCost.checked ? 'Yes' : 'No'}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                {dialogMode === 'view' ? (
                  <div className="p-2 bg-gray-50 rounded min-h-[60px]">{selectedSalaryCost.notes}</div>
                ) : (
                  <Input
                    value={selectedSalaryCost.notes}
                    onChange={(e) => setSelectedSalaryCost({...selectedSalaryCost, notes: e.target.value})}
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
            <AlertDialogCancel onClick={() => setSalaryCostToDelete(null)}>Cancel</AlertDialogCancel>
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
