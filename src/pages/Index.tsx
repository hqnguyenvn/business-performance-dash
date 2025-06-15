
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, DollarSign, Receipt, TrendingUp, Users } from "lucide-react";
import { useState } from "react";

const Index = () => {
  // Data for cards
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

  // States for filter block
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([1,2,3,4,5,6]);
  const [incomeTaxRate, setIncomeTaxRate] = useState<number>(5);
  const [bonusRate, setBonusRate] = useState<number>(15);

  // Month options
  const months = [
    { value: 1, label: "Jan" },
    { value: 2, label: "Feb" },
    { value: 3, label: "Mar" },
    { value: 4, label: "Apr" },
    { value: 5, label: "May" },
    { value: 6, label: "Jun" },
    { value: 7, label: "Jul" },
    { value: 8, label: "Aug" },
    { value: 9, label: "Sep" },
    { value: 10, label: "Oct" },
    { value: 11, label: "Nov" },
    { value: 12, label: "Dec" },
  ];

  // Utility for toggling month selection
  const handleMonthToggle = (month: number) => {
    setSelectedMonths((prev) =>
      prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month].sort((a, b) => a - b)
    );
  };

  // Generate years for dropdown
  const years = Array.from({ length: 6 }, (_, idx) => currentYear - 2 + idx);

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Dashboard"
        description="Business overview"
        icon={Home}
      />

      {/* Data Filter block */}
      <div className="mx-3 md:mx-6 mt-6">
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
                        onChange={() => handleMonthToggle(m.value)}
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
                        onChange={() => handleMonthToggle(m.value)}
                        className="form-checkbox h-5 w-5 text-blue-900 border-gray-400 focus:ring-blue-900"
                      />
                      <span className="text-base">{m.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            {/* Rate inputs */}
            <div className="flex flex-wrap gap-6 items-center mt-2">
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
            </div>
          </div>
        </div>
      </div>
      
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
