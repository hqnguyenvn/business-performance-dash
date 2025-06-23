
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
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
import { formatNumberWithDecimals } from "@/lib/format";

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

interface ExchangeRateTableRowProps {
  rate: ExchangeRateDisplay;
  idx: number;
  editingCell: {id: string, field: keyof ExchangeRateDisplay | null} | null;
  onEditCell: (id: string, field: keyof ExchangeRateDisplay) => void;
  onBlurCell: () => void;
  saveCell: (id: string, field: keyof ExchangeRateDisplay, value: string | number) => void;
  deleteRow: (id: string) => void;
  addRowBelow: (id: string) => void;
  currencies: MasterData[];
  MONTHS: string[];
  className?: string;
}

const ExchangeRateTableRow: React.FC<ExchangeRateTableRowProps> = ({
  rate,
  idx,
  editingCell,
  onEditCell,
  onBlurCell,
  saveCell,
  deleteRow,
  addRowBelow,
  currencies,
  MONTHS,
  className,
}) => {
  return (
    <tr key={rate.id} className={`hover:bg-gray-50 ${className || ''}`}>
      {/* No. */}
      <td className="border border-gray-300 w-12 text-center">
        {idx + 1}
      </td>
      {/* Year */}
      <td
        className="border border-gray-300 p-1 w-24 cursor-pointer"
        onClick={() => onEditCell(rate.id, "year")}
      >
        {editingCell?.id === rate.id && editingCell?.field === "year" ? (
          <Input
            type="number"
            autoFocus
            value={rate.year}
            onChange={(e) => saveCell(rate.id, "year", parseInt(e.target.value) || 0)}
            onBlur={onBlurCell}
            className="border-0 p-1 h-8"
            onKeyDown={e => {
              if (e.key === "Enter" || e.key === "Tab") onBlurCell();
              else if (e.key === "Escape") onBlurCell();
            }}
          />
        ) : (
          <span>{rate.year}</span>
        )}
      </td>
      {/* Month */}
      <td
        className="border border-gray-300 p-1 w-24 cursor-pointer"
        onClick={() => onEditCell(rate.id, "month")}
      >
        {editingCell?.id === rate.id && editingCell?.field === "month" ? (
          <Select value={rate.month} onValueChange={(value) => {saveCell(rate.id, "month", value); onBlurCell();}} open={true}>
            <SelectTrigger className="border-0 p-1 h-8" autoFocus>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map(month => (
                <SelectItem key={month} value={month}>{month}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span>{rate.month}</span>
        )}
      </td>
      {/* Currency Code */}
      <td
        className="border border-gray-300 p-1 w-40 cursor-pointer"
        onClick={() => onEditCell(rate.id, "currencyID")}
      >
        {editingCell?.id === rate.id && editingCell?.field === "currencyID" ? (
          <Select value={rate.currencyID} onValueChange={(value) => {saveCell(rate.id, "currencyID", value); onBlurCell();}} open={true}>
            <SelectTrigger className="border-0 p-1 h-8" autoFocus>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {currencies.map(currency => (
                <SelectItem key={currency.id} value={currency.code}>{currency.code} - {currency.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span>
            {currencies.find((c) => c.code === rate.currencyID)?.code || ""}
            {currencies.find((c) => c.code === rate.currencyID)?.name ? ` - ${currencies.find((c) => c.code === rate.currencyID)?.name}` : ""}
          </span>
        )}
      </td>
      {/* Exchange Rate */}
      <td
        className="border border-gray-300 p-1 w-40 text-right cursor-pointer"
        onClick={() => onEditCell(rate.id, "exchangeRate")}
      >
        {editingCell?.id === rate.id && editingCell?.field === "exchangeRate" ? (
          <Input
            type="number"
            step="0.01"
            autoFocus
            value={rate.exchangeRate}
            onChange={(e) => {
              let val = parseFloat(e.target.value);
              if (isNaN(val)) val = 0;
              // Giữ lại đúng 2 số lẻ
              saveCell(rate.id, "exchangeRate", Math.round(val * 100) / 100);
            }}
            onBlur={onBlurCell}
            className="border-0 p-1 h-8 text-right"
            onKeyDown={e => {
              if (e.key === "Enter" || e.key === "Tab") onBlurCell();
              else if (e.key === "Escape") onBlurCell();
            }}
          />
        ) : (
          <span>{formatNumberWithDecimals(rate.exchangeRate, 2)}</span>
        )}
      </td>
      {/* Actions */}
      <td className="border border-gray-300 p-2 text-center w-32">
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            title="Add row below"
            onClick={() => addRowBelow(rate.id)}
            tabIndex={0}
          >
            <Plus className="h-4 w-4" />
          </Button>
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
                  onClick={() => deleteRow(rate.id)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </td>
    </tr>
  );
};
export default ExchangeRateTableRow;
