
import { Card, CardContent } from "@/components/ui/card";

interface ReportSummaryProps {
  totalRevenue: number;
  totalBMM: number;
  totalCost: number;
  totalProfit: number;
  totalProfitPercent: number;
}

export function ReportSummary({
  totalRevenue,
  totalBMM,
  totalCost,
  totalProfit,
  totalProfitPercent,
}: ReportSummaryProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
      <Card className="bg-white">
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-blue-600">
            {totalRevenue.toLocaleString()} VND
          </div>
          <p className="text-sm text-gray-600">Total Revenue</p>
        </CardContent>
      </Card>
      <Card className="bg-white">
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-purple-600">
            {totalBMM.toLocaleString()} BMM
          </div>
          <p className="text-sm text-gray-600">Total BMM</p>
        </CardContent>
      </Card>
      <Card className="bg-white">
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-green-600">
            {totalCost.toLocaleString()} VND
          </div>
          <p className="text-sm text-gray-600">Total Cost</p>
        </CardContent>
      </Card>
      <Card className="bg-white">
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-orange-600">
            {totalProfit.toLocaleString()} VND
          </div>
          <p className="text-sm text-gray-600">Total Profit</p>
        </CardContent>
      </Card>
      <Card className="bg-white">
        <CardContent className="p-4">
          <div className={`text-2xl font-bold ${totalProfitPercent >= 0 ? "text-lime-600" : "text-red-600"}`}>
            {totalRevenue === 0 ? '-' : `${totalProfitPercent.toFixed(1)}%`}
          </div>
          <p className="text-sm text-gray-600">% Profit</p>
        </CardContent>
      </Card>
    </div>
  );
}
