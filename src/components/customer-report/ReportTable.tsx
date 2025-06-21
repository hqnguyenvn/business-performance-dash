import React, { useEffect, useMemo } from "react";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { TableFilter } from "@/components/ui/table-filter";
import { useTableFilter } from "@/hooks/useTableFilter";
import { formatCurrency } from "@/lib/format";

export interface GroupedCustomerData {
  year: number;
  month: number;
  customer_id: string;
  customer_code: string;
  company_id: string;
  company_code: string;
  bmm: number;
  revenue: number;
  salaryCost?: number;
  overheadCost?: number;
  bonusValue?: number; // Thêm field này cho Company Report
}

const MONTH_MAP = {
  1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun",
  7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec"
};

interface ReportTableProps {
  data: GroupedCustomerData[];
  loading: boolean;
  paginatedData: GroupedCustomerData[];
  currentPage: number;
  totalPages: number;
  goToPage: (page: number) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  bonusRate: number;
  companyLabel?: string;
  onFilteredDataChange?: (filteredData: any[]) => void;
  onTotalsChange?: (totals: {
    totalRevenue: number;
    totalBMM: number;
    totalBonus: number;
    totalCost: number;
    totalProfit: number;
    totalProfitPercent: number;
  }) => void;
}

// Hàm lấy dữ liệu filter cho từng trường
function getFilterData(data: GroupedCustomerData[], field: string) {
  const uniqueValues = new Set();
  const filterData: any[] = [];
  data.forEach(item => {
    let value = item[field];
    let displayValue = value;
    if (field === "month") displayValue = MONTH_MAP[value as number] || value;
    if (field === "company_code") displayValue = item.company_code;
    if (field === "customer_code") displayValue = item.customer_code;
    const strValue = String(value ?? "");
    if (!uniqueValues.has(strValue)) {
      uniqueValues.add(strValue);
      filterData.push({
        [field]: strValue,
        displayValue: displayValue || strValue || "(Empty)",
      });
    }
  });
  return filterData;
}

