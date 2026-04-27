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

interface MonthOption {
  value: number;
  label: string;
}

interface DashboardFilterProps {
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  years: number[];
  months: MonthOption[];
  selectedMonths: number[];
  setSelectedMonths: (months: number[]) => void;
  onMonthToggle: (month: number) => void;
}

export const DashboardFilter: React.FC<DashboardFilterProps> = ({
  selectedYear,
  setSelectedYear,
  years,
  months,
  selectedMonths,
  setSelectedMonths,
  onMonthToggle,
}) => (
  <div className="flex items-center gap-4 flex-wrap py-2 px-3 border rounded-md bg-white mb-4">
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-muted-foreground">Year</label>
      <Select
        value={selectedYear.toString()}
        onValueChange={(val) => setSelectedYear(Number(val))}
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
      {months.map((m) => (
        <label
          key={m.value}
          htmlFor={`dash-month-${m.value}`}
          className="flex items-center gap-1.5 cursor-pointer"
        >
          <Checkbox
            id={`dash-month-${m.value}`}
            checked={selectedMonths.includes(m.value)}
            onCheckedChange={() => onMonthToggle(m.value)}
          />
          <span className="text-sm">{m.label}</span>
        </label>
      ))}
      <div className="flex gap-1 ml-1">
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setSelectedMonths([1,2,3,4,5,6,7,8,9,10,11,12])}>
          All
        </Button>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setSelectedMonths([])}>
          Clear
        </Button>
      </div>
    </div>
  </div>
);
