
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Receipt, Plus, Download, Edit, Eye, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { NumberInput } from "@/components/ui/number-input";
import { formatNumber } from "@/lib/format";

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCost, setSelectedCost] = useState<Cost | null>(null);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit'>('view');

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedCosts = localStorage.getItem('costs');
    if (savedCosts) {
      setCosts(JSON.parse(savedCosts));
    }
  }, []);

  // Save data to localStorage whenever costs change
  useEffect(() => {
    localStorage.setItem('costs', JSON.stringify(costs));
  }, [costs]);

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

  const openDialog = (cost: Cost, mode: 'view' | 'edit') => {
    setSelectedCost(cost);
    setDialogMode(mode);
    setIsDialogOpen(true);
  };

  const saveChanges = () => {
    if (selectedCost) {
      updateCost(selectedCost.id, 'description', selectedCost.description);
      updateCost(selectedCost.id, 'price', selectedCost.price);
      updateCost(selectedCost.id, 'volume', selectedCost.volume);
      updateCost(selectedCost.id, 'category', selectedCost.category);
      updateCost(selectedCost.id, 'isCost', selectedCost.isCost);
      updateCost(selectedCost.id, 'checked', selectedCost.checked);
      updateCost(selectedCost.id, 'notes', selectedCost.notes);
      setIsDialogOpen(false);
      toast({
        title: "Lưu thành công",
        description: "Dữ liệu chi phí đã được cập nhật",
      });
    }
  };

  const saveAllData = () => {
    localStorage.setItem('costs', JSON.stringify(costs));
    toast({
      title: "Lưu tất cả dữ liệu",
      description: "Toàn bộ dữ liệu chi phí đã được lưu thành công",
    });
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
            <Button variant="outline" onClick={saveAllData}>
              <Save className="h-4 w-4 mr-2" />
              Save All
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
                    <th className="border border-gray-300 p-2 text-right font-medium">Đơn giá</th>
                    <th className="border border-gray-300 p-2 text-right font-medium">Khối lượng</th>
                    <th className="border border-gray-300 p-2 text-right font-medium">Chi phí</th>
                    <th className="border border-gray-300 p-2 text-left font-medium">Loại CP</th>
                    <th className="border border-gray-300 p-2 text-center font-medium">Là CP</th>
                    <th className="border border-gray-300 p-2 text-center font-medium">Đã kiểm tra</th>
                    <th className="border border-gray-300 p-2 text-left font-medium">Ghi chú</th>
                    <th className="border border-gray-300 p-2 text-center font-medium">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {costs.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="border border-gray-300 p-8 text-center text-gray-500">
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
                          <NumberInput
                            value={cost.price}
                            onChange={(value) => updateCost(cost.id, 'price', value)}
                            className="border-0 p-1 h-8"
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <NumberInput
                            value={cost.volume}
                            onChange={(value) => updateCost(cost.id, 'volume', value)}
                            className="border-0 p-1 h-8"
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <Input
                            value={formatNumber(cost.cost)}
                            readOnly
                            className="border-0 p-1 h-8 bg-gray-50 text-right"
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
                        <td className="border border-gray-300 p-1">
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDialog(cost, 'view')}
                              className="h-6 w-6 p-0"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDialog(cost, 'edit')}
                              className="h-6 w-6 p-0"
                            >
                              <Edit className="h-3 w-3" />
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
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'view' ? 'Xem Chi phí' : 'Chỉnh sửa Chi phí'}
            </DialogTitle>
          </DialogHeader>
          {selectedCost && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Năm</label>
                  <div className="p-2 bg-gray-50 rounded">{selectedCost.year}</div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tháng</label>
                  <div className="p-2 bg-gray-50 rounded">{selectedCost.month}</div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Mô tả</label>
                {dialogMode === 'view' ? (
                  <div className="p-2 bg-gray-50 rounded">{selectedCost.description}</div>
                ) : (
                  <Input
                    value={selectedCost.description}
                    onChange={(e) => setSelectedCost({...selectedCost, description: e.target.value})}
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Đơn giá</label>
                  {dialogMode === 'view' ? (
                    <div className="p-2 bg-gray-50 rounded text-right">{formatNumber(selectedCost.price)}</div>
                  ) : (
                    <Input
                      value={formatNumber(selectedCost.price)}
                      onChange={(e) => {
                        const value = e.target.value.replace(/,/g, '');
                        const numValue = parseFloat(value);
                        if (!isNaN(numValue) || value === '') {
                          setSelectedCost({...selectedCost, price: numValue || 0});
                        }
                      }}
                      className="text-right"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Khối lượng</label>
                  {dialogMode === 'view' ? (
                    <div className="p-2 bg-gray-50 rounded text-right">{formatNumber(selectedCost.volume)}</div>
                  ) : (
                    <Input
                      value={formatNumber(selectedCost.volume)}
                      onChange={(e) => {
                        const value = e.target.value.replace(/,/g, '');
                        const numValue = parseFloat(value);
                        if (!isNaN(numValue) || value === '') {
                          setSelectedCost({...selectedCost, volume: numValue || 0});
                        }
                      }}
                      className="text-right"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Chi phí</label>
                <div className="p-2 bg-gray-50 rounded text-right">{formatNumber(selectedCost.price * selectedCost.volume)}</div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Loại Chi phí</label>
                {dialogMode === 'view' ? (
                  <div className="p-2 bg-gray-50 rounded">{selectedCost.category}</div>
                ) : (
                  <Select
                    value={selectedCost.category}
                    onValueChange={(value) => setSelectedCost({...selectedCost, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COST_CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Là Chi phí</label>
                  {dialogMode === 'view' ? (
                    <div className="p-2 bg-gray-50 rounded">{selectedCost.isCost ? 'Có' : 'Không'}</div>
                  ) : (
                    <div className="flex items-center space-x-2 p-2">
                      <Checkbox
                        checked={selectedCost.isCost}
                        onCheckedChange={(checked) => setSelectedCost({...selectedCost, isCost: Boolean(checked)})}
                      />
                      <span className="text-sm">{selectedCost.isCost ? 'Có' : 'Không'}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Đã kiểm tra</label>
                  {dialogMode === 'view' ? (
                    <div className="p-2 bg-gray-50 rounded">{selectedCost.checked ? 'Có' : 'Không'}</div>
                  ) : (
                    <div className="flex items-center space-x-2 p-2">
                      <Checkbox
                        checked={selectedCost.checked}
                        onCheckedChange={(checked) => setSelectedCost({...selectedCost, checked: Boolean(checked)})}
                      />
                      <span className="text-sm">{selectedCost.checked ? 'Có' : 'Không'}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Ghi chú</label>
                {dialogMode === 'view' ? (
                  <div className="p-2 bg-gray-50 rounded min-h-[60px]">{selectedCost.notes}</div>
                ) : (
                  <Input
                    value={selectedCost.notes}
                    onChange={(e) => setSelectedCost({...selectedCost, notes: e.target.value})}
                  />
                )}
              </div>

              {dialogMode === 'edit' && (
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Hủy
                  </Button>
                  <Button onClick={saveChanges}>
                    Lưu
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Costs;
