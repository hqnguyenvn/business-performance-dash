import React, { useEffect, useMemo, useState } from "react";
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
  // Local state for filter term
  const [filterTerm, setFilterTerm] = useState('');

  // Apply filter with detailed debugging
  const filteredData = useMemo(() => {
    console.log('🔍 Filter processing:');
    console.log('  Filter term:', `"${filterTerm}"`);
    console.log('  Original data length:', data.length);

    if (!filterTerm.trim()) {
      console.log('  ✅ No filter term - returning all data');
      return data;
    }

    const term = filterTerm.toLowerCase().trim();
    console.log('  🔍 Normalized filter term:', `"${term}"`);

    const filtered = data.filter(item => {
      const companyCode = (item.company_code || '').toLowerCase();
      const matches = companyCode.includes(term);

      if (matches) {
        console.log(`    ✅ Match: "${item.company_code}" contains "${term}"`);
      }

      return matches;
    });

    console.log('  📊 Filtered data length:', filtered.length);
    console.log('  🎯 Matching companies:', filtered.map(item => item.company_code).join(', '));

    return filtered;
  }, [data, filterTerm]);

  // Check if this is Company Report (no customer_code field) 
  const isCompanyReport = !data[0]?.customer_code;

  // Calculate totals from filteredData only
  const totals = useMemo(() => {
    console.log('');
    console.log('🧮 ReportTable: Calculating totals...');
    console.log('📊 Original data length:', data.length);
    console.log('🔍 Filtered data length:', filteredData.length);
    console.log('🔍 Filter term:', filterTerm);

    // Debug: Show first few items of original data vs filtered data
    console.log('📋 First 3 original data items:');
    data.slice(0, 3).forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.company_code || 'N/A'} - Revenue: ${Math.round(item.revenue || 0).toLocaleString()}`);
    });

    console.log('📋 First 3 filtered data items:');
    filteredData.slice(0, 3).forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.company_code || 'N/A'} - Revenue: ${Math.round(item.revenue || 0).toLocaleString()}`);
    });

    // Calculate totals ONLY from filteredData
    const totalRevenue = filteredData.reduce((sum, item) => sum + (item.revenue || 0), 0);
    const totalBMM = filteredData.reduce((sum, item) => sum + (item.bmm || 0), 0);
    const totalBonus = filteredData.reduce((sum, item) => sum + (item.bonusValue || 0), 0);
    const totalCost = filteredData.reduce((sum, item) => sum + (item.salaryCost || 0) + (item.overheadCost || 0), 0);
    const totalProfit = totalRevenue - totalCost;
    const totalProfitPercent = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    const calculatedTotals = {
      totalRevenue,
      totalBMM,
      totalBonus,
      totalCost,
      totalProfit,
      totalProfitPercent
    };

    console.log('💰 Calculated totals from filtered data:', calculatedTotals);
    console.log(`💵 Total Revenue: ${Math.round(totalRevenue).toLocaleString()} VND`);
    console.log(`📦 Total BMM: ${totalBMM}`);
    console.log(`🎁 Total Bonus: ${Math.round(totalBonus).toLocaleString()} VND`);
    console.log(`💸 Total Cost: ${Math.round(totalCost).toLocaleString()} VND`);
    console.log(`💰 Total Profit: ${Math.round(totalProfit).toLocaleString()} VND`);
    console.log('');

    return calculatedTotals;
  }, [filteredData, filterTerm, data.length]);

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

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    console.log('🔍 Filter input changed:', `"${newValue}"`);
    setFilterTerm(newValue);
  };

  return (
    <div className="overflow-x-auto">
       <div>
          <label htmlFor="filter">Filter by Company Code:</label>
          <input
            type="text"
            id="filter"
            value={filterTerm}
            onChange={handleFilterChange}
            placeholder="Enter company code"
          />
        </div>
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
              onFilter={() => {}} // Removed setFilter as local filtering is used
              activeFilters={{}} // Removed activeFilters as local filtering is used
            >
              Month
            </TableHead>
            <TableHead
              className="border border-gray-300 p-2 text-left font-medium"
            >
              {companyLabel || "Company"}
            </TableHead>
            {!isCompanyReport && (
              <TableHead
                className="border border-gray-300 p-2 text-left font-medium"
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