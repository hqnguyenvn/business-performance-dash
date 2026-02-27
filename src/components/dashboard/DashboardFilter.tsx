
import React from "react";
import { Button } from "@/components/ui/button";

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
  <div className="rounded-xl border bg-white p-6">
    <div className="text-2xl font-bold mb-4">Data Filter</div>
    <div className="flex flex-col gap-4">
      {/* Year and Month selectors */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        {/* Year dropdown */}
        <div>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="border border-gray-300 rounded px-3 py-2 w-24 text-base"
          >
            {years.map(year => (
              <option value={year} key={year}>{year}</option>
            ))}
          </select>
        </div>
        {/* Select All / Clear All */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setSelectedMonths([1,2,3,4,5,6,7,8,9,10,11,12])}>
            Select All
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSelectedMonths([])}>
            Clear All
          </Button>
        </div>
        {/* Months checkboxes */}
        <div className="flex flex-wrap gap-x-8 gap-y-2 ml-0 md:ml-4">
          <div className="flex flex-wrap">
            {months.slice(0, 6).map(m => (
              <label key={m.value} className="inline-flex items-center space-x-2 cursor-pointer font-medium mr-5 mb-2">
                <input
                  type="checkbox"
                  checked={selectedMonths.includes(m.value)}
                  onChange={() => onMonthToggle(m.value)}
                  className="form-checkbox h-5 w-5 text-blue-900 border-gray-400 focus:ring-blue-900"
                />
                <span className="text-base">{m.label}</span>
              </label>
            ))}
          </div>
          <div className="flex flex-wrap">
            {months.slice(6, 12).map(m => (
              <label key={m.value} className="inline-flex items-center space-x-2 cursor-pointer font-medium mr-5 mb-2">
                <input
                  type="checkbox"
                  checked={selectedMonths.includes(m.value)}
                  onChange={() => onMonthToggle(m.value)}
                  className="form-checkbox h-5 w-5 text-blue-900 border-gray-400 focus:ring-blue-900"
                />
                <span className="text-base">{m.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);
