
import React from "react";

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
        {/* Months checkboxes, two rows */}
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
      {/* Rate inputs - Hidden as requested */}
      {/* <div className="flex flex-wrap gap-6 items-center mt-2">
        <div className="flex items-center space-x-2">
          <span className="text-base font-semibold">Income Tax Rate:</span>
          <input
            type="number"
            value={incomeTaxRate}
            onChange={e => setIncomeTaxRate(Number(e.target.value))}
            min={0}
            max={100}
            className="border border-gray-300 rounded px-3 py-1 w-20 text-right text-base"
          />
          <span className="font-semibold text-base">%</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-base font-semibold">Bonus Rate:</span>
          <input
            type="number"
            value={bonusRate}
            onChange={e => setBonusRate(Number(e.target.value))}
            min={0}
            max={100}
            className="border border-gray-300 rounded px-3 py-1 w-20 text-right text-base"
          />
          <span className="font-semibold text-base">%</span>
        </div>
      </div> */}
    </div>
  </div>
);
