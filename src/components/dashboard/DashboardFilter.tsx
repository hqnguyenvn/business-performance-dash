
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NumberInput } from "@/components/ui/number-input";

interface MonthOption {
  value: number;
  label: string;
}

interface DashboardFilterProps {
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  years: number[];
  months: MonthOption[];
  selectedMonths: number[];
  setSelectedMonths: (months: number[]) => void;
  onMonthToggle: (month: number) => void;
  incomeTaxRate: number;
  setIncomeTaxRate: (n: number) => void;
  bonusRate: number;
  setBonusRate: (n: number) => void;
}

export const DashboardFilter: React.FC<DashboardFilterProps> = ({
  selectedYear,
  setSelectedYear,
  years,
  months,
  selectedMonths,
  setSelectedMonths,
  onMonthToggle,
  incomeTaxRate,
  setIncomeTaxRate,
  bonusRate,
  setBonusRate,
}) => (
  <Card className="mb-6">
    <CardHeader>
      <CardTitle>Filter Dashboard Data</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Year:</label>
            <Select
              value={selectedYear.toString()}
              onValueChange={(val) => setSelectedYear(Number(val))}
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
                  id={`dash-month-${m.value}`}
                  checked={selectedMonths.includes(m.value)}
                  onCheckedChange={() => onMonthToggle(m.value)}
                />
                <label
                  htmlFor={`dash-month-${m.value}`}
                  className="text-sm cursor-pointer whitespace-nowrap"
                >
                  {m.label}
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
                onChange={setIncomeTaxRate}
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
                onChange={setBonusRate}
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
