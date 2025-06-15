
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

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-red-50">
            <TableHead className="border border-gray-300 w-12 text-center">No.</TableHead>
            <TableHead className="border border-gray-300 text-center">Year</TableHead>
            <TableHead className="border border-gray-300 text-center">Month</TableHead>
            <TableHead className="border border-gray-300">Company</TableHead>
            <TableHead className="border border-gray-300">Division</TableHead>
            <TableHead className="border border-gray-300">Customer</TableHead>
            <TableHead className="border border-gray-300 text-right">Amount</TableHead>
            <TableHead className="border border-gray-300">Notes</TableHead>
            <TableHead className="border border-gray-300 text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {costs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="border border-gray-300 text-center py-8 text-gray-500">
                No data available.
              </TableCell>
            </TableRow>
          ) : (
            costs.map((cost, index) => (
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

