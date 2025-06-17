
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface ReportFilterProps {
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  selectedMonths: number[];
  setSelectedMonths: (months: number[]) => void;
  months: { value: number; label: string; short: string }[];
  years: number[];
  onExport: () => void;
  bonusRate?: number;
  setBonusRate?: (rate: number) => void;
}

export function ReportFilter({
  selectedYear,
  setSelectedYear,
  selectedMonths,
  setSelectedMonths,
  months,
  years,
  onExport,
}: ReportFilterProps) {
  const handleMonthChange = (value: number) => {
    setSelectedMonths(
      selectedMonths.includes(value)
        ? selectedMonths.filter(m => m !== value)
        : [...selectedMonths, value].sort((a, b) => a - b)
    );
  };

  return (
    <div className="p-4 bg-white rounded-md border">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Year select */}
        <div>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-24 text-base"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* Months checkboxes */}
        <div className="flex flex-wrap gap-x-8 gap-y-2">
          {months.map((m, idx) => (
            <label key={m.value} className="inline-flex items-center space-x-2 cursor-pointer">
              <Checkbox
                checked={selectedMonths.includes(m.value)}
                onCheckedChange={() => handleMonthChange(m.value)}
                id={`month-check-${m.value}`}
              />
              <span className="font-semibold text-base">{m.short}</span>
            </label>
          ))}
        </div>

        {/* Export button */}
        <Button variant="outline" onClick={onExport}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>
    </div>
  );
}
