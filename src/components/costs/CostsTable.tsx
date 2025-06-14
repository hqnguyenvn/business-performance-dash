
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  return (
    <Card className="bg-white">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Cost Data ({filteredCosts.length} records)</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-red-50">
                <TableHead className="border border-gray-300">Year</TableHead>
                <TableHead className="border border-gray-300">Month</TableHead>
                <TableHead className="border border-gray-300">Description</TableHead>
                <TableHead className="border border-gray-300 text-right">Unit Price</TableHead>
                <TableHead className="border border-gray-300 text-right">Volume</TableHead>
                <TableHead className="border border-gray-300 text-right">Cost</TableHead>
                <TableHead className="border border-gray-300">Category</TableHead>
                <TableHead className="border border-gray-300 text-center">Is Cost</TableHead>
                <TableHead className="border border-gray-300 text-center">Checked</TableHead>
                <TableHead className="border border-gray-300">Notes</TableHead>
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
              {filteredCosts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="border border-gray-300 p-8 text-center text-gray-500">
                    {costs.length === 0
                      ? "No data available. Click \"Add Row\" to start entering data."
                      : "No data matches the selected filters. Try adjusting the year or month selection."
                    }
                  </TableCell>
                </TableRow>
              ) : (
                filteredCosts.map((cost) => (
                  <TableRow key={cost.id} className="hover:bg-gray-50">
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
                      <NumberInput
                        value={cost.price || 0}
                        onChange={(value) => updateCost(cost.id, 'price', value)}
                        className="border-0 p-1 h-8"
                      />
                    </TableCell>
                    <TableCell className="border border-gray-300 p-1">
                      <NumberInput
                        value={cost.volume || 0}
                        onChange={(value) => updateCost(cost.id, 'volume', value)}
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
      </CardContent>
    </Card>
  );
};
