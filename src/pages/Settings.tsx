
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon, Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MasterData {
  id: string;
  code: string;
  name: string;
  description?: string;
}

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

  const addNewItem = (setter: React.Dispatch<React.SetStateAction<MasterData[]>>) => {
    const newItem: MasterData = {
      id: Date.now().toString(),
      code: "",
      name: "",
      description: "",
    };
    setter(prev => [...prev, newItem]);
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

  const deleteItem = (setter: React.Dispatch<React.SetStateAction<MasterData[]>>, id: string) => {
    setter(prev => prev.filter(item => item.id !== id));
    toast({
      title: "Đã xóa",
      description: "Đã xóa mục thành công",
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
          <Button onClick={() => addNewItem(setter)}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm mới
          </Button>
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
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <Input
                      value={item.name}
                      onChange={(e) => updateItem(setter, item.id, 'name', e.target.value)}
                      className="border-0 p-1 h-8"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <Input
                      value={item.description || ""}
                      onChange={(e) => updateItem(setter, item.id, 'description', e.target.value)}
                      className="border-0 p-1 h-8"
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

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Cài đặt"
        description="Quản lý danh mục hệ thống"
        icon={SettingsIcon}
      />

      <div className="p-6">
        <Tabs defaultValue="customers" className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="customers">Khách hàng</TabsTrigger>
            <TabsTrigger value="companies">Công ty</TabsTrigger>
            <TabsTrigger value="divisions">Bộ phận</TabsTrigger>
            <TabsTrigger value="projects">Dự án</TabsTrigger>
            <TabsTrigger value="projectTypes">Loại DA</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="currencies">Tiền tệ</TabsTrigger>
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
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
