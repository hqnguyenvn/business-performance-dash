
import React, { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { exchangeRateService, ExchangeRateDisplay } from "@/services/exchangeRateService";
import ExchangeRateTableHead from "./ExchangeRateTableHead";
import ExchangeRateTableBody from "./ExchangeRateTableBody";
import { exportToCsv } from "@/utils/exportCsv";

interface MasterData {
  id: string;
  code: string;
  name: string;
  description?: string;
}

interface ExchangeRateTableProps {
  exchangeRates: ExchangeRateDisplay[];
  setExchangeRates: React.Dispatch<React.SetStateAction<ExchangeRateDisplay[]>>;
  currencies: MasterData[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const ExchangeRateTable: React.FC<ExchangeRateTableProps> = ({
  exchangeRates,
  setExchangeRates,
  currencies,
}) => {
  const { toast } = useToast();
  const [userModified, setUserModified] = useState(false);

  const MONTH_ORDER: Record<string, number> = {
    Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
    Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
  };

  const sortedRates = useMemo(() => {
    if (userModified) return exchangeRates;
    return [...exchangeRates].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return (MONTH_ORDER[b.month] || 0) - (MONTH_ORDER[a.month] || 0);
    });
  }, [exchangeRates, userModified]);

  // Track editing cell: {id, field}
  const [editingCell, setEditingCell] = useState<{
    id: string;
    field: keyof ExchangeRateDisplay | null;
  } | null>(null);

  // Add row BELOW given id, or append if id === null
  const addExchangeRateBelow = useCallback((afterId: string | null) => {
    setUserModified(true);
    const newRate: ExchangeRateDisplay = {
      id: Date.now().toString(),
      year: new Date().getFullYear(),
      month: "Jan",
      currencyID: "",
      exchangeRate: 0,
    };
    setExchangeRates((prev) => {
      if (!afterId) return [...prev, newRate];
      const idx = prev.findIndex((item) => item.id === afterId);
      if (idx === -1) return [...prev, newRate];
      const newArr = [...prev.slice(0, idx + 1), newRate, ...prev.slice(idx + 1)];
      return newArr;
    });
    // focus cell mới: year
    setTimeout(() => {
      setEditingCell({ id: newRate.id, field: "year" });
    }, 100);
  }, [setExchangeRates]);

  // Inline edit-saving: on change cell AND on blur/enter sẽ gọi save (auto)
  const saveCell = useCallback(
    async (id: string, field: keyof ExchangeRateDisplay, value: string | number) => {
      // Update local state
      setExchangeRates((prev) =>
        prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
      );
      // Save to server nếu đủ thông tin
      const row = exchangeRates.find((item) => item.id === id);
      const isNew = !isNaN(Number(id));
      // Merge updated field
      const newRow = row ? { ...row, [field]: value } : undefined;
      // Chỉ lưu khi có currencyID
      if (!newRow || !newRow.currencyID) return;
      try {
        let updated: ExchangeRateDisplay | undefined = undefined;
        if (isNew) {
          // Thêm mới bản ghi
          const { id, ...createData } = newRow;
          updated = await exchangeRateService.create(createData);
        } else {
          updated = await exchangeRateService.update(id, { [field]: value, ...newRow });
        }
        if (updated) {
          setExchangeRates((prev) =>
            prev.map((item) => (item.id === id ? updated : item))
          );
          toast({
            title: "Saved",
            description: "Đã lưu tỉ giá thành công",
          });
        }
      } catch (error) {
        toast({
          title: "Lỗi",
          description: "Lưu tỉ giá thất bại",
          variant: "destructive",
        });
      }
    },
    [exchangeRates, setExchangeRates, toast]
  );

  // Xoá dòng
  const deleteExchangeRate = useCallback(
    async (id: string) => {
      try {
        const isNewItem = !isNaN(Number(id));
        if (!isNewItem) {
          await exchangeRateService.delete(id);
        }
        setExchangeRates((prev) => prev.filter((item) => item.id !== id));
        toast({
          title: "Đã xoá",
          description: "Đã xoá tỉ giá thành công",
        });
      } catch (error) {
        toast({
          title: "Lỗi",
          description: "Xoá tỉ giá thất bại",
          variant: "destructive",
        });
      }
    },
    [setExchangeRates, toast]
  );

  // Chỉnh sửa cell
  const handleEditCell = useCallback(
    (id: string, field: keyof ExchangeRateDisplay) => {
      setEditingCell({ id, field });
    },
    []
  );

  // Nhấn Enter/Escape ngoài cell: lưu/huỷ
  const handleBlurCell = useCallback(() => setEditingCell(null), []);

  const handleExport = () => {
    exportToCsv(exchangeRates, "Exchange_Rates", [
      { key: "year", header: "Year" },
      { key: "month", header: "Month" },
      { key: "currencyID", header: "Currency" },
      { key: "exchangeRate", header: "Exchange Rate" },
    ]);
  };

  return (
    <Card className="bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Exchange Rate List</CardTitle>
          <Button variant="outline" size="sm" onClick={handleExport} className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <ExchangeRateTableHead />
            <ExchangeRateTableBody
              data={sortedRates}
              setEditingCell={setEditingCell}
              editingCell={editingCell}
              onEditCell={handleEditCell}
              onBlurCell={handleBlurCell}
              saveCell={saveCell}
              deleteRow={deleteExchangeRate}
              addRowBelow={addExchangeRateBelow}
              currencies={currencies}
              MONTHS={MONTHS}
            />
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExchangeRateTable;
