
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings as SettingsIcon, Plus, Trash2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MasterData {
  id: string;
  code: string;
  name: string;
  description?: string;
}

interface ExchangeRate {
  id: string;
  year: number;
  month: string;
  currencyID: string;
  exchangeRate: number;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const Settings = () => {
  const { toast } = useToast();
  
  const [customers, setCustomers] = useState<MasterData[]>([
    { id: "1", code: "CUST001", name: "Công ty ABC Technology", description: "Khách hàng VIP" },
    { id: "2", code: "CUST002", name: "XYZ Solutions Ltd", description: "Khách hàng thường xuyên" },
  ]);

  const [companies, setCompanies] = useState<MasterData[]>([
    { id: "1", code: "COMP001", name: "Công ty Mẹ", description: "Công ty chính" },
    { id: "2", code: "COMP002", name: "Chi nhánh Hà Nội", description: "Chi nhánh miền Bắc" },
  ]);

  const [divisions, setDivisions] = useState<MasterData[]>([
    { id: "1", code: "DIV001", name: "Phòng Phát triển", description: "Bộ phận R&D" },
    { id: "2", code: "DIV002", name: "Phòng Kinh doanh", description: "Bộ phận Sales" },
  ]);

  const [projects, setProjects] = useState<MasterData[]>([
    { id: "1", code: "PRJ001", name: "Dự án ERP", description: "Hệ thống quản lý tổng thể" },
    { id: "2", code: "PRJ002", name: "Dự án CRM", description: "Quản lý khách hàng" },
  ]);

  const [projectTypes, setProjectTypes] = useState<MasterData[]>([
    { id: "1", code: "TYPE001", name: "Phát triển mới", description: "Dự án phát triển từ đầu" },
    { id: "2", code: "TYPE002", name: "Bảo trì", description: "Bảo trì hệ thống hiện tại" },
  ]);

  const [resources, setResources] = useState<MasterData[]>([
    { id: "1", code: "RES001", name: "Senior Developer", description: "Lập trình viên cấp cao" },
    { id: "2", code: "RES002", name: "Junior Developer", description: "Lập trình viên mới" },
  ]);

  const [currencies, setCurrencies] = useState<MasterData[]>([
    { id: "1", code: "USD", name: "US Dollar", description: "Đô la Mỹ" },
    { id: "2", code: "VND", name: "Vietnam Dong", description: "Đồng Việt Nam" },
    { id: "3", code: "JPY", name: "Japanese Yen", description: "Yên Nhật" },
  ]);

  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([
    { id: "1", year: 2024, month: "Jan", currencyID: "USD", exchangeRate: 24000 },
    { id: "2", year: 2024, month: "Jan", currencyID: "JPY", exchangeRate: 170 },
  ]);

  const addNewItem = (setter: React.Dispatch<React.SetStateAction<MasterData[]>>) => {
    const newItem: MasterData = {
      id: Date.now().toString(),
      code: "",
      name: "",
      description: "",
    };
    setter(prev => [...prev, newItem]);
  };

  const addNewExchangeRate = () => {
    const newRate: ExchangeRate = {
      id: Date.now().toString(),
      year: new Date().getFullYear(),
      month: "Jan",
      currencyID: "",
      exchangeRate: 0,
    };
    setExchangeRates(prev => [...prev, newRate]);
  };

  const updateItem = (
    setter: React.Dispatch<React.SetStateAction<MasterData[]>>,
    id: string,
    field: keyof MasterData,
    value: string
  ) => {
    setter(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const updateExchangeRate = (
    id: string,
    field: keyof ExchangeRate,
    value: string | number
  ) => {
    setExchangeRates(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const deleteItem = (setter: React.Dispatch<React.SetStateAction<MasterData[]>>, id: string) => {
    setter(prev => prev.filter(item => item.id !== id));
    toast({
      title: "Đã xóa",
      description: "Đã xóa mục thành công",
    });
  };

  const deleteExchangeRate = (id: string) => {
    setExchangeRates(prev => prev.filter(item => item.id !== id));
    toast({
      title: "Đã xóa",
      description: "Đã xóa tỷ giá thành công",
    });
  };

  const saveData = () => {
    // Here you would typically save to a database
    toast({
      title: "Đã lưu",
      description: "Dữ liệu đã được lưu thành công",
    });
  };

  const MasterDataTable = ({ 
    data, 
    setter, 
    title 
  }: { 
    data: MasterData[], 
    setter: React.Dispatch<React.SetStateAction<MasterData[]>>, 
    title: string 
  }) => (
    <Card className="bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={saveData}>
              <Save className="h-4 w-4 mr-2" />
              Lưu
            </Button>
            <Button onClick={() => addNewItem(setter)}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm mới
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 p-2 text-left font-medium">Mã</th>
                <th className="border border-gray-300 p-2 text-left font-medium">Tên</th>
                <th className="border border-gray-300 p-2 text-left font-medium">Mô tả</th>
                <th className="border border-gray-300 p-2 text-left font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 p-1">
                    <Input
                      value={item.code}
                      onChange={(e) => updateItem(setter, item.id, 'code', e.target.value)}
                      className="border-0 p-1 h-8"
                      onFocus={(e) => e.target.select()}
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <Input
                      value={item.name}
                      onChange={(e) => updateItem(setter, item.id, 'name', e.target.value)}
                      className="border-0 p-1 h-8"
                      onFocus={(e) => e.target.select()}
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <Input
                      value={item.description || ""}
                      onChange={(e) => updateItem(setter, item.id, 'description', e.target.value)}
                      className="border-0 p-1 h-8"
                      onFocus={(e) => e.target.select()}
                    />
                  </td>
                  <td className="border border-gray-300 p-2 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteItem(setter, item.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  const ExchangeRateTable = () => (
    <Card className="bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Danh sách Tỷ giá</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={saveData}>
              <Save className="h-4 w-4 mr-2" />
              Lưu
            </Button>
            <Button onClick={addNewExchangeRate}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm mới
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 p-2 text-left font-medium">Năm</th>
                <th className="border border-gray-300 p-2 text-left font-medium">Tháng</th>
                <th className="border border-gray-300 p-2 text-left font-medium">Mã tiền tệ</th>
                <th className="border border-gray-300 p-2 text-left font-medium">Tỷ giá</th>
                <th className="border border-gray-300 p-2 text-left font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {exchangeRates.map((rate) => (
                <tr key={rate.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 p-1">
                    <Input
                      type="number"
                      value={rate.year}
                      onChange={(e) => updateExchangeRate(rate.id, 'year', parseInt(e.target.value) || 0)}
                      className="border-0 p-1 h-8"
                      onFocus={(e) => e.target.select()}
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <Select value={rate.month} onValueChange={(value) => updateExchangeRate(rate.id, 'month', value)}>
                      <SelectTrigger className="border-0 p-1 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map(month => (
                          <SelectItem key={month} value={month}>{month}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="border border-gray-300 p-1">
                    <Select value={rate.currencyID} onValueChange={(value) => updateExchangeRate(rate.id, 'currencyID', value)}>
                      <SelectTrigger className="border-0 p-1 h-8">
                        <SelectValue placeholder="Chọn tiền tệ" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map(currency => (
                          <SelectItem key={currency.id} value={currency.code}>{currency.code} - {currency.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="border border-gray-300 p-1">
                    <Input
                      type="number"
                      value={rate.exchangeRate}
                      onChange={(e) => updateExchangeRate(rate.id, 'exchangeRate', parseFloat(e.target.value) || 0)}
                      className="border-0 p-1 h-8"
                      onFocus={(e) => e.target.select()}
                    />
                  </td>
                  <td className="border border-gray-300 p-2 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteExchangeRate(rate.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Cài đặt"
        description="Quản lý danh mục hệ thống"
        icon={SettingsIcon}
      />

      <div className="p-6">
        <Tabs defaultValue="customers" className="w-full">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="customers">Khách hàng</TabsTrigger>
            <TabsTrigger value="companies">Công ty</TabsTrigger>
            <TabsTrigger value="divisions">Bộ phận</TabsTrigger>
            <TabsTrigger value="projects">Dự án</TabsTrigger>
            <TabsTrigger value="projectTypes">Loại DA</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="currencies">Tiền tệ</TabsTrigger>
            <TabsTrigger value="exchangeRates">Tỷ giá</TabsTrigger>
          </TabsList>

          <TabsContent value="customers">
            <MasterDataTable data={customers} setter={setCustomers} title="Danh sách Khách hàng" />
          </TabsContent>

          <TabsContent value="companies">
            <MasterDataTable data={companies} setter={setCompanies} title="Danh sách Công ty" />
          </TabsContent>

          <TabsContent value="divisions">
            <MasterDataTable data={divisions} setter={setDivisions} title="Danh sách Bộ phận" />
          </TabsContent>

          <TabsContent value="projects">
            <MasterDataTable data={projects} setter={setProjects} title="Danh sách Dự án" />
          </TabsContent>

          <TabsContent value="projectTypes">
            <MasterDataTable data={projectTypes} setter={setProjectTypes} title="Danh sách Loại Dự án" />
          </TabsContent>

          <TabsContent value="resources">
            <MasterDataTable data={resources} setter={setResources} title="Danh sách Resources" />
          </TabsContent>

          <TabsContent value="currencies">
            <MasterDataTable data={currencies} setter={setCurrencies} title="Danh sách Tiền tệ" />
          </TabsContent>

          <TabsContent value="exchangeRates">
            <ExchangeRateTable />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
