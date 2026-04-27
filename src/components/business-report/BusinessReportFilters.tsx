import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Month {
  value: number;
  label: string;
  short: string;
}

interface BusinessReportFiltersProps {
  selectedYear: string;
  availableYears: number[];
  onYearChange: (value: string) => void;
  selectedMonths: number[];
  onMonthToggle: (month: number) => void;
  setSelectedMonths: (months: number[]) => void;
  months: Month[];
}

export const BusinessReportFilters = ({
  selectedYear,
  availableYears,
  onYearChange,
  selectedMonths,
  onMonthToggle,
  setSelectedMonths,
  months,
}: BusinessReportFiltersProps) => (
  <div className="flex items-center gap-4 flex-wrap py-2 px-3 border rounded-md bg-white mb-4">
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-muted-foreground">Year</label>
      <Select value={selectedYear} onValueChange={onYearChange}>
        <SelectTrigger className="w-24 h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {availableYears.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
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
          htmlFor={`biz-month-${m.value}`}
          className="flex items-center gap-1.5 cursor-pointer"
        >
          <Checkbox
            id={`biz-month-${m.value}`}
            checked={selectedMonths.includes(m.value)}
            onCheckedChange={() => onMonthToggle(m.value)}
          />
          <span className="text-sm">{m.short}</span>
        </label>
      ))}
      <div className="flex gap-1 ml-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => setSelectedMonths([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])}
        >
          All
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => setSelectedMonths([])}
        >
          Clear
        </Button>
      </div>
    </div>
  </div>
);
