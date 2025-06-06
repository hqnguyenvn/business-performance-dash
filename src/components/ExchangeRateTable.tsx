
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Plus, Edit, Eye, Trash2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { NumberInput } from "@/components/ui/number-input";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from "@/components/ui/table";
import { useTableFilter } from "@/hooks/useTableFilter";

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

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const ExchangeRateTable: React.FC<ExchangeRateTableProps> = ({
  exchangeRates,
  setExchangeRates,
  currencies
}) => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRate, setSelectedRate] = useState<ExchangeRate | null>(null);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit' | 'add'>('view');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [rateToDelete, setRateToDelete] = useState<string | null>(null);

  // Add table filtering
  const { filteredData: filteredRates, setFilter, getActiveFilters } = useTableFilter(exchangeRates);

  const addNewRate = () => {
    const newRate: ExchangeRate = {
      id: Date.now().toString(),
      year: new Date().getFullYear(),
      month: "Jan",
      currencyID: currencies[0]?.code || "",
      exchangeRate: 0
    };
    setSelectedRate(newRate);
    setDialogMode('add');
    setIsDialogOpen(true);
  };

  const updateRate = (id: string, field: keyof ExchangeRate, value: any) => {
    setExchangeRates(prev => prev.map(rate => 
      rate.id === id ? { ...rate, [field]: value } : rate
    ));
  };

  const openDialog = (rate: ExchangeRate, mode: 'view' | 'edit') => {
    setSelectedRate(rate);
    setDialogMode(mode);
    setIsDialogOpen(true);
  };

  const deleteRate = (id: string) => {
    setRateToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (rateToDelete) {
      setExchangeRates(prev => prev.filter(rate => rate.id !== rateToDelete));
      toast({
        title: "Deleted",
        description: "Exchange rate successfully deleted",
      });
      setIsDeleteDialogOpen(false);
      setRateToDelete(null);
    }
  };

  const saveRate = () => {
    if (selectedRate) {
      if (dialogMode === 'add') {
        setExchangeRates(prev => [...prev, selectedRate]);
        toast({
          title: "Added",
          description: "New exchange rate has been added",
        });
      } else {
        setExchangeRates(prev => prev.map(rate => 
          rate.id === selectedRate.id ? selectedRate : rate
        ));
        toast({
          title: "Updated",
          description: "Exchange rate has been updated",
        });
      }
      setIsDialogOpen(false);
    }
  };

  const getCurrencyName = (currencyCode: string) => {
    const currency = currencies.find(c => c.code === currencyCode);
    return currency ? currency.name : currencyCode;
  };

  return (
    <Card className="bg-white">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Exchange Rate List ({filteredRates.length} records)</CardTitle>
          <Button onClick={addNewRate}>
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-green-50">
                <TableHead 
                  className="border border-gray-300"
                  showFilter={true}
                  filterData={exchangeRates}
                  filterField="year"
                  onFilter={setFilter}
                  activeFilters={getActiveFilters("year")}
                >
                  Year
                </TableHead>
                <TableHead 
                  className="border border-gray-300"
                  showFilter={true}
                  filterData={exchangeRates}
                  filterField="month"
                  onFilter={setFilter}
                  activeFilters={getActiveFilters("month")}
                >
                  Month
                </TableHead>
                <TableHead 
                  className="border border-gray-300"
                  showFilter={true}
                  filterData={exchangeRates}
                  filterField="currencyID"
                  onFilter={setFilter}
                  activeFilters={getActiveFilters("currencyID")}
                >
                  Currency
                </TableHead>
                <TableHead 
                  className="border border-gray-300 text-right"
                  showFilter={true}
                  filterData={exchangeRates}
                  filterField="exchangeRate"
                  onFilter={setFilter}
                  activeFilters={getActiveFilters("exchangeRate")}
                >
                  Exchange Rate
                </TableHead>
                <TableHead className="border border-gray-300 text-center">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="border border-gray-300 p-8 text-center text-gray-500">
                    {exchangeRates.length === 0 
                      ? "No data available. Click \"Add New\" to start entering data."
                      : "No data matches the selected filters."
                    }
                  </TableCell>
                </TableRow>
              ) : (
                filteredRates.map((rate) => (
                  <TableRow key={rate.id} className="hover:bg-gray-50">
                    <TableCell className="border border-gray-300 p-1">
                      <Input
                        value={rate.year.toString()}
                        onChange={(e) => updateRate(rate.id, 'year', parseInt(e.target.value) || new Date().getFullYear())}
                        className="border-0 p-1 h-8 text-center"
                        type="number"
                      />
                    </TableCell>
                    <TableCell className="border border-gray-300 p-1">
                      <Select
                        value={rate.month}
                        onValueChange={(value) => updateRate(rate.id, 'month', value)}
                      >
                        <SelectTrigger className="border-0 p-1 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MONTHS.map(month => (
                            <SelectItem key={month} value={month}>
                              {month}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="border border-gray-300 p-1">
                      <Select
                        value={rate.currencyID}
                        onValueChange={(value) => updateRate(rate.id, 'currencyID', value)}
                      >
                        <SelectTrigger className="border-0 p-1 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map(currency => (
                            <SelectItem key={currency.id} value={currency.code}>
                              {currency.code} - {currency.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="border border-gray-300 p-1">
                      <NumberInput
                        value={rate.exchangeRate}
                        onChange={(value) => updateRate(rate.id, 'exchangeRate', value)}
                        className="border-0 p-1 h-8"
                      />
                    </TableCell>
                    <TableCell className="border border-gray-300 p-1">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDialog(rate, 'view')}
                          className="h-6 w-6 p-0"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDialog(rate, 'edit')}
                          className="h-6 w-6 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteRate(rate.id)}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'view' ? 'View Exchange Rate' : dialogMode === 'edit' ? 'Edit Exchange Rate' : 'Add New Exchange Rate'}
            </DialogTitle>
          </DialogHeader>
          {selectedRate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Year</label>
                  {dialogMode === 'view' ? (
                    <div className="p-2 bg-gray-50 rounded">{selectedRate.year}</div>
                  ) : (
                    <Input
                      value={selectedRate.year.toString()}
                      onChange={(e) => setSelectedRate({...selectedRate, year: parseInt(e.target.value) || new Date().getFullYear()})}
                      type="number"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Month</label>
                  {dialogMode === 'view' ? (
                    <div className="p-2 bg-gray-50 rounded">{selectedRate.month}</div>
                  ) : (
                    <Select
                      value={selectedRate.month}
                      onValueChange={(value) => setSelectedRate({...selectedRate, month: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map(month => (
                          <SelectItem key={month} value={month}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Currency</label>
                {dialogMode === 'view' ? (
                  <div className="p-2 bg-gray-50 rounded">{selectedRate.currencyID} - {getCurrencyName(selectedRate.currencyID)}</div>
                ) : (
                  <Select
                    value={selectedRate.currencyID}
                    onValueChange={(value) => setSelectedRate({...selectedRate, currencyID: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map(currency => (
                        <SelectItem key={currency.id} value={currency.code}>
                          {currency.code} - {currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Exchange Rate</label>
                {dialogMode === 'view' ? (
                  <div className="p-2 bg-gray-50 rounded text-right">{selectedRate.exchangeRate.toLocaleString()}</div>
                ) : (
                  <NumberInput
                    value={selectedRate.exchangeRate}
                    onChange={(value) => setSelectedRate({...selectedRate, exchangeRate: value})}
                  />
                )}
              </div>

              {dialogMode !== 'view' && (
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveRate}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this exchange rate.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRateToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default ExchangeRateTable;
