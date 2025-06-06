
import React, { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExchangeRate {
  id: string;
  year: number;
  month: string;
  currencyID: string;
  exchangeRate: number;
}

interface MasterData {
  id: string;
  code: string;
  name: string;
  description?: string;
}

interface ExchangeRateTableProps {
  exchangeRates: ExchangeRate[];
  setExchangeRates: React.Dispatch<React.SetStateAction<ExchangeRate[]>>;
  currencies: MasterData[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const ExchangeRateTable: React.FC<ExchangeRateTableProps> = ({ 
  exchangeRates, 
  setExchangeRates, 
  currencies 
}) => {
  const { toast } = useToast();

  const addNewExchangeRate = useCallback(() => {
    const newRate: ExchangeRate = {
      id: Date.now().toString(),
      year: new Date().getFullYear(),
      month: "Jan",
      currencyID: "",
      exchangeRate: 0,
    };
    setExchangeRates(prev => [...prev, newRate]);
  }, [setExchangeRates]);

  const updateExchangeRate = useCallback((id: string, field: keyof ExchangeRate, value: string | number) => {
    setExchangeRates(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  }, [setExchangeRates]);

  const deleteExchangeRate = useCallback((id: string) => {
    setExchangeRates(prev => prev.filter(item => item.id !== id));
    toast({
      title: "Đã xóa",
      description: "Đã xóa tỷ giá thành công",
    });
  }, [setExchangeRates, toast]);

  const saveData = useCallback(() => {
    toast({
      title: "Đã lưu",
      description: "Dữ liệu tỷ giá đã được lưu thành công",
    });
  }, [toast]);

  return (
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
};

export default ExchangeRateTable;
