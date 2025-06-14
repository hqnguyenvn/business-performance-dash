
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
          <TableRow>
            <TableHead>No.</TableHead>
            <TableHead>Year</TableHead>
            <TableHead>Month</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Division</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {costs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8">No data available.</TableCell>
            </TableRow>
          ) : (
            costs.map((cost, index) => (
              <TableRow key={cost.id} className="hover:bg-gray-50">
                <TableCell>{index + 1}</TableCell>
                <TableCell className="p-1">
                   <Input
                    value={cost.year.toString()}
                    onChange={(e) => updateCost(cost.id, 'year', parseInt(e.target.value) || currentYear)}
                    className="border-0 p-1 h-8 text-center"
                    type="number"
                  />
                </TableCell>
                <TableCell className="p-1">
                  <Select value={String(cost.month)} onValueChange={(v) => updateCost(cost.id, 'month', Number(v))}>
                    <SelectTrigger className="border-0 p-1 h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>{MONTHS.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="p-1">
                  <Select value={cost.company_id || ''} onValueChange={(v) => updateCost(cost.id, 'company_id', v)}>
                    <SelectTrigger className="border-0 p-1 h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>{companies.map(c => <SelectItem key={c.id} value={c.id}>{c.code}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="p-1">
                  <Select value={cost.division_id || ''} onValueChange={(v) => updateCost(cost.id, 'division_id', v)}>
                    <SelectTrigger className="border-0 p-1 h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>{divisions.map(d => <SelectItem key={d.id} value={d.id}>{d.code}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="p-1">
                  <Select value={cost.customer_id || ''} onValueChange={(v) => updateCost(cost.id, 'customer_id', v)}>
                    <SelectTrigger className="border-0 p-1 h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.code}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="p-1">
                  <NumberInput value={cost.amount} onChange={(v) => updateCost(cost.id, 'amount', v)} className="border-0 p-1 h-8" />
                </TableCell>
                <TableCell className="p-1">
                  <Input value={cost.notes || ''} onChange={(e) => updateCost(cost.id, 'notes', e.target.value)} className="border-0 p-1 h-8" />
                </TableCell>
                <TableCell className="p-1">
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
