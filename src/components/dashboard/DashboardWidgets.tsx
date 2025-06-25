
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useMonthlyRevenueStats } from "@/hooks/useMonthlyRevenueStats";
import { useTopCustomers } from "@/hooks/useTopCustomers";
import { useState } from "react";
import { formatNumber } from "@/lib/format";

// Lấy context filter từ trang Index
// -> Truyền props: selectedYear, selectedMonths từ Index xuống DashboardWidgets
// Sửa DashboardWidgets nhận props để lấy filter (thay vì hardcode)

interface DashboardWidgetsProps {
  selectedYear: number;
  selectedMonths: number[];
}

export const DashboardWidgets: React.FC<DashboardWidgetsProps> = ({
  selectedYear,
  selectedMonths,
}) => {
  const { data, loading } = useMonthlyRevenueStats(selectedYear, selectedMonths);

  // Định nghĩa tên tháng cho trục hoành
  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const chartData = data.map(d => ({
    name: monthLabels[d.month - 1],
    totalRevenue: Math.round(d.totalRevenue / 1_000_000), // hiển thị triệu VND
  }));

  // Fetch top customers
  const {
    data: topCustomers,
    loading: loadingTopCustomers,
  } = useTopCustomers(selectedYear, selectedMonths, 5);

  return (
    <div className="grid grid-cols-10 gap-6">
      <Card className="bg-white col-span-7">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Monthly Revenue (Million VND)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center text-gray-500">
            {loading ? (
              <div>Loading chart...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis 
                    tickFormatter={(value) => formatNumber(value)}
                  />
                  <Tooltip
                    formatter={(value: any) => [`${formatNumber(value)}M VND`, 'Revenue']}
                    labelFormatter={(label: string) => `Month: ${label}`}
                  />
                  <Bar dataKey="totalRevenue" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
      {/* Block Top Customers động */}
      <Card className="bg-white col-span-3">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Top Customers (Revenues)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loadingTopCustomers ? (
              <div>Loading top customers...</div>
            ) : topCustomers.length === 0 ? (
              <div className="text-gray-500">No customer data</div>
            ) : (
              topCustomers.map((customer, index) => (
                <div
                  key={customer.customer_id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {index + 1}. {customer.customer_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatNumber(Math.round(customer.totalRevenue))} VND
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
