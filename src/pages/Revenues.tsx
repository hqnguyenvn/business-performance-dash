import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { DollarSign, Plus, Download, Eye, Edit, Trash2 } from "lucide-react";
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
  month: number;
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

const MONTHS = [
  { value: 1, label: "Tháng 1" },
  { value: 2, label: "Tháng 2" },
  { value: 3, label: "Tháng 3" },
  { value: 4, label: "Tháng 4" },
  { value: 5, label: "Tháng 5" },
  { value: 6, label: "Tháng 6" },
  { value: 7, label: "Tháng 7" },
  { value: 8, label: "Tháng 8" },
  { value: 9, label: "Tháng 9" },
  { value: 10, label: "Tháng 10" },
  { value: 11, label: "Tháng 11" },
  { value: 12, label: "Tháng 12" },
];

const Revenues = () => {
  const { toast } = useToast();
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // getMonth() returns 0-11
  
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [selectedMonths, setSelectedMonths] = useState<number[]>(
    Array.from({ length: currentMonth }, (_, i) => i + 1)
  );
  const [selectedRevenue, setSelectedRevenue] = useState<Revenue | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit'>('view');

  // Master data - in a real app, this would come from a shared context or API
  const [customers] = useState<MasterData[]>([
    { id: "1", code: "CUST001", name: "Công ty ABC Technology", description: "Khách hàng VIP" },
    { id: "2", code: "CUST002", name: "XYZ Solutions Ltd", description: "Khách hàng thường xuyên" },
  ]);

  const [companies] = useState<MasterData[]>([
    { id: "1", code: "COMP001", name: "Công ty TNHH ABC", description: "Công ty chính" },
    { id: "2", code: "COMP002", name: "Chi nhánh XYZ", description: "Chi nhánh phía Nam" },
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

  // Get unique years from revenue data
  const availableYears = Array.from(new Set(revenues.map(r => r.year))).sort((a, b) => b - a);
  const yearOptions = availableYears.length > 0 ? availableYears : [currentYear];

  // Filter revenues based on selected year and months
  const filteredRevenues = revenues.filter(revenue => 
    revenue.year === parseInt(selectedYear) && 
    selectedMonths.includes(revenue.month)
  );

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
      year: currentYear,
      month: currentMonth,
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

  const handleMonthToggle = (monthValue: number) => {
    setSelectedMonths(prev => 
      prev.includes(monthValue) 
        ? prev.filter(m => m !== monthValue)
        : [...prev, monthValue].sort()
    );
  };

  const handleView = (revenue: Revenue) => {
    setSelectedRevenue(revenue);
    setDialogMode('view');
    setIsDialogOpen(true);
  };

  const handleEdit = (revenue: Revenue) => {
    setSelectedRevenue(revenue);
    setDialogMode('edit');
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setRevenues(revenues.filter(revenue => revenue.id !== id));
    toast({
      title: "Xóa thành công",
      description: "Đã xóa bản ghi doanh thu",
    });
  };

  const handleSave = () => {
    if (selectedRevenue) {
      setRevenues(revenues.map(revenue => {
        if (revenue.id === selectedRevenue.id) {
          const updated = { ...selectedRevenue };
          // Auto calculate revenues when saving
          updated.originalRevenue = updated.bmm * updated.offshoreUnitPrice;
          updated.vndRevenue = updated.originalRevenue * 24000; // Assume exchange rate
          return updated;
        }
        return revenue;
      }));
      setIsDialogOpen(false);
      toast({
        title: "Lưu thành công",
        description: "Đã cập nhật thông tin doanh thu",
      });
    }
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
        {/* Filter Section */}
        <Card className="bg-white mb-6">
          <CardHeader>
            <CardTitle>Bộ lọc dữ liệu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Year Filter */}
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium w-16">Năm:</label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Chọn năm" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Month Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Tháng:</label>
                <div className="grid grid-cols-6 gap-4">
                  {MONTHS.map(month => (
                    <div key={month.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`month-${month.value}`}
                        checked={selectedMonths.includes(month.value)}
                        onCheckedChange={() => handleMonthToggle(month.value)}
                      />
                      <label 
                        htmlFor={`month-${month.value}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {month.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Dữ liệu Doanh thu</CardTitle>
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
                    <th className="border border-gray-300 p-2 text-left font-medium">Năm</th>
                    <th className="border border-gray-300 p-2 text-left font-medium">Tháng</th>
                    <th className="border border-gray-300 p-2 text-left font-medium">BMM</th>
                    <th className="border border-gray-300 p-2 text-left font-medium">Đơn giá</th>
                    <th className="border border-gray-300 p-2 text-left font-medium">Tiền tệ</th>
                    <th className="border border-gray-300 p-2 text-left font-medium">DT gốc</th>
                    <th className="border border-gray-300 p-2 text-left font-medium">DT VND</th>
                    <th className="border border-gray-300 p-2 text-left font-medium">Ghi chú</th>
                    <th className="border border-gray-300 p-2 text-left font-medium">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRevenues.length === 0 ? (
                    <tr>
                      <td colSpan={15} className="border border-gray-300 p-8 text-center text-gray-500">
                        Chưa có dữ liệu. Nhấn "Thêm dòng" để bắt đầu nhập liệu.
                      </td>
                    </tr>
                  ) : (
                    filteredRevenues.map((revenue) => (
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
                          <Select
                            value={revenue.invoiceTo}
                            onValueChange={(value) => updateRevenue(revenue.id, 'invoiceTo', value)}
                          >
                            <SelectTrigger className="border-0 p-1 h-8">
                              <SelectValue placeholder="Chọn công ty" />
                            </SelectTrigger>
                            <SelectContent>
                              {companies.map(company => (
                                <SelectItem key={company.id} value={company.code}>
                                  {company.code} - {company.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                            value={revenue.year}
                            onChange={(e) => updateRevenue(revenue.id, 'year', parseInt(e.target.value) || currentYear)}
                            className="border-0 p-1 h-8"
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <Select
                            value={revenue.month.toString()}
                            onValueChange={(value) => updateRevenue(revenue.id, 'month', parseInt(value))}
                          >
                            <SelectTrigger className="border-0 p-1 h-8">
                              <SelectValue placeholder="Tháng" />
                            </SelectTrigger>
                            <SelectContent>
                              {MONTHS.map(month => (
                                <SelectItem key={month.value} value={month.value.toString()}>
                                  {month.label}
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
                        <td className="border border-gray-300 p-1">
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleView(revenue)}
                              className="h-7 w-7 p-0"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(revenue)}
                              className="h-7 w-7 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(revenue.id)}
                              className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Detail Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {dialogMode === 'view' ? 'Xem chi tiết' : 'Chỉnh sửa'} Doanh thu
              </DialogTitle>
            </DialogHeader>
            {selectedRevenue && (
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mã khách hàng</label>
                  {dialogMode === 'view' ? (
                    <div className="p-2 bg-gray-50 rounded">{selectedRevenue.customerID}</div>
                  ) : (
                    <Select
                      value={selectedRevenue.customerID}
                      onValueChange={(value) => setSelectedRevenue({...selectedRevenue, customerID: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn khách hàng" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map(customer => (
                          <SelectItem key={customer.id} value={customer.code}>
                            {customer.code} - {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Xuất hóa đơn</label>
                  {dialogMode === 'view' ? (
                    <div className="p-2 bg-gray-50 rounded">{selectedRevenue.invoiceTo}</div>
                  ) : (
                    <Select
                      value={selectedRevenue.invoiceTo}
                      onValueChange={(value) => setSelectedRevenue({...selectedRevenue, invoiceTo: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn công ty" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map(company => (
                          <SelectItem key={company.id} value={company.code}>
                            {company.code} - {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Bộ phận</label>
                  {dialogMode === 'view' ? (
                    <div className="p-2 bg-gray-50 rounded">{selectedRevenue.division}</div>
                  ) : (
                    <Select
                      value={selectedRevenue.division}
                      onValueChange={(value) => setSelectedRevenue({...selectedRevenue, division: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn bộ phận" />
                      </SelectTrigger>
                      <SelectContent>
                        {divisions.map(division => (
                          <SelectItem key={division.id} value={division.code}>
                            {division.code} - {division.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Mã dự án</label>
                  {dialogMode === 'view' ? (
                    <div className="p-2 bg-gray-50 rounded">{selectedRevenue.projectCode}</div>
                  ) : (
                    <Select
                      value={selectedRevenue.projectCode}
                      onValueChange={(value) => setSelectedRevenue({...selectedRevenue, projectCode: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn dự án" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map(project => (
                          <SelectItem key={project.id} value={project.code}>
                            {project.code} - {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Tên dự án</label>
                  {dialogMode === 'view' ? (
                    <div className="p-2 bg-gray-50 rounded">{selectedRevenue.projectName}</div>
                  ) : (
                    <Input
                      value={selectedRevenue.projectName}
                      onChange={(e) => setSelectedRevenue({...selectedRevenue, projectName: e.target.value})}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Loại dự án</label>
                  {dialogMode === 'view' ? (
                    <div className="p-2 bg-gray-50 rounded">{selectedRevenue.projectType}</div>
                  ) : (
                    <Select
                      value={selectedRevenue.projectType}
                      onValueChange={(value) => setSelectedRevenue({...selectedRevenue, projectType: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại dự án" />
                      </SelectTrigger>
                      <SelectContent>
                        {projectTypes.map(type => (
                          <SelectItem key={type.id} value={type.code}>
                            {type.code} - {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Năm</label>
                  {dialogMode === 'view' ? (
                    <div className="p-2 bg-gray-50 rounded">{selectedRevenue.year}</div>
                  ) : (
                    <Input
                      type="number"
                      value={selectedRevenue.year}
                      onChange={(e) => setSelectedRevenue({...selectedRevenue, year: parseInt(e.target.value) || currentYear})}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Tháng</label>
                  {dialogMode === 'view' ? (
                    <div className="p-2 bg-gray-50 rounded">
                      {MONTHS.find(m => m.value === selectedRevenue.month)?.label}
                    </div>
                  ) : (
                    <Select
                      value={selectedRevenue.month.toString()}
                      onValueChange={(value) => setSelectedRevenue({...selectedRevenue, month: parseInt(value)})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn tháng" />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map(month => (
                          <SelectItem key={month.value} value={month.value.toString()}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">BMM</label>
                  {dialogMode === 'view' ? (
                    <div className="p-2 bg-gray-50 rounded">{selectedRevenue.bmm}</div>
                  ) : (
                    <Input
                      type="number"
                      value={selectedRevenue.bmm}
                      onChange={(e) => setSelectedRevenue({...selectedRevenue, bmm: parseFloat(e.target.value) || 0})}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Đơn giá</label>
                  {dialogMode === 'view' ? (
                    <div className="p-2 bg-gray-50 rounded">{selectedRevenue.offshoreUnitPrice}</div>
                  ) : (
                    <Input
                      type="number"
                      value={selectedRevenue.offshoreUnitPrice}
                      onChange={(e) => setSelectedRevenue({...selectedRevenue, offshoreUnitPrice: parseFloat(e.target.value) || 0})}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Tiền tệ</label>
                  {dialogMode === 'view' ? (
                    <div className="p-2 bg-gray-50 rounded">{selectedRevenue.currency}</div>
                  ) : (
                    <Select
                      value={selectedRevenue.currency}
                      onValueChange={(value) => setSelectedRevenue({...selectedRevenue, currency: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn tiền tệ" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map(currency => (
                          <SelectItem key={currency.id} value={currency.code}>
                            {currency.code} - {currency.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Doanh thu gốc</label>
                  <div className="p-2 bg-gray-50 rounded">{selectedRevenue.originalRevenue.toLocaleString()}</div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Doanh thu VND</label>
                  <div className="p-2 bg-gray-50 rounded">{selectedRevenue.vndRevenue.toLocaleString()}</div>
                </div>

                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-medium">Ghi chú</label>
                  {dialogMode === 'view' ? (
                    <div className="p-2 bg-gray-50 rounded">{selectedRevenue.notes}</div>
                  ) : (
                    <Input
                      value={selectedRevenue.notes}
                      onChange={(e) => setSelectedRevenue({...selectedRevenue, notes: e.target.value})}
                    />
                  )}
                </div>
              </div>
            )}
            {dialogMode === 'edit' && (
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={handleSave}>
                  Lưu
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Revenues;
