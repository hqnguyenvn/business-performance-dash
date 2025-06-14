
import { Card, CardContent } from "@/components/ui/card";
import { formatNumber } from "@/lib/format";

interface BusinessReportSummaryProps {
  totalRevenue: number;
  totalGrossProfit: number;
  totalCost: number;
  totalNetProfit: number;
  grossProfitPercent: number;
  netProfitPercent: number;
  selectedYear: string;
}

export const BusinessReportSummary = ({
    totalRevenue,
    totalGrossProfit,
    totalCost,
    totalNetProfit,
    grossProfitPercent,
    netProfitPercent,
    selectedYear,
}: BusinessReportSummaryProps) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600 text-right">
                {formatNumber(totalRevenue)} VND
              </div>
              <p className="text-sm text-gray-600">Total Revenue {selectedYear}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600 text-right">
                {formatNumber(totalGrossProfit)} VND
              </div>
              <div className="text-sm text-green-600 text-right font-medium">
                {formatNumber(grossProfitPercent)}%
              </div>
              <p className="text-sm text-gray-600">Total Gross Profit</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600 text-right">
                {formatNumber(totalCost)} VND
              </div>
              <p className="text-sm text-gray-600">Total Cost</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600 text-right">
                {formatNumber(totalNetProfit)} VND
              </div>
              <div className="text-sm text-purple-600 text-right font-medium">
                {formatNumber(netProfitPercent)}%
              </div>
              <p className="text-sm text-gray-600">Total Net Profit</p>
            </CardContent>
          </Card>
        </div>
    );
};

