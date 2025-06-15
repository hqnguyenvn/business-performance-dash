
import PaginationControls from "@/components/PaginationControls";

export interface GroupedCustomerData {
  year: number;
  month: number;
  customer_id: string;
  customer_code: string;
  company_id: string;
  company_code: string;
  bmm: number;
  revenue: number;
  salaryCost?: number;
  overheadCost?: number;
}

interface ReportTableProps {
  data: GroupedCustomerData[];
  loading: boolean;
  paginatedData: GroupedCustomerData[];
  currentPage: number;
  totalPages: number;
  goToPage: (page: number) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  bonusRate: number;
}

export function ReportTable({
  loading,
  data,
  paginatedData,
  currentPage,
  totalPages,
  goToPage,
  goToNextPage,
  goToPreviousPage,
  totalItems,
  startIndex,
  endIndex,
  bonusRate
}: ReportTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-green-50">
            <th className="border border-gray-300 p-2 text-left font-medium">Company</th>
            <th className="border border-gray-300 p-2 text-left font-medium">Customer Code</th>
            <th className="border border-gray-300 p-2 text-right font-medium">BMM</th>
            <th className="border border-gray-300 p-2 text-right font-medium">Revenue</th>
            <th className="border border-gray-300 p-2 text-right font-medium">Salary Cost</th>
            <th className="border border-gray-300 p-2 text-right font-medium">Bonus</th>
            <th className="border border-gray-300 p-2 text-right font-medium">Overhead Cost</th>
            <th className="border border-gray-300 p-2 text-right font-medium">Total Cost</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={8} className="p-8 text-center text-gray-500">Loading...</td>
            </tr>
          ) : paginatedData.length === 0 ? (
            <tr>
              <td colSpan={8} className="border border-gray-300 p-8 text-center text-gray-500">
                No data matches the selected filters. Try adjusting the year or month selection.
              </td>
            </tr>
          ) : (
            paginatedData.map((data) => {
              const salaryCost = data.salaryCost ?? 0;
              const bonusValue = (salaryCost * bonusRate) / 100;
              const overheadCost = data.overheadCost ?? 0;
              const totalCost = salaryCost + bonusValue + overheadCost;
              return (
                <tr
                  key={`${data.year}_${data.month}_${data.customer_id}_${data.company_id}`}
                  className="hover:bg-gray-50"
                >
                  <td className="border border-gray-300 p-2">{data.company_code}</td>
                  <td className="border border-gray-300 p-2">{data.customer_code}</td>
                  <td className="border border-gray-300 p-2 text-right">{data.bmm.toLocaleString()}</td>
                  <td className="border border-gray-300 p-2 text-right">{data.revenue.toLocaleString()}</td>
                  <td className="border border-gray-300 p-2 text-right">{salaryCost.toLocaleString()}</td>
                  <td className="border border-gray-300 p-2 text-right">{bonusValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  <td className="border border-gray-300 p-2 text-right">{overheadCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  <td className="border border-gray-300 p-2 text-right font-semibold">{totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={goToPage}
        onNextPage={goToNextPage}
        onPreviousPage={goToPreviousPage}
        totalItems={totalItems}
        startIndex={startIndex}
        endIndex={endIndex}
      />
    </div>
  )
}
