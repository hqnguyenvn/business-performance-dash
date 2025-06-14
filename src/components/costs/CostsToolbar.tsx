
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CostsToolbarProps {
  selectedYear: string;
  handleYearChange: (value: string) => void;
  availableYears: number[];
  selectedMonths: number[];
  handleMonthToggle: (monthValue: number) => void;
  actions?: React.ReactNode;
}

export const CostsToolbar = ({
  selectedYear,
  handleYearChange,
  availableYears,
  selectedMonths,
  handleMonthToggle,
  actions,
}: CostsToolbarProps) => {
  const MONTHS = [
    { value: 1, label: "Jan" }, { value: 2, label: "Feb" }, { value: 3, label: "Mar" },
    { value: 4, label: "Apr" }, { value: 5, label: "May" }, { value: 6, label: "Jun" },
    { value: 7, label: "Jul" }, { value: 8, label: "Aug" }, { value: 9, label: "Sep" },
    { value: 10, label: "Oct" }, { value: 11, label: "Nov" }, { value: 12, label: "Dec" }
  ];

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="flex justify-between items-start gap-4">
        <div className="flex items-start gap-8 flex-grow">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Year</label>
            <Select value={selectedYear} onValueChange={handleYearChange}>
              <SelectTrigger className="w-40">
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
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 block mb-1">Months</label>
            <div className="grid grid-cols-6 md:grid-cols-12 gap-x-6 gap-y-2">
              {MONTHS.map(({ value, label }) => (
                <div key={value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`month-toolbar-${value}`}
                    checked={selectedMonths.includes(value)}
                    onCheckedChange={() => handleMonthToggle(value)}
                  />
                  <label
                    htmlFor={`month-toolbar-${value}`}
                    className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
        {actions && <div className="flex-shrink-0">{actions}</div>}
      </div>
    </div>
  );
};