export function ReportTable({
  loading,
  data,
  bonusRate,
  companyLabel,
  onFilteredDataChange,
  onTotalsChange,
}: ReportTableProps) {
  // Sử dụng useTableFilter để filter cột
  const {
    filteredData,
    setFilter,
    getActiveFilters,
    clearAllFilters
  } = useTableFilter(data);

  // Check if this is Company Report (no customer_code field) 
  const isCompanyReport = !data[0]?.customer_code;

  // Calculate totals from filtered data
  const totals = useMemo(() => {
    console.log('💰 ReportTable: Calculating totals from', filteredData.length, 'filtered records');
    
    const revenue = filteredData.reduce((sum, d) => sum + (d.revenue || 0), 0);
    const bmm = filteredData.reduce((sum, d) => sum + (d.bmm || 0), 0);
    const bonus = filteredData.reduce((sum, d) => sum + (d.bonusValue || 0), 0);
    const cost = filteredData.reduce((sum, d) => {
      const salary = d.salaryCost || 0;
      const bonusVal = d.bonusValue || 0;
      const oh = d.overheadCost || 0;
      return sum + salary + bonusVal + oh;
    }, 0);
    const profit = revenue - cost;
    const profitPercent = revenue !== 0 ? (profit / revenue) * 100 : 0;

    console.log('📊 ReportTable: Calculated totals -', {
      records: filteredData.length,
      revenue: Math.round(revenue).toLocaleString(),
      cost: Math.round(cost).toLocaleString(),
      profit: Math.round(profit).toLocaleString()
    });

    return {
      totalRevenue: revenue,
      totalBMM: bmm,
      totalBonus: bonus,
      totalCost: cost,
      totalProfit: profit,
      totalProfitPercent: profitPercent
    };
  }, [filteredData]);

  // Notify parent when filtered data changes
  useEffect(() => {
    console.log('🔄 ReportTable: filteredData changed, length =', filteredData.length);
    if (onFilteredDataChange) {
      onFilteredDataChange(filteredData);
      console.log('📤 ReportTable: Called onFilteredDataChange with', filteredData.length, 'items');
    }
  }, [filteredData, onFilteredDataChange]);

  // Notify parent when totals change
  useEffect(() => {
    console.log('🧮 ReportTable: Totals changed, sending to parent');
    if (onTotalsChange) {
      onTotalsChange(totals);
      console.log('📤 ReportTable: Called onTotalsChange with totals');
    }
  }, [totals, onTotalsChange]);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-green-50">
            <TableHead className="border border-gray-300 p-2 text-center font-medium w-10">
              No.
            </TableHead>
            <TableHead
              className="border border-gray-300 p-2 text-center font-medium"
              showFilter
              filterData={getFilterData(data, "month")}
              filterField="month"
              onFilter={setFilter}
              activeFilters={getActiveFilters("month")}
            >
              Month
            </TableHead>
            <TableHead
              className="border border-gray-300 p-2 text-left font-medium"
              showFilter
              filterData={getFilterData(data, "company_code")}
              filterField="company_code"
              onFilter={setFilter}
              activeFilters={getActiveFilters("company_code")}
            >
              {companyLabel || "Company"}
            </TableHead>
            {!isCompanyReport && (
              <TableHead
                className="border border-gray-300 p-2 text-left font-medium"
                showFilter
                filterData={getFilterData(data, "customer_code")}
                filterField="customer_code"
                onFilter={setFilter}
                activeFilters={getActiveFilters("customer_code")}
              >
                Customer
              </TableHead>
            )}
            <TableHead className="border border-gray-300 p-2 text-right font-medium">BMM</TableHead>
            <TableHead className="border border-gray-300 p-2 text-right font-medium">Revenue</TableHead>
            <TableHead className="border border-gray-300 p-2 text-right font-medium">Salary Cost</TableHead>
            <TableHead className="border border-gray-300 p-2 text-right font-medium">Bonus</TableHead>
            <TableHead className="border border-gray-300 p-2 text-right font-medium">Overhead Cost</TableHead>
            <TableHead className="border border-gray-300 p-2 text-right font-medium">Total Cost</TableHead>
            <TableHead className="border border-gray-300 p-2 text-right font-medium">Profit</TableHead>
            <TableHead className="border border-gray-300 p-2 text-right font-medium">% Profit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={isCompanyReport ? 11 : 12} className="p-8 text-center text-gray-500">Loading...</TableCell>
            </TableRow>
          ) : filteredData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={isCompanyReport ? 11 : 12} className="border border-gray-300 p-8 text-center text-gray-500">
                No data matches the selected filters. Try adjusting the year or month selection.
              </TableCell>
            </TableRow>
          ) : (
            filteredData.map((data, idx) => {
              const salaryCost = data.salaryCost ?? 0;
              const bonusValue = data.bonusValue || 0;
              const overheadCost = data.overheadCost ?? 0;
              const totalCost = salaryCost + bonusValue + overheadCost;
              const revenue = data.revenue ?? 0;
              const profit = revenue - totalCost;
              const percentProfit = revenue !== 0 ? (profit / revenue) * 100 : 0;
              const negativeProfit = profit < 0;
              return (
                <TableRow
                  key={`${data.year}_${data.month}_${data.customer_id ?? ""}_${data.company_id ?? ""}`}
                  className="hover:bg-gray-50"
                >
                  <TableCell className="border border-gray-300 p-2 text-center">{idx + 1}</TableCell>
                  <TableCell className="border border-gray-300 p-2 text-center">{MONTH_MAP[data.month] || data.month}</TableCell>
                  <TableCell className="border border-gray-300 p-2">{data.company_code}</TableCell>
                  {!isCompanyReport && (
                    <TableCell className="border border-gray-300 p-2">{data.customer_code}</TableCell>
                  )}
                  <TableCell className="border border-gray-300 p-2 text-right">
                    {data.bmm.toFixed(1)}
                  </TableCell>
                  <TableCell className="border border-gray-300 p-2 text-right">{Math.round(revenue).toLocaleString()}</TableCell>
                  <TableCell className="border border-gray-300 p-2 text-right">{Math.round(salaryCost).toLocaleString()}</TableCell>
                  <TableCell className="border border-gray-300 p-2 text-right">{Math.round(data.bonusValue || 0).toLocaleString()}</TableCell>
                  <TableCell className="border border-gray-300 p-2 text-right">{Math.round(overheadCost).toLocaleString()}</TableCell>
                  <TableCell className="border border-gray-300 p-2 text-right font-semibold">{Math.round(totalCost).toLocaleString()}</TableCell>
                  <TableCell
                    className={`border border-gray-300 p-2 text-right font-semibold ${negativeProfit ? "bg-yellow-200" : "text-green-700"}`}
                  >
                    {Math.round(profit).toLocaleString()}
                  </TableCell>
                  <TableCell
                    className={`border border-gray-300 p-2 text-right ${negativeProfit ? "bg-yellow-200" : ""}`}
                  >
                    {revenue === 0 ? "-" : `${percentProfit.toFixed(1)}%`}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}