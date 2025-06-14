
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PaginationControls from "@/components/PaginationControls";
import { formatNumber } from "@/lib/format";
import { BusinessData } from "@/hooks/useBusinessReport";

type PaginationProps = {
    currentPage: number;
    totalPages: number;
    goToPage: (page: number) => void;
    goToNextPage: () => void;
    goToPreviousPage: () => void;
    totalItems: number;
    startIndex: number;
    endIndex: number;
    paginatedData: BusinessData[];
}

interface BusinessReportTableProps {
  totalRecords: number;
  pagination: PaginationProps;
}

export const BusinessReportTable = ({ totalRecords, pagination }: BusinessReportTableProps) => {
  return (
    <Card className="bg-white">
        <CardHeader>
            <CardTitle>Detailed Report ({totalRecords} records)</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-blue-50">
                            <th className="border border-gray-300 p-2 text-left font-medium">Month</th>
                            <th className="border border-gray-300 p-2 text-right font-medium">Revenue</th>
                            <th className="border border-gray-300 p-2 text-right font-medium">Cost</th>
                            <th className="border border-gray-300 p-2 text-right font-medium">Gross Profit</th>
                            <th className="border border-gray-300 p-2 text-right font-medium">Income Tax</th>
                            <th className="border border-gray-300 p-2 text-right font-medium">Bonus</th>
                            <th className="border border-gray-300 p-2 text-right font-medium">Total Cost</th>
                            <th className="border border-gray-300 p-2 text-right font-medium">Net Profit</th>
                            <th className="border border-gray-300 p-2 text-right font-medium">Gross %</th>
                            <th className="border border-gray-300 p-2 text-right font-medium">Net %</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pagination.paginatedData.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="border border-gray-300 p-8 text-center text-gray-500">
                                    No data matches the selected filters. Try adjusting the year or month selection.
                                </td>
                            </tr>
                        ) : (
                            pagination.paginatedData.map((data) => (
                                <tr key={`${data.year}-${data.monthNumber}`} className="hover:bg-gray-50">
                                    <td className="border border-gray-300 p-2 font-medium">{data.month}</td>
                                    <td className="border border-gray-300 p-2 text-right">{formatNumber(data.revenue)}</td>
                                    <td className="border border-gray-300 p-2 text-right">{formatNumber(data.cost)}</td>
                                    <td className="border border-gray-300 p-2 text-right text-green-600">{formatNumber(data.grossProfit)}</td>
                                    <td className="border border-gray-300 p-2 text-right">{formatNumber(data.incomeTax)}</td>
                                    <td className="border border-gray-300 p-2 text-right">{formatNumber(data.bonus)}</td>
                                    <td className="border border-gray-300 p-2 text-right">{formatNumber(data.totalCost)}</td>
                                    <td className="border border-gray-300 p-2 text-right text-blue-600 font-medium">{formatNumber(data.netProfit)}</td>
                                    <td className="border border-gray-300 p-2 text-right">{formatNumber(data.grossProfitPercent)}%</td>
                                    <td className="border border-gray-300 p-2 text-right">{formatNumber(data.netProfitPercent)}%</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <PaginationControls
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={pagination.goToPage}
                onNextPage={pagination.goToNextPage}
                onPreviousPage={pagination.goToPreviousPage}
                totalItems={pagination.totalItems}
                startIndex={pagination.startIndex}
                endIndex={pagination.endIndex}
            />
        </CardContent>
    </Card>
  );
};

