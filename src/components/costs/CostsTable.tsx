
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { NumberInput } from "@/components/ui/number-input";
import { formatNumber } from "@/lib/format";
import { Cost, MONTHS } from "@/hooks/useCosts";
import { MasterData } from "@/services/masterDataService";
import { Plus, Edit, Eye, Trash2, Copy } from "lucide-react";
import { useTableFilter } from "@/hooks/useTableFilter";

interface CostsTableProps {
  costs: Cost[];
  filteredCosts: Cost[];
  costTypes: MasterData[];
  updateCost: (id: string, field: keyof Cost, value: any) => void;
  openDialog: (cost: Cost, mode: 'view' | 'edit') => void;
  deleteCost: (cost: Cost) => void;
  addNewRow: () => void;
  insertRowBelow: (id: string) => void;
  cloneRow: (id: string) => void;
}

export const CostsTable = ({
  costs,
  filteredCosts,
  costTypes,
  updateCost,
  openDialog,
  deleteCost,
  addNewRow,
  insertRowBelow,
  cloneRow
}: CostsTableProps) => {
  const currentYear = new Date().getFullYear();
  
  const { filteredData: tableFilteredCosts, setFilter, getActiveFilters } = useTableFilter(filteredCosts);

  // Get unique values for filtering - return original data with both display and filter values
  const getFilterData = (field: string) => {
    const uniqueValues = new Set();
    const filterData: any[] = [];
    
    filteredCosts.forEach(cost => {
      const value = cost[field as keyof Cost];
      let displayValue = value;
      
      if (field === 'cost_type') {
        const costType = costTypes.find(ct => ct.id === value);
        displayValue = costType?.code || '';
      } else if (field === 'month') {
        const monthObj = MONTHS.find(m => m.value === value);
        displayValue = monthObj?.label || '';
      } else if (field === 'is_cost' || field === 'is_checked') {
        displayValue = value ? 'Yes' : 'No';
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
            <TableHead className="border border-gray-300 text-center w-16">
              No.
            </TableHead>
            <TableHead 
              className="border border-gray-300"
              showFilter={true}
              filterData={getFilterData('year')}
              filterField="year"
              onFilter={setFilter}
              activeFilters={getActiveFilters('year')}
            >
              Year
            </TableHead>
            <TableHead 
              className="border border-gray-300"
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
              filterData={getFilterData('description')}
              filterField="description"
              onFilter={setFilter}
              activeFilters={getActiveFilters('description')}
            >
              Description
            </TableHead>
            
            <TableHead className="border border-gray-300 text-right">Cost</TableHead>
            <TableHead 
              className="border border-gray-300"
              showFilter={true}
              filterData={getFilterData('cost_type')}
              filterField="cost_type"
              onFilter={setFilter}
              activeFilters={getActiveFilters('cost_type')}
            >
              Category
            </TableHead>
            <TableHead 
              className="border border-gray-300 text-center"
              showFilter={true}
              filterData={getFilterData('is_cost')}
              filterField="is_cost"
              onFilter={setFilter}
              activeFilters={getActiveFilters('is_cost')}
            >
              Is Cost
            </TableHead>
            <TableHead 
              className="border border-gray-300 text-center"
              showFilter={true}
              filterData={getFilterData('is_checked')}
              filterField="is_checked"
              onFilter={setFilter}
              activeFilters={getActiveFilters('is_checked')}
            >
              Checked
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
            <TableHead className="border border-gray-300 text-center">
              Actions
              <Button
                size="sm"
                variant="ghost"
                onClick={addNewRow}
                className="h-6 w-6 p-0 ml-1"
                title="Add New Row"
              >
                <Plus className="h-4 w-4 text-blue-600" />
              </Button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tableFilteredCosts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="border border-gray-300 p-8 text-center text-gray-500">
                {costs.length === 0
                  ? "No data available. Click \"Add Row\" to start entering data."
                  : "No data matches the selected filters. Try adjusting the year or month selection."
                }
              </TableCell>
            </TableRow>
          ) : (
            tableFilteredCosts.map((cost, index) => (
              <TableRow key={cost.id} className="hover:bg-gray-50">
                <TableCell className="border border-gray-300 p-2 text-center">
                  {index + 1}
                </TableCell>
                <TableCell className="border border-gray-300 p-1">
                  <Input
                    value={cost.year.toString()}
                    onChange={(e) => updateCost(cost.id, 'year', parseInt(e.target.value) || currentYear)}
                    className="border-0 p-1 h-8 text-center"
                    type="number"
                  />
                </TableCell>
                <TableCell className="border border-gray-300 p-1">
                  <Select
                    value={cost.month.toString()}
                    onValueChange={(value) => updateCost(cost.id, 'month', parseInt(value))}
                  >
                    <SelectTrigger className="border-0 p-1 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map(month => (
                        <SelectItem key={month.value} value={month.value.toString()}>
                          {month.label.substring(0, 3)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="border border-gray-300 p-1">
                  <Input
                    value={cost.description || ''}
                    onChange={(e) => updateCost(cost.id, 'description', e.target.value)}
                    className="border-0 p-1 h-8"
                  />
                </TableCell>
                
                <TableCell className="border border-gray-300 p-1">
                  <Input
                    value={formatNumber(cost.cost)}
                    readOnly
                    className="border-0 p-1 h-8 bg-gray-50 text-right"
                  />
                </TableCell>
                <TableCell className="border border-gray-300 p-1">
                  <Select
                    value={cost.cost_type}
                    onValueChange={(value) => updateCost(cost.id, 'cost_type', value)}
                  >
                    <SelectTrigger className="border-0 p-1 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {costTypes.map(category => (
                        <SelectItem key={category.id} value={category.id}>{category.code}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="border border-gray-300 p-2 text-center">
                  <Checkbox
                    checked={cost.is_cost}
                    onCheckedChange={(checked) => updateCost(cost.id, 'is_cost', checked)}
                  />
                </TableCell>
                <TableCell className="border border-gray-300 p-2 text-center">
                  <Checkbox
                    checked={cost.is_checked}
                    onCheckedChange={(checked) => updateCost(cost.id, 'is_checked', checked)}
                  />
                </TableCell>
                <TableCell className="border border-gray-300 p-1">
                  <Input
                    value={cost.notes || ''}
                    onChange={(e) => updateCost(cost.id, 'notes', e.target.value)}
                    className="border-0 p-1 h-8"
                  />
                </TableCell>
                <TableCell className="border border-gray-300 p-1">
                  <div className="flex gap-1 justify-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => insertRowBelow(cost.id)}
                      className="h-6 w-6 p-0"
                      title="Add Row Below"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => cloneRow(cost.id)}
                      className="h-6 w-6 p-0"
                      title="Clone Row"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openDialog(cost, 'view')}
                      className="h-6 w-6 p-0"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openDialog(cost, 'edit')}
                      className="h-6 w-6 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteCost(cost)}
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
  );
};
