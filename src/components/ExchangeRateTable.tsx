
import React, { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Plus, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { exchangeRateService, ExchangeRateDisplay } from "@/services/exchangeRateService";
import ExchangeRateTableHead from "./ExchangeRateTableHead";
import ExchangeRateTableBody from "./ExchangeRateTableBody";
import { exportExcel, type ImportError, type ExcelSchema } from "@/utils/excelIO";
import ExcelImportDialog, { type ImportResult, type ImportProgress } from "@/components/ExcelImportDialog";
import { reportRowProgress } from "@/utils/importProgress";
import { MONTH_SHORTS } from "@/lib/months";

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

const MONTHS = [...MONTH_SHORTS];

const ExchangeRateTable: React.FC<ExchangeRateTableProps> = ({
  exchangeRates,
  setExchangeRates,
  currencies: allCurrencies,
}) => {
  const { toast } = useToast();
  const [userModified, setUserModified] = useState(false);

  // VND is treated as a constant rate of 1 elsewhere in the app — hide it
  // from this screen entirely (dropdown + Excel template/import).
  const currencies = useMemo(
    () => allCurrencies.filter((c) => (c.code || "").toUpperCase() !== "VND"),
    [allCurrencies],
  );

  const MONTH_ORDER: Record<string, number> = {
    Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
    Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
  };

  const sortedRates = useMemo(() => {
    const isNew = (id: string) => !isNaN(Number(id));
    const newRows = exchangeRates.filter((r) => isNew(r.id));
    const savedRows = exchangeRates.filter((r) => !isNew(r.id)).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return (MONTH_ORDER[b.month] || 0) - (MONTH_ORDER[a.month] || 0);
    });
    return [...newRows, ...savedRows];
  }, [exchangeRates]);

  // Track editing cell: {id, field}
  const [editingCell, setEditingCell] = useState<{
    id: string;
    field: keyof ExchangeRateDisplay | null;
  } | null>(null);

  // Add row: Add button (afterId=null) OR + icon on the top row → prepend.
  // Otherwise insert after the given id.
  const addExchangeRateBelow = useCallback((afterId: string | null) => {
    setUserModified(true);
    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const newRate: ExchangeRateDisplay = {
      id: Date.now().toString(),
      year: prev.getFullYear(),
      month: MONTHS[prev.getMonth()],
      currencyID: "",
      exchangeRate: 0,
    };
    setExchangeRates((prev) => {
      if (!afterId) return [newRate, ...prev];
      const topVisibleId = sortedRates[0]?.id;
      if (afterId === topVisibleId) return [newRate, ...prev];
      const idx = prev.findIndex((item) => item.id === afterId);
      if (idx === -1) return [newRate, ...prev];
      return [...prev.slice(0, idx + 1), newRate, ...prev.slice(idx + 1)];
    });
    setTimeout(() => {
      setEditingCell({ id: newRate.id, field: "year" });
    }, 100);
  }, [setExchangeRates, sortedRates]);

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

  const [importOpen, setImportOpen] = useState(false);

  const schema = useMemo<ExcelSchema>(() => ({
    sheetName: "Exchange Rates",
    lookups: {
      months: MONTHS.map((m) => ({ code: m })),
      currencies: currencies.map((c) => ({ code: c.code, name: c.name })),
    },
    columns: [
      { key: "year", header: "Year", type: "integer", required: true, width: 8 },
      { key: "month", header: "Month", lookup: "months", required: true, width: 10 },
      { key: "currency_code", header: "Currency", lookup: "currencies", required: true, width: 14 },
      { key: "exchange_rate", header: "Exchange Rate", type: "number", required: true, width: 16 },
    ],
  }), [currencies]);

  const handleExport = async () => {
    try {
      const rows = exchangeRates.map((r) => ({
        year: r.year,
        month: r.month,
        currency_code: r.currencyID,
        exchange_rate: r.exchangeRate,
      }));
      await exportExcel({ schema, rows, fileName: "exchange-rates.xlsx" });
      toast({ title: "Export thành công", description: `Đã xuất ${rows.length} dòng.` });
    } catch (err: any) {
      toast({ title: "Export thất bại", description: err.message, variant: "destructive" });
    }
  };

  const handleImport = useCallback(async (
    rows: Record<string, any>[],
    onProgress?: ImportProgress,
  ): Promise<ImportResult> => {
    let created = 0;
    let updated = 0;
    const errors: ImportError[] = [];
    const total = rows.length;
    onProgress?.(0, total);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber: number = row.__rowNumber || 0;
      const errCols: string[] = [];
      const reasons: string[] = [];

      const year = Number(row.year);
      if (!Number.isFinite(year) || year < 2000 || year > 2100) {
        errCols.push("Year"); reasons.push(`Năm không hợp lệ: "${row.year ?? ""}"`);
      }
      const monthRaw = String(row.month || "").trim();
      const month = MONTHS.find((m) => m.toLowerCase() === monthRaw.toLowerCase()) || "";
      if (!month) {
        errCols.push("Month"); reasons.push(`Tháng phải là ${MONTHS.join("/")}`);
      }
      const currencyCode = String(row.currency_code || "").trim();
      if (!currencyCode) {
        errCols.push("Currency"); reasons.push("Currency bắt buộc");
      } else if (currencyCode.toUpperCase() === "VND") {
        errCols.push("Currency");
        reasons.push("VND có tỷ giá luôn = 1; không cần nhập vào bảng tỷ giá");
      } else if (!currencies.find((c) => c.code.toLowerCase() === currencyCode.toLowerCase())) {
        errCols.push("Currency"); reasons.push(`Không tìm thấy Currency: "${currencyCode}"`);
      }
      const exchangeRate = Number(row.exchange_rate);
      if (!Number.isFinite(exchangeRate)) {
        errCols.push("Exchange Rate"); reasons.push("Exchange Rate phải là số");
      }

      if (errCols.length > 0) {
        errors.push({ rowIndex: rowNumber, columns: errCols, reason: reasons.join("; ") });
        reportRowProgress(i + 1, total, onProgress);
        continue;
      }

      const existing = exchangeRates.find(
        (item) => item.year === year && item.month === month && item.currencyID.toLowerCase() === currencyCode.toLowerCase()
      );

      try {
        if (existing) {
          const updatedItem = await exchangeRateService.update(existing.id, { exchangeRate });
          setExchangeRates((prev) => prev.map((item) => (item.id === existing.id ? { ...item, ...updatedItem } : item)));
          updated++;
        } else {
          const newItem = await exchangeRateService.create({ year, month, currencyID: currencyCode, exchangeRate });
          setExchangeRates((prev) => [newItem, ...prev]);
          created++;
        }
      } catch (error: any) {
        errors.push({ rowIndex: rowNumber, columns: [], reason: `${year}/${month}/${currencyCode}: ${error.message || "Lỗi"}` });
      }
      reportRowProgress(i + 1, total, onProgress);
    }
    return { created, updated, errors };
  }, [exchangeRates, setExchangeRates, currencies]);

  return (
    <Card className="bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Exchange Rate List</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)} className="flex items-center gap-1">
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Button onClick={() => addExchangeRateBelow(null)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Exchange Rate
            </Button>
          </div>
        </div>
      </CardHeader>
      <ExcelImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Exchange Rates"
        schema={schema}
        templateFileName="exchange-rates-template.xlsx"
        errorFileName="exchange-rates-errors.xlsx"
        onImport={handleImport}
      />
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
