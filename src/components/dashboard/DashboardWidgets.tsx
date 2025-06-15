
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useMonthlyRevenueStats } from "@/hooks/useMonthlyRevenueStats";
import { useState } from "react";

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Monthly Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            {loading ? (
              <div>Loading chart...</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any) => `${value}M VND`}
                    labelFormatter={(label: string) => `Month: ${label}`}
                  />
                  <Bar dataKey="totalRevenue" fill="#4ade80" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
      {/* Block Top Customers giữ nguyên */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Top Customers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: "ABC Company", revenue: "500M VND", growth: "+15%" },
              { name: "XYZ Company", revenue: "350M VND", growth: "+8%" },
              { name: "DEF Company", revenue: "280M VND", growth: "+22%" },
            ].map((customer, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{customer.name}</p>
                  <p className="text-sm text-gray-600">{customer.revenue}</p>
                </div>
                <span className="text-sm text-green-600 font-medium">
                  {customer.growth}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
