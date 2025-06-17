
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { MONTHS } from "@/hooks/useCosts";

interface CostsFilterProps {
  selectedYear: string;
  handleYearChange: (value: string) => void;
  availableYears: number[];
  selectedMonths: number[];
  handleMonthToggle: (monthValue: number) => void;
}

export const CostsFilter = ({
  selectedYear,
  handleYearChange,
  availableYears,
  selectedMonths,
  handleMonthToggle,
}: CostsFilterProps) => {
  return (
    <Card className="bg-white mb-6">
      <CardHeader>
        <CardTitle>Data Filter</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-start gap-8">
            <div className="flex items-center gap-4">
              <Select value={selectedYear} onValueChange={handleYearChange}>
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
                {MONTHS.map((month) => (
                  <div key={month.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`month-${month.value}`}
                      checked={selectedMonths.includes(month.value)}
                      onCheckedChange={() => handleMonthToggle(month.value)}
                    />
                    <label
                      htmlFor={`month-${month.value}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {month.label.substring(0, 3)}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
