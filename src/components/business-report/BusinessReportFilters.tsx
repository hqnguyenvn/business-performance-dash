
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { NumberInput } from "@/components/ui/number-input";
import { Button } from "@/components/ui/button";

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
  setSelectedMonths,
  incomeTaxRate,
  onIncomeTaxRateChange,
  bonusRate,
  onBonusRateChange,
  months
}: BusinessReportFiltersProps) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Filter Business Report</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Year:</label>
              <Select value={selectedYear} onValueChange={onYearChange}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map(year => (
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
              {months.map((month) => (
                <div key={month.value} className="flex items-center space-x-1">
                  <Checkbox
                    id={`biz-month-${month.value}`}
                    checked={selectedMonths.includes(month.value)}
                    onCheckedChange={() => onMonthToggle(month.value)}
                  />
                  <label
                    htmlFor={`biz-month-${month.value}`}
                    className="text-sm cursor-pointer whitespace-nowrap"
                  >
                    {month.short}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6 flex-wrap">
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
