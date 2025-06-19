
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
        <CardContent className="p-4 flex flex-col h-full">
          <div className="flex-grow">
            <div className="text-2xl font-bold text-blue-600 text-right">
              {Math.round(totalRevenue).toLocaleString()} VND
            </div>
          </div>
          <p className="text-sm text-gray-600">Total Revenue</p>
        </CardContent>
      </Card>
      <Card className="bg-white">
        <CardContent className="p-4 flex flex-col h-full">
          <div className="flex-grow">
            <div className="text-2xl font-bold text-purple-600 text-right">
              {Math.round(totalBMM).toLocaleString()} BMM
            </div>
          </div>
          <p className="text-sm text-gray-600">Total BMM</p>
        </CardContent>
      </Card>
      <Card className="bg-white">
        <CardContent className="p-4 flex flex-col h-full">
          <div className="flex-grow">
            <div className="text-2xl font-bold text-green-600 text-right">
              {Math.round(totalCost).toLocaleString()} VND
            </div>
          </div>
          <p className="text-sm text-gray-600">Total Cost</p>
        </CardContent>
      </Card>
      <Card className="bg-white">
        <CardContent className="p-4 flex flex-col h-full">
          <div className="flex-grow">
            <div className="text-2xl font-bold text-orange-600 text-right">
              {Math.round(totalProfit).toLocaleString()} VND
            </div>
          </div>
          <p className="text-sm text-gray-600">Total Net Profit</p>
        </CardContent>
      </Card>
      <Card className="bg-white">
        <CardContent className="p-4 flex flex-col h-full">
          <div className="flex-grow">
            <div className={`text-2xl font-bold text-right ${totalProfitPercent >= 0 ? "text-lime-600" : "text-red-600"}`}>
              {totalRevenue === 0 ? '-' : `${totalProfitPercent.toFixed(1)}%`}
            </div>
          </div>
          <p className="text-sm text-gray-600">% Profit</p>
        </CardContent>
      </Card>
    </div>
  );
}
