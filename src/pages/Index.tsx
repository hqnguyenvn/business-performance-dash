
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, DollarSign, Receipt, TrendingUp, Users } from "lucide-react";

const Index = () => {
  const stats = [
    {
      title: "Total Revenue",
      value: "2.5B VND",
      change: "+12.5%",
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "Total Cost",
      value: "1.8B VND",
      change: "+8.2%",
      icon: Receipt,
      color: "text-red-600",
    },
    {
      title: "Net Profit",
      value: "700M VND",
      change: "+18.3%",
      icon: TrendingUp,
      color: "text-blue-600",
    },
    {
      title: "Customers",
      value: "45",
      change: "+5",
      icon: Users,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Dashboard"
        description="Business overview"
        icon={Home}
      />
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title} className="bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <p className="text-xs text-green-600 mt-1">
                  {stat.change} compared to last month
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

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
      </div>
    </div>
  );
};

export default Index;

