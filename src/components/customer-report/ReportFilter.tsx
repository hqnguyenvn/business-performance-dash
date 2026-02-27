
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  title = "Filter Report Data",
}: ReportFilterProps) {
  const handleMonthChange = (value: number) => {
    setSelectedMonths(
      selectedMonths.includes(value)
        ? selectedMonths.filter(m => m !== value)
        : [...selectedMonths, value].sort((a, b) => a - b)
    );
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Year:</label>
              <Select
                value={selectedYear}
                onValueChange={setSelectedYear}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Months:</label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedMonths([1,2,3,4,5,6,7,8,9,10,11,12])}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedMonths([])}>
                  Clear All
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-start gap-3 flex-1">
              {months.map((m) => (
                <div key={m.value} className="flex items-center space-x-1">
                  <Checkbox
                    checked={selectedMonths.includes(m.value)}
                    onCheckedChange={() => handleMonthChange(m.value)}
                    id={`month-check-${m.value}`}
                  />
                  <label
                    htmlFor={`month-check-${m.value}`}
                    className="text-sm cursor-pointer whitespace-nowrap"
                  >
                    {m.short}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
