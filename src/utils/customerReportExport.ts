
import { GroupedCustomerData } from "@/components/customer-report/ReportTable";

const MONTH_MAP: Record<number, string> = {
  1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun",
  7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec"
};

export function exportCustomerReportCSV(data: GroupedCustomerData[], bonusRate: number) {
  const headers = [
    "No.",
    "Year",
    "Month",
    "Company",
    "Customer",
    "BMM",
    "Revenue",
    "Salary Cost",
    "Bonus",
    "Overhead Cost",
    "Total Cost",
    "Profit",
    "% Profit"
  ];

  const rows = data.map((d, i) => {
    const salaryCost = d.salaryCost ?? 0;
    const bonus = (salaryCost * bonusRate) / 100;
    const overhead = d.overheadCost ?? 0;
    const totalCost = salaryCost + bonus + overhead;
    const revenue = d.revenue ?? 0;
    const profit = revenue - totalCost;
    const percentProfit = revenue !== 0 ? (profit / revenue) * 100 : 0;

    return [
      (i + 1).toString(),
      d.year,
      MONTH_MAP[d.month] || d.month,
      d.company_code,
      d.customer_code,
      d.bmm,
      revenue,
      salaryCost,
      Math.round(bonus),
      Math.round(overhead),
      Math.round(totalCost),
      Math.round(profit),
      revenue === 0 ? '-' : `${percentProfit.toFixed(1)}%`
    ];
  });

  const csvContent = [headers, ...rows]
    .map(row =>
      row.map(field => {
        const s = String(field);
        if (s.includes(',') || s.includes('"') || s.includes('\n')) {
          return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
      }).join(',')
    )
    .join('\n');

  const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  const currentDate = new Date().toISOString().split('T')[0];
  link.setAttribute("href", url);
  link.setAttribute("download", `customer_report_${currentDate}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
