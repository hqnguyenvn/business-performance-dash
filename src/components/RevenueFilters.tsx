
import React from "react";
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
    { value: 1, label: "Jan" }, { value: 2, label: "Feb" }, { value: 3, label: "Mar" },
    { value: 4, label: "Apr" }, { value: 5, label: "May" }, { value: 6, label: "Jun" },
    { value: 7, label: "Jul" }, { value: 8, label: "Aug" }, { value: 9, label: "Sep" },
    { value: 10, label: "Oct" }, { value: 11, label: "Nov" }, { value: 12, label: "Dec" },
  ];

  const handleMonthToggle = (monthValue: number, checked: boolean) => {
    if (checked) onMonthChange([...selectedMonths, monthValue]);
    else onMonthChange(selectedMonths.filter(m => m !== monthValue));
  };

  return (
    <div className="flex items-center gap-4 flex-wrap py-2 px-3 border rounded-md bg-white mb-3">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-muted-foreground">Year</label>
        <Select
          value={selectedYear.toString()}
          onValueChange={(value) => onYearChange(parseInt(value))}
        >
          <SelectTrigger className="w-24 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="h-5 w-px bg-border" />

      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-sm font-medium text-muted-foreground">Months</label>
        {months.map((month) => (
          <label
            key={month.value}
            htmlFor={`month-${month.value}`}
            className="flex items-center gap-1.5 cursor-pointer"
          >
            <Checkbox
              id={`month-${month.value}`}
              checked={selectedMonths.includes(month.value)}
              onCheckedChange={(checked) => handleMonthToggle(month.value, Boolean(checked))}
            />
            <span className="text-sm">{month.label}</span>
          </label>
        ))}
        <div className="flex gap-1 ml-1">
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onMonthChange(months.map(m => m.value))}>
            All
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onMonthChange([])}>
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RevenueFilters;
