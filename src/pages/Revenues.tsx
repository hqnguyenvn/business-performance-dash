
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Plus, Download, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Revenue {
  id: string;
  customerID: string;
  invoiceTo: string;
  division: string;
  projectCode: string;
  projectName: string;
  projectType: string;
  resourceType: string;
  startDate: string;
  estimatedEndDate: string;
  originalUnitPrice: number;
  chargeByJapan: number;
  offshoreUnitPrice: number;
  currency: string;
  year: number;
  month: string;
  bmm: number;
  originalRevenue: number;
  vndRevenue: number;
  notes: string;
}

interface MasterData {
  id: string;
  code: string;
  name: string;
  description?: string;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const Revenues = () => {
  const { toast } = useToast();
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>("Jan");

  // Master data - in a real app, this would come from a shared context or API
  const [customers] = useState<MasterData[]>([
    { id: "1", code: "CUST001", name: "Công ty ABC Technology", description: "Khách hàng VIP" },
    { id: "2", code: "CUST002", name: "XYZ Solutions Ltd", description: "Khách hàng thường xuyên" },
  ]);

  const [divisions] = useState<MasterData[]>([
    { id: "1", code: "DIV001", name: "Phòng Phát triển", description: "Bộ phận R&D" },
    { id: "2", code: "DIV002", name: "Phòng Kinh doanh", description: "Bộ phận Sales" },
  ]);

  const [projects] = useState<MasterData[]>([
    { id: "1", code: "PRJ001", name: "Dự án ERP", description: "Hệ thống quản lý tổng thể" },
    { id: "2", code: "PRJ002", name: "Dự án CRM", description: "Quản lý khách hàng" },
  ]);

  const [projectTypes] = useState<MasterData[]>([
    { id: "1", code: "TYPE001", name: "Phát triển mới", description: "Dự án phát triển từ đầu" },
    { id: "2", code: "TYPE002", name: "Bảo trì", description: "Bảo trì hệ thống hiện tại" },
  ]);

  const [currencies] = useState<MasterData[]>([
    { id: "1", code: "USD", name: "US Dollar", description: "Đô la Mỹ" },
    { id: "2", code: "VND", name: "Vietnam Dong", description: "Đồng Việt Nam" },
    { id: "3", code: "JPY", name: "Japanese Yen", description: "Yên Nhật" },
  ]);

  const addNewRow = () => {
    const newRevenue: Revenue = {
      id: Date.now().toString(),
      customerID: "",
      invoiceTo: "",
      division: "",
      projectCode: "",
      projectName: "",
      projectType: "",
      resourceType: "",
      startDate: "",
      estimatedEndDate: "",
      originalUnitPrice: 0,
      chargeByJapan: 0,
      offshoreUnitPrice: 0,
      currency: "",
      year: parseInt(selectedYear),
      month: selectedMonth,
      bmm: 0,
      originalRevenue: 0,
      vndRevenue: 0,
      notes: "",
    };
    setRevenues([...revenues, newRevenue]);
  };

  const updateRevenue = (id: string, field: keyof Revenue, value: any) => {
    setRevenues(revenues.map(revenue => {
      if (revenue.id === id) {
        const updated = { ...revenue, [field]: value };
        // Auto calculate original revenue
        if (field === 'bmm' || field === 'offshoreUnitPrice') {
          updated.originalRevenue = updated.bmm * updated.offshoreUnitPrice;
          updated.vndRevenue = updated.originalRevenue * 24000; // Assume exchange rate
        }
        return updated;
      }
      return revenue;
    }));
  };

  const exportToCSV = () => {
    toast({
      title: "Xuất dữ liệu",
      description: "Đã xuất dữ liệu ra file CSV thành công",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Quản lý Doanh thu"
        description="Ghi nhận khối lượng công việc theo năm và tháng"
        icon={DollarSign}
        actions={
          <>
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Xuất CSV
            </Button>
            <Button onClick={addNewRow}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm dòng
            </Button>
          </>
        }
      />

      <div className="p-6">
        <Card className="bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Dữ liệu Doanh thu</CardTitle>
              <div className="flex gap-4">
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Năm" />
                  </SelectTrigger>
                  <SelectContent>
                    {[2023, 2024, 2025].map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Tháng" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map(month => (
                      <SelectItem key={month} value={month}>{month}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="border border-gray-300 p-2 text-left font-medium">Mã KH</th>
                    <th className="border border-gray-300 p-2 text-left font-medium">Xuất HĐ</th>
                    <th className="border border-gray-300 p-2 text-left font-medium">Bộ phận</th>
                    <th className="border border-gray-300 p-2 text-left font-medium">Mã DA</th>
                    <th className="border border-gray-300 p-2 text-left font-medium">Tên DA</th>
                    <th className="border border-gray-300 p-2 text-left font-medium">Loại DA</th>
                    <th className="border border-gray-300 p-2 text-left font-medium">BMM</th>
                    <th className="border border-gray-300 p-2 text-left font-medium">Đơn giá</th>
                    <th className="border border-gray-300 p-2 text-left font-medium">Tiền tệ</th>
                    <th className="border border-gray-300 p-2 text-left font-medium">DT gốc</th>
                    <th className="border border-gray-300 p-2 text-left font-medium">DT VND</th>
                    <th className="border border-gray-300 p-2 text-left font-medium">Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {revenues.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="border border-gray-300 p-8 text-center text-gray-500">
                        Chưa có dữ liệu. Nhấn "Thêm dòng" để bắt đầu nhập liệu.
                      </td>
                    </tr>
                  ) : (
                    revenues.map((revenue) => (
                      <tr key={revenue.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-1">
                          <Select
                            value={revenue.customerID}
                            onValueChange={(value) => updateRevenue(revenue.id, 'customerID', value)}
                          >
                            <SelectTrigger className="border-0 p-1 h-8">
                              <SelectValue placeholder="Chọn KH" />
                            </SelectTrigger>
                            <SelectContent>
                              {customers.map(customer => (
                                <SelectItem key={customer.id} value={customer.code}>
                                  {customer.code} - {customer.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="border border-gray-300 p-1">
                          <Input
                            value={revenue.invoiceTo}
                            onChange={(e) => updateRevenue(revenue.id, 'invoiceTo', e.target.value)}
                            className="border-0 p-1 h-8"
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <Select
                            value={revenue.division}
                            onValueChange={(value) => updateRevenue(revenue.id, 'division', value)}
                          >
                            <SelectTrigger className="border-0 p-1 h-8">
                              <SelectValue placeholder="Chọn BP" />
                            </SelectTrigger>
                            <SelectContent>
                              {divisions.map(division => (
                                <SelectItem key={division.id} value={division.code}>
                                  {division.code} - {division.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="border border-gray-300 p-1">
                          <Select
                            value={revenue.projectCode}
                            onValueChange={(value) => updateRevenue(revenue.id, 'projectCode', value)}
                          >
                            <SelectTrigger className="border-0 p-1 h-8">
                              <SelectValue placeholder="Chọn DA" />
                            </SelectTrigger>
                            <SelectContent>
                              {projects.map(project => (
                                <SelectItem key={project.id} value={project.code}>
                                  {project.code} - {project.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="border border-gray-300 p-1">
                          <Input
                            value={revenue.projectName}
                            onChange={(e) => updateRevenue(revenue.id, 'projectName', e.target.value)}
                            className="border-0 p-1 h-8"
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <Select
                            value={revenue.projectType}
                            onValueChange={(value) => updateRevenue(revenue.id, 'projectType', value)}
                          >
                            <SelectTrigger className="border-0 p-1 h-8">
                              <SelectValue placeholder="Chọn loại" />
                            </SelectTrigger>
                            <SelectContent>
                              {projectTypes.map(type => (
                                <SelectItem key={type.id} value={type.code}>
                                  {type.code} - {type.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="border border-gray-300 p-1">
                          <Input
                            type="number"
                            value={revenue.bmm}
                            onChange={(e) => updateRevenue(revenue.id, 'bmm', parseFloat(e.target.value) || 0)}
                            className="border-0 p-1 h-8"
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <Input
                            type="number"
                            value={revenue.offshoreUnitPrice}
                            onChange={(e) => updateRevenue(revenue.id, 'offshoreUnitPrice', parseFloat(e.target.value) || 0)}
                            className="border-0 p-1 h-8"
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <Select
                            value={revenue.currency}
                            onValueChange={(value) => updateRevenue(revenue.id, 'currency', value)}
                          >
                            <SelectTrigger className="border-0 p-1 h-8">
                              <SelectValue placeholder="Tiền tệ" />
                            </SelectTrigger>
                            <SelectContent>
                              {currencies.map(currency => (
                                <SelectItem key={currency.id} value={currency.code}>
                                  {currency.code} - {currency.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="border border-gray-300 p-1">
                          <Input
                            value={revenue.originalRevenue.toLocaleString()}
                            readOnly
                            className="border-0 p-1 h-8 bg-gray-50"
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <Input
                            value={revenue.vndRevenue.toLocaleString()}
                            readOnly
                            className="border-0 p-1 h-8 bg-gray-50"
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <Input
                            value={revenue.notes}
                            onChange={(e) => updateRevenue(revenue.id, 'notes', e.target.value)}
                            className="border-0 p-1 h-8"
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Revenues;
