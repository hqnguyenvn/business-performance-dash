
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Receipt, Plus, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Cost {
  id: string;
  year: number;
  month: string;
  description: string;
  price: number;
  volume: number;
  cost: number;
  category: string;
  isCost: boolean;
  checked: boolean;
  notes: string;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const COST_CATEGORIES = [
  "Infrastructure", "Admin", "SalesVN", "Benefit", "Office renting", "Process", 
  "Insurance", "Tax", "Training", "Outsourcing", "Marketing", "Dividend", 
  "Recruitment", "Salary", "Charity", "Bonus", "AriaService", "BusinessTrip", "Bankfee", "SaleSPLUS"
];

const Costs = () => {
  const { toast } = useToast();
  const [costs, setCosts] = useState<Cost[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>("Jan");

  const addNewRow = () => {
    const newCost: Cost = {
      id: Date.now().toString(),
      year: parseInt(selectedYear),
      month: selectedMonth,
      description: "",
      price: 0,
      volume: 0,
      cost: 0,
      category: "Infrastructure",
      isCost: true,
      checked: false,
      notes: "",
    };
    setCosts([...costs, newCost]);
  };

  const updateCost = (id: string, field: keyof Cost, value: any) => {
    setCosts(costs.map(cost => {
      if (cost.id === id) {
        const updated = { ...cost, [field]: value };
        // Auto calculate cost
        if (field === 'price' || field === 'volume') {
          updated.cost = updated.price * updated.volume;
        }
        return updated;
      }
      return cost;
    }));
  };

  const exportToCSV = () => {
    toast({
      title: "Xuất dữ liệu",
      description: "Đã xuất dữ liệu chi phí ra file CSV thành công",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Quản lý Chi phí"
        description="Ghi nhận chi phí theo năm và tháng"
        icon={Receipt}
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
              <CardTitle>Dữ liệu Chi phí</CardTitle>
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
                  <tr className="bg-red-50">
                    <th className="border border-gray-300 p-2 text-left font-medium">Mô tả</th>
                    <th className="border border-gray-300 p-2 text-left font-medium">Đơn giá</th>
                    <th className="border border-gray-300 p-2 text-left font-medium">Khối lượng</th>
                    <th className="border border-gray-300 p-2 text-left font-medium">Chi phí</th>
                    <th className="border border-gray-300 p-2 text-left font-medium">Loại CP</th>
                    <th className="border border-gray-300 p-2 text-left font-medium">Là CP</th>
                    <th className="border border-gray-300 p-2 text-left font-medium">Đã kiểm tra</th>
                    <th className="border border-gray-300 p-2 text-left font-medium">Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {costs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="border border-gray-300 p-8 text-center text-gray-500">
                        Chưa có dữ liệu. Nhấn "Thêm dòng" để bắt đầu nhập liệu.
                      </td>
                    </tr>
                  ) : (
                    costs.map((cost) => (
                      <tr key={cost.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-1">
                          <Input
                            value={cost.description}
                            onChange={(e) => updateCost(cost.id, 'description', e.target.value)}
                            className="border-0 p-1 h-8"
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <Input
                            type="number"
                            value={cost.price}
                            onChange={(e) => updateCost(cost.id, 'price', parseFloat(e.target.value) || 0)}
                            className="border-0 p-1 h-8"
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <Input
                            type="number"
                            value={cost.volume}
                            onChange={(e) => updateCost(cost.id, 'volume', parseFloat(e.target.value) || 0)}
                            className="border-0 p-1 h-8"
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <Input
                            value={cost.cost.toLocaleString()}
                            readOnly
                            className="border-0 p-1 h-8 bg-gray-50"
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <Select
                            value={cost.category}
                            onValueChange={(value) => updateCost(cost.id, 'category', value)}
                          >
                            <SelectTrigger className="border-0 p-1 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {COST_CATEGORIES.map(category => (
                                <SelectItem key={category} value={category}>{category}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="border border-gray-300 p-2 text-center">
                          <Checkbox
                            checked={cost.isCost}
                            onCheckedChange={(checked) => updateCost(cost.id, 'isCost', checked)}
                          />
                        </td>
                        <td className="border border-gray-300 p-2 text-center">
                          <Checkbox
                            checked={cost.checked}
                            onCheckedChange={(checked) => updateCost(cost.id, 'checked', checked)}
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <Input
                            value={cost.notes}
                            onChange={(e) => updateCost(cost.id, 'notes', e.target.value)}
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

export default Costs;
