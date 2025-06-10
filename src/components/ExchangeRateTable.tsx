
import React, { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatNumber, parseFormattedNumber } from "@/lib/format";
import { usePagination } from "@/hooks/usePagination";
import PaginationControls from "@/components/PaginationControls";
import { exchangeRateService, ExchangeRateDisplay } from "@/services/exchangeRateService";

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
  const [deleteId, setDeleteId] = useState<string | null>(null);
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
      id: Date.now().toString(),
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
      // Only delete from database if it's not a temporary ID (new items have timestamp IDs)
      const isNewItem = !isNaN(Number(id));
      if (!isNewItem) {
        await exchangeRateService.delete(id);
      }
      
      setExchangeRates(prev => prev.filter(item => item.id !== id));
      toast({
        title: "Deleted",
        description: "Exchange rate deleted successfully",
      });
      setDeleteId(null);
    } catch (error) {
      console.error('Error deleting exchange rate:', error);
      toast({
        title: "Error",
        description: "Failed to delete exchange rate",
        variant: "destructive"
      });
    }
  }, [setExchangeRates, toast]);

  const saveData = useCallback(async () => {
    try {
      setSaving(true);
      const promises = exchangeRates.map(async (item) => {
        // Check if it's a new item (has timestamp ID) or existing item
        const isNewItem = !isNaN(Number(item.id));
        
        if (isNewItem && (item.currencyID || item.exchangeRate)) {
          // Create new item
          const { id, ...itemData } = item;
          return await exchangeRateService.create(itemData);
        } else if (!isNewItem && (item.currencyID || item.exchangeRate)) {
          // Update existing item
          return await exchangeRateService.update(item.id, item);
        }
        return item;
      });

      const results = await Promise.all(promises);
      
      // Update the state with the returned data from database
      setExchangeRates(results.filter(Boolean));
      
      toast({
        title: "Saved",
        description: "Exchange rate data saved successfully",
      });
    } catch (error) {
      console.error('Error saving exchange rates:', error);
      toast({
        title: "Error",
        description: "Failed to save exchange rate data",
        variant: "destructive"
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
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button onClick={addNewExchangeRate}>
              <Plus className="h-4 w-4 mr-2" />
              Add New
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 p-2 text-left font-medium">Year</th>
                <th className="border border-gray-300 p-2 text-left font-medium">Month</th>
                <th className="border border-gray-300 p-2 text-left font-medium">Currency Code</th>
                <th className="border border-gray-300 p-2 text-right font-medium">Exchange Rate</th>
                <th className="border border-gray-300 p-2 text-center font-medium">
                  Actions
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={addNewExchangeRate}
                    className="h-6 w-6 p-0 ml-1"
                    title="Add New Exchange Rate"
                  >
                    <Plus className="h-4 w-4 text-blue-600" />
                  </Button>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((rate) => (
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
                        <SelectValue placeholder="Select currency" />
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
                      type="text"
                      value={formatNumber(rate.exchangeRate)}
                      onChange={(e) => handleExchangeRateChange(rate.id, e.target.value)}
                      className="border-0 p-1 h-8 text-right"
                      onFocus={(e) => e.target.select()}
                    />
                  </td>
                  <td className="border border-gray-300 p-2 text-center">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this exchange rate? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteExchangeRate(rate.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
