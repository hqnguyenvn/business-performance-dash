
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RevenueFiltersProps {
  selectedYear: number;
  selectedMonths: number[];
  onYearChange: (year: number) => void;
  onMonthChange: (months: number[]) => void;
}

const RevenueFilters: React.FC<RevenueFiltersProps> = ({
  selectedYear,
  selectedMonths,
  onYearChange,
  onMonthChange,
}) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
  
  const months = [
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

  const handleMonthToggle = (monthValue: number, checked: boolean) => {
    if (checked) {
      onMonthChange([...selectedMonths, monthValue]);
    } else {
      onMonthChange(selectedMonths.filter(m => m !== monthValue));
    }
  };

  const handleSelectAll = () => {
    onMonthChange(months.map(m => m.value));
  };

  const handleClearAll = () => {
    onMonthChange([]);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Filter Revenue Records</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Year:</label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => onYearChange(parseInt(value))}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Months:</label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                >
                  Clear All
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-start gap-3 flex-1">
              {months.map((month) => (
                <div key={month.value} className="flex items-center space-x-1">
                  <Checkbox
                    id={`month-${month.value}`}
                    checked={selectedMonths.includes(month.value)}
                    onCheckedChange={(checked) => 
                      handleMonthToggle(month.value, Boolean(checked))
                    }
                  />
                  <label 
                    htmlFor={`month-${month.value}`} 
                    className="text-sm cursor-pointer whitespace-nowrap"
                  >
                    {month.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueFilters;
