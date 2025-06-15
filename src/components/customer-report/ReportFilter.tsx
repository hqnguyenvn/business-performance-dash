
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ReportFilterProps {
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  months: string[];
  years: number[];
  onExport: () => void;
}

export function ReportFilter({
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  months,
  years,
  onExport,
}: ReportFilterProps) {
  return (
    <div className="flex gap-4 items-center flex-wrap">
      <Select value={selectedYear} onValueChange={setSelectedYear}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          {years.map(year => (
            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={selectedMonth} onValueChange={setSelectedMonth}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          {months.map(month => (
            <SelectItem key={month} value={month}>{month}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="outline" onClick={onExport}>
        <Download className="h-4 w-4 mr-2" />
        Export CSV
      </Button>
    </div>
  );
}
