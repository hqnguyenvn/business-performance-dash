
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Users, Plus, Download, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SalaryCost {
  id: string;
  year: number;
  month: string;
  company: string;
  division: string;
  customerID: string;
  amount: number;
  notes: string;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const SalaryCosts = () => {
  const { toast } = useToast();
  const [salaryCosts, setSalaryCosts] = useState<SalaryCost[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>("Jan");

  // Delete confirmation dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [costToDelete, setCostToDelete] = useState<string | null>(null);

  const addNewRow = () => {
    const newSalaryCost: SalaryCost = {
      id: Date.now().toString(),
      year: parseInt(selectedYear),
      month: selectedMonth,
      company: "",
      division: "",
      customerID: "",
      amount: 0,
      notes: "",
    };
    setSalaryCosts([...salaryCosts, newSalaryCost]);
  };

  const updateSalaryCost = (id: string, field: keyof SalaryCost, value: any) => {
    setSalaryCosts(salaryCosts.map(cost => 
      cost.id === id ? { ...cost, [field]: value } : cost
    ));
  };

  const deleteSalaryCost = (id: string) => {
    setCostToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (costToDelete) {
      setSalaryCosts(prev => prev.filter(cost => cost.id !== costToDelete));
      toast({
        title: "Deleted",
        description: "Salary cost record has been deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setCostToDelete(null);
    }
  };

  const exportToCSV = () => {
    toast({
      title: "Xuất dữ liệu",
      description: "Đã xuất dữ liệu chi phí lương ra file CSV thành công",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Chi phí Lương theo Khách hàng"
        description="Ghi nhận chi phí lương theo khách hàng"
        icon={Users}
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
              <CardTitle>Dữ liệu Chi phí Lương</CardTitle>
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
                  <tr className="bg-purple-50">
                    <th className="border border-gray-300 p-2 text-left font-medium">Công ty</th>
                    <th className="border border-gray-300 p-2 text-left font-medium">Bộ phận</th>
                    <th className="border border-gray-300 p-2 text-left font-medium">Mã KH</th>
                    <th className="border border-gray-300 p-2 text-left font-medium">Số tiền</th>
                    <th className="border border-gray-300 p-2 text-left font-medium">Ghi chú</th>
                    <th className="border border-gray-300 p-2 text-center font-medium">
                      Hành động
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={addNewRow}
                        className="h-6 w-6 p-0 ml-1"
                        title="Add New Row"
                      >
                        <Plus className="h-4 w-4 text-blue-600" />
                      </Button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {salaryCosts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="border border-gray-300 p-8 text-center text-gray-500">
                        Chưa có dữ liệu. Nhấn "Thêm dòng" để bắt đầu nhập liệu.
                      </td>
                    </tr>
                  ) : (
                    salaryCosts.map((salaryCost) => (
                      <tr key={salaryCost.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-1">
                          <Input
                            value={salaryCost.company}
                            onChange={(e) => updateSalaryCost(salaryCost.id, 'company', e.target.value)}
                            className="border-0 p-1 h-8"
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <Input
                            value={salaryCost.division}
                            onChange={(e) => updateSalaryCost(salaryCost.id, 'division', e.target.value)}
                            className="border-0 p-1 h-8"
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <Input
                            value={salaryCost.customerID}
                            onChange={(e) => updateSalaryCost(salaryCost.id, 'customerID', e.target.value)}
                            className="border-0 p-1 h-8"
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <Input
                            type="number"
                            value={salaryCost.amount}
                            onChange={(e) => updateSalaryCost(salaryCost.id, 'amount', parseFloat(e.target.value) || 0)}
                            className="border-0 p-1 h-8"
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <Input
                            value={salaryCost.notes}
                            onChange={(e) => updateSalaryCost(salaryCost.id, 'notes', e.target.value)}
                            className="border-0 p-1 h-8"
                          />
                        </td>
                        <td className="border border-gray-300 p-1">
                          <div className="flex justify-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteSalaryCost(salaryCost.id)}
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
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
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Điều này sẽ xóa vĩnh viễn bản ghi chi phí lương này.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCostToDelete(null)}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SalaryCosts;
