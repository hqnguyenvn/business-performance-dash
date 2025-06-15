
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const DashboardWidgets: React.FC = () => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          Monthly Revenue
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center text-gray-500">
          Revenue chart will be displayed here
        </div>
      </CardContent>
    </Card>
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
