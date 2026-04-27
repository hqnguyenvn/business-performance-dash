import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MONTHS as MONTHS_FULL } from "@/lib/months";

interface CostsToolbarProps {
  selectedYear: string;
  handleYearChange: (value: string) => void;
  availableYears: number[];
  selectedMonths: number[];
  handleMonthToggle: (monthValue: number) => void;
  setSelectedMonths: (months: number[]) => void;
}

export const CostsToolbar = ({
  selectedYear,
  handleYearChange,
  availableYears,
  selectedMonths,
  handleMonthToggle,
  setSelectedMonths,
}: CostsToolbarProps) => {
  const MONTHS = MONTHS_FULL.map((m) => ({ value: m.value, label: m.short }));

  return (
    <div className="flex items-center gap-4 flex-wrap py-2 px-3 border rounded-md bg-white mb-4">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-muted-foreground">Year</label>
        <Select value={selectedYear} onValueChange={handleYearChange}>
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
        {MONTHS.map(({ value, label }) => (
          <label
            key={value}
            htmlFor={`cost-month-${value}`}
            className="flex items-center gap-1.5 cursor-pointer"
          >
            <Checkbox
              id={`cost-month-${value}`}
              checked={selectedMonths.includes(value)}
              onCheckedChange={() => handleMonthToggle(value)}
            />
            <span className="text-sm">{label}</span>
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
};
