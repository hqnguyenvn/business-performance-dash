
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
  bonusRate: number;
  setBonusRate: (rate: number) => void;
}

export function ReportFilter({
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  months,
  years,
  onExport,
  bonusRate,
  setBonusRate,
}: ReportFilterProps) {
  return (
    <div className="flex gap-4 items-center flex-wrap">
      <div className="flex items-center gap-1">
        <span className="text-sm mr-1">Bonus %</span>
        <input
          type="number"
          className="border border-gray-300 rounded px-2 py-1 w-16 text-right"
          value={bonusRate}
          min={0}
          max={100}
          step={0.1}
          onChange={e => setBonusRate(Number(e.target.value))}
        />
      </div>
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
