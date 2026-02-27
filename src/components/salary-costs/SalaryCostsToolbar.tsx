import React, { memo } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MONTHS } from "@/hooks/useSalaryCosts";

interface SalaryCostsToolbarProps {
  selectedYear: string;
  handleYearChange: (value: string) => void;
  availableYears: number[];
  selectedMonths: number[];
  handleMonthToggle: (monthValue: number) => void;
  setSelectedMonths: (months: number[]) => void;
}

const SalaryCostsToolbar = memo(({
  selectedYear,
  handleYearChange,
  availableYears,
  selectedMonths,
  handleMonthToggle,
  setSelectedMonths,
}: SalaryCostsToolbarProps) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="flex justify-between items-start gap-4">
        <div className="flex items-center gap-8 flex-grow">
          <div>
            <Select value={selectedYear} onValueChange={handleYearChange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Year" />
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
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedMonths([1,2,3,4,5,6,7,8,9,10,11,12])}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSelectedMonths([])}>
              Clear All
            </Button>
          </div>
          <div className="flex-1">
            <div className="grid grid-cols-6 md:grid-cols-12 gap-x-6 gap-y-2">
              {MONTHS.map(({ id, name }) => (
                <div key={id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`month-toolbar-${id}`}
                    checked={selectedMonths.includes(id)}
                    onCheckedChange={() => handleMonthToggle(id)}
                  />
                  <label
                    htmlFor={`month-toolbar-${id}`}
                    className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {name}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

SalaryCostsToolbar.displayName = "SalaryCostsToolbar";

export { SalaryCostsToolbar };