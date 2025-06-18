
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2, Plus, Copy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NumberInput } from "@/components/ui/number-input";
import { SalaryCost, MONTHS } from "@/hooks/useSalaryCosts";
import { MasterData } from "@/services/masterDataService";
import { useTableFilter } from "@/hooks/useTableFilter";

interface SalaryCostsTableProps {
  costs: SalaryCost[];
  updateCost: (id: string, field: keyof SalaryCost, value: any) => void;
  deleteCost: (cost: SalaryCost) => void;
  openDialog: (cost: SalaryCost, mode: 'view' | 'edit') => void;
  insertRowBelow: (id: string) => void;
  cloneRow: (id: string) => void;
  companies: MasterData[];
  divisions: MasterData[];
  customers: MasterData[];
}

export const SalaryCostsTable = ({
  costs,
  updateCost,
  deleteCost,
  openDialog,
  insertRowBelow,
  cloneRow,
  companies,
  divisions,
  customers
}: SalaryCostsTableProps) => {
  const currentYear = new Date().getFullYear();
  
  const { filteredData: tableFilteredCosts, setFilter, getActiveFilters } = useTableFilter(costs);

  // Get unique values for filtering
  const getFilterData = (field: string) => {
    const uniqueValues = new Set();
    const filterData: any[] = [];
    
    costs.forEach(cost => {
      const value = cost[field as keyof SalaryCost];
      let displayValue = value;
      
      if (field === 'company_id') {
        const company = companies.find(c => c.id === value);
        displayValue = company?.code || '';
      } else if (field === 'division_id') {
        const division = divisions.find(d => d.id === value);
        displayValue = division?.code || '';
      } else if (field === 'customer_id') {
        const customer = customers.find(c => c.id === value);
        displayValue = customer?.code || '';
      } else if (field === 'month') {
        const monthObj = MONTHS.find(m => m.id === value);
        displayValue = monthObj?.name || '';
      }
      
      const filterValue = String(value || '');
      if (!uniqueValues.has(filterValue)) {
        uniqueValues.add(filterValue);
        filterData.push({ 
          [field]: filterValue,
          displayValue: displayValue || filterValue || '(Empty)'
        });
      }
    });
    
    return filterData;
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-red-50">
            <TableHead className="border border-gray-300 w-12 text-center">No.</TableHead>
            <TableHead 
              className="border border-gray-300 text-center"
              showFilter={true}
              filterData={getFilterData('year')}
              filterField="year"
              onFilter={setFilter}
              activeFilters={getActiveFilters('year')}
            >
              Year
            </TableHead>
            <TableHead 
              className="border border-gray-300 text-center"
              showFilter={true}
              filterData={getFilterData('month')}
              filterField="month"
              onFilter={setFilter}
              activeFilters={getActiveFilters('month')}
            >
              Month
            </TableHead>
            <TableHead 
              className="border border-gray-300"
              showFilter={true}
              filterData={getFilterData('company_id')}
              filterField="company_id"
              onFilter={setFilter}
              activeFilters={getActiveFilters('company_id')}
            >
              Company
            </TableHead>
            <TableHead 
              className="border border-gray-300"
              showFilter={true}
              filterData={getFilterData('division_id')}
              filterField="division_id"
              onFilter={setFilter}
              activeFilters={getActiveFilters('division_id')}
            >
              Division
            </TableHead>
            <TableHead 
              className="border border-gray-300"
              showFilter={true}
              filterData={getFilterData('customer_id')}
              filterField="customer_id"
              onFilter={setFilter}
              activeFilters={getActiveFilters('customer_id')}
            >
              Customer
            </TableHead>
            <TableHead 
              className="border border-gray-300 text-right"
              showFilter={true}
              filterData={getFilterData('amount')}
              filterField="amount"
              onFilter={setFilter}
              activeFilters={getActiveFilters('amount')}
            >
              Amount
            </TableHead>
            <TableHead 
              className="border border-gray-300"
              showFilter={true}
              filterData={getFilterData('notes')}
              filterField="notes"
              onFilter={setFilter}
              activeFilters={getActiveFilters('notes')}
            >
              Notes
            </TableHead>
            <TableHead className="border border-gray-300 text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tableFilteredCosts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="border border-gray-300 text-center py-8 text-gray-500">
                {costs.length === 0
                  ? "No data available. Click \"Add Row\" to start entering data."
                  : "No data matches the selected filters. Try adjusting the year or month selection."
                }
              </TableCell>
            </TableRow>
          ) : (
            tableFilteredCosts.map((cost, index) => (
              <TableRow key={cost.id} className="hover:bg-gray-50">
                <TableCell className="border border-gray-300 text-center p-1">{index + 1}</TableCell>
                <TableCell className="border border-gray-300 p-1">
                  <Input
                    value={cost.year.toString()}
                    onChange={(e) => updateCost(cost.id, 'year', parseInt(e.target.value) || currentYear)}
                    className="border-0 p-1 h-8 text-center"
                    type="number"
                  />
                </TableCell>
                <TableCell className="border border-gray-300 p-1">
                  <Select value={String(cost.month)} onValueChange={(v) => updateCost(cost.id, 'month', Number(v))}>
                    <SelectTrigger className="border-0 p-1 h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MONTHS.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.name.substring(0, 3)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="border border-gray-300 p-1">
                  <Select value={cost.company_id || ''} onValueChange={(v) => updateCost(cost.id, 'company_id', v)}>
                    <SelectTrigger className="border-0 p-1 h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.code}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="border border-gray-300 p-1">
                  <Select value={cost.division_id || ''} onValueChange={(v) => updateCost(cost.id, 'division_id', v)}>
                    <SelectTrigger className="border-0 p-1 h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {divisions.map(d => <SelectItem key={d.id} value={d.id}>{d.code}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="border border-gray-300 p-1">
                  <Select value={cost.customer_id || ''} onValueChange={(v) => updateCost(cost.id, 'customer_id', v)}>
                    <SelectTrigger className="border-0 p-1 h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.code}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="border border-gray-300 p-1 text-right">
                  <NumberInput value={cost.amount} onChange={(v) => updateCost(cost.id, 'amount', v)} className="border-0 p-1 h-8 text-right" />
                </TableCell>
                <TableCell className="border border-gray-300 p-1">
                  <Input value={cost.notes || ''} onChange={(e) => updateCost(cost.id, 'notes', e.target.value)} className="border-0 p-1 h-8" />
                </TableCell>
                <TableCell className="border border-gray-300 p-1">
                  <div className="flex gap-1 justify-center">
                    <Button size="sm" variant="outline" onClick={() => insertRowBelow(cost.id)} className="h-6 w-6 p-0" title="Add Row Below"><Plus className="h-3 w-3" /></Button>
                    <Button size="sm" variant="outline" onClick={() => cloneRow(cost.id)} className="h-6 w-6 p-0" title="Clone Row"><Copy className="h-3 w-3" /></Button>
                    <Button size="sm" variant="outline" onClick={() => openDialog(cost, 'view')} className="h-6 w-6 p-0"><Eye className="h-3 w-3" /></Button>
                    <Button size="sm" variant="outline" onClick={() => openDialog(cost, 'edit')} className="h-6 w-6 p-0"><Edit className="h-3 w-3" /></Button>
                    <Button size="sm" variant="outline" onClick={() => deleteCost(cost)} className="h-6 w-6 p-0 text-red-600 hover:text-red-700"><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
