
import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";
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
import { formatNumber } from "@/lib/format";

interface MasterData {
  id: string;
  code: string;
  name: string;
  description?: string;
}

interface ExchangeRateDisplay {
  id: string;
  year: number;
  month: string;
  currencyID: string;
  exchangeRate: number;
}

interface ExchangeRateTableBodyProps {
  paginatedData: ExchangeRateDisplay[];
  updateExchangeRate: (id: string, field: keyof ExchangeRateDisplay, value: string | number) => void;
  handleExchangeRateChange: (id: string, value: string) => void;
  deleteExchangeRate: (id: string) => void;
  currencies: MasterData[];
  MONTHS: string[];
}

const ExchangeRateTableBody: React.FC<ExchangeRateTableBodyProps> = ({
  paginatedData,
  updateExchangeRate,
  handleExchangeRateChange,
  deleteExchangeRate,
  currencies,
  MONTHS
}) => {
  return (
    <>
      {paginatedData.map((rate) => (
        <TableRow key={rate.id} className="hover:bg-gray-50">
          <TableCell className="border border-gray-300 p-1 w-24">
            <Input
              type="number"
              value={rate.year}
              onChange={(e) => updateExchangeRate(rate.id, 'year', parseInt(e.target.value) || 0)}
              className="border-0 p-1 h-8"
              onFocus={(e) => e.target.select()}
            />
          </TableCell>
          <TableCell className="border border-gray-300 p-1 w-24">
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
          </TableCell>
          <TableCell className="border border-gray-300 p-1 w-40">
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
          </TableCell>
          <TableCell className="border border-gray-300 p-1 w-40 text-right">
            <Input
              type="text"
              value={formatNumber(rate.exchangeRate)}
              onChange={(e) => handleExchangeRateChange(rate.id, e.target.value)}
              className="border-0 p-1 h-8 text-right"
              onFocus={(e) => e.target.select()}
            />
          </TableCell>
          <TableCell className="border border-gray-300 p-2 text-center w-32">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  title="Delete"
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
          </TableCell>
        </TableRow>
      ))}
    </>
  );
};

export default ExchangeRateTableBody;
