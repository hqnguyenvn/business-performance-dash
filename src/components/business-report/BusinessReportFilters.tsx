
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { NumberInput } from "@/components/ui/number-input";

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
  incomeTaxRate: number;
  onIncomeTaxRateChange: (value: number) => void;
  bonusRate: number;
  onBonusRateChange: (value: number) => void;
  months: Month[];
}

export const BusinessReportFilters = ({
  selectedYear,
  availableYears,
  onYearChange,
  selectedMonths,
  onMonthToggle,
  incomeTaxRate,
  onIncomeTaxRateChange,
  bonusRate,
  onBonusRateChange,
  months
}: BusinessReportFiltersProps) => {
  return (
    <Card className="bg-white mb-6">
      <CardHeader>
        <CardTitle>Data Filter</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-start gap-8">
            <div className="flex items-center gap-4">
              <Select value={selectedYear} onValueChange={onYearChange}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <div className="grid grid-cols-6 gap-2">
                {months.map((month) => (
                  <div key={month.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`month-${month.value}`}
                      checked={selectedMonths.includes(month.value)}
                      onCheckedChange={() => onMonthToggle(month.value)}
                    />
                    <label
                      htmlFor={`month-${month.value}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {month.short}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Income Tax Rate:</label>
              <div className="flex items-center gap-2">
                <NumberInput
                  value={incomeTaxRate}
                  onChange={onIncomeTaxRateChange}
                  className="w-20"
                  placeholder="Tax"
                />
                <span className="text-sm">%</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Bonus Rate:</label>
              <div className="flex items-center gap-2">
                <NumberInput
                  value={bonusRate}
                  onChange={onBonusRateChange}
                  className="w-20"
                  placeholder="Bonus"
                />
                <span className="text-sm">%</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

