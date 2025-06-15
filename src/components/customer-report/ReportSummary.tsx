
import { Card, CardContent } from "@/components/ui/card";

interface ReportSummaryProps {
  totalRevenue: number;
  totalBMM: number;
  totalSalaryCost: number;
}

export function ReportSummary({ totalRevenue, totalBMM, totalSalaryCost }: ReportSummaryProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
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
            {totalSalaryCost.toLocaleString()} VND
          </div>
          <p className="text-sm text-gray-600">Total Salary Cost</p>
        </CardContent>
      </Card>
    </div>
  );
}
