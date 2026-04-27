import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ReportFilterProps {
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  selectedMonths: number[];
  setSelectedMonths: (months: number[]) => void;
  months: { value: number; label: string; short: string }[];
  years: number[];
  onExport?: () => void;
  bonusRate?: number;
  setBonusRate?: (rate: number) => void;
  title?: string;
}

export function ReportFilter({
  selectedYear,
  setSelectedYear,
  selectedMonths,
  setSelectedMonths,
  months,
  years,
}: ReportFilterProps) {
  const handleMonthChange = (value: number) => {
    setSelectedMonths(
      selectedMonths.includes(value)
        ? selectedMonths.filter((m) => m !== value)
        : [...selectedMonths, value].sort((a, b) => a - b),
    );
  };

  return (
    <div className="flex items-center gap-4 flex-wrap py-2 px-3 border rounded-md bg-white mb-4">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-muted-foreground">Year</label>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-24 h-8">
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

      <div className="h-5 w-px bg-border" />

      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-sm font-medium text-muted-foreground">Months</label>
        {months.map((m) => (
          <label
            key={m.value}
            htmlFor={`report-month-${m.value}`}
            className="flex items-center gap-1.5 cursor-pointer"
          >
            <Checkbox
              id={`report-month-${m.value}`}
              checked={selectedMonths.includes(m.value)}
              onCheckedChange={() => handleMonthChange(m.value)}
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
}
