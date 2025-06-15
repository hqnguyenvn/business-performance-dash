
import React, { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { exchangeRateService, ExchangeRateDisplay } from "@/services/exchangeRateService";
import { formatNumber, parseFormattedNumber } from "@/lib/format";
import { usePagination } from "@/hooks/usePagination";
import PaginationControls from "@/components/PaginationControls";
import ExchangeRateTableHead from "./ExchangeRateTableHead";
import ExchangeRateTableBody from "./ExchangeRateTableBody";

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
  currencies 
}) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const {
    currentPage,
    totalPages,
    paginatedData,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    totalItems,
    startIndex,
    endIndex,
  } = usePagination({ data: exchangeRates });

  const addNewExchangeRate = useCallback(() => {
    const newRate: ExchangeRateDisplay = {
      id: Date.now().toString(), // Temporary ID
      year: new Date().getFullYear(),
      month: "Jan",
      currencyID: "",
      exchangeRate: 0,
    };
    setExchangeRates(prev => [...prev, newRate]);
  }, [setExchangeRates]);

  const updateExchangeRate = useCallback((id: string, field: keyof ExchangeRateDisplay, value: string | number) => {
    setExchangeRates(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  }, [setExchangeRates]);

  const handleExchangeRateChange = useCallback((id: string, value: string) => {
    const numericValue = parseFormattedNumber(value);
    updateExchangeRate(id, 'exchangeRate', numericValue);
  }, [updateExchangeRate]);

  const deleteExchangeRate = useCallback(async (id: string) => {
    try {
      const isNewItem = !isNaN(Number(id));
      if (!isNewItem) {
        await exchangeRateService.delete(id);
      }
      setExchangeRates(prev => prev.filter(item => item.id !== id));
      toast({
        title: "Deleted",
        description: "Exchange rate deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete exchange rate",
        variant: "destructive",
      });
    }
  }, [setExchangeRates, toast]);

  const saveData = useCallback(async () => {
    try {
      setSaving(true);
      const promises = exchangeRates.map(async (item) => {
        const isNewItem = !isNaN(Number(item.id));
        if (isNewItem && item.currencyID) {
          const { id, ...itemData } = item;
          return await exchangeRateService.create(itemData);
        } else if (!isNewItem && item.currencyID) {
          return await exchangeRateService.update(item.id, item);
        }
        return item;
      });

      const results = await Promise.all(promises);
      setExchangeRates(results.filter(Boolean));
      toast({
        title: "Saved",
        description: "Exchange rate data saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save exchange rate data",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }, [exchangeRates, setExchangeRates, toast]);

  return (
    <Card className="bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Exchange Rate List</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={saveData} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button onClick={addNewExchangeRate}>
              Add New
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <ExchangeRateTableHead addNewExchangeRate={addNewExchangeRate} />
            <TableBody>
              <ExchangeRateTableBody
                paginatedData={paginatedData}
                updateExchangeRate={updateExchangeRate}
                handleExchangeRateChange={handleExchangeRateChange}
                deleteExchangeRate={deleteExchangeRate}
                currencies={currencies}
                MONTHS={MONTHS}
              />
            </TableBody>
          </Table>
        </div>
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={goToPage}
          onNextPage={goToNextPage}
          onPreviousPage={goToPreviousPage}
          totalItems={totalItems}
          startIndex={startIndex}
          endIndex={endIndex}
        />
      </CardContent>
    </Card>
  );
};

export default ExchangeRateTable;
