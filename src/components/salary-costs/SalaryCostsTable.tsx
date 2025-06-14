
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NumberInput } from "@/components/ui/number-input";
import { SalaryCostWithStatus, MONTHS } from "@/hooks/useSalaryCosts";
import { MasterData } from "@/services/masterDataService";
import { Badge } from "@/components/ui/badge";

interface SalaryCostsTableProps {
  costs: SalaryCostWithStatus[];
  updateCost: (id: string, field: keyof SalaryCostWithStatus, value: any) => void;
  deleteCost: (cost: SalaryCostWithStatus) => void;
  openDialog: (cost: SalaryCostWithStatus, mode: 'view' | 'edit') => void;
  companies: MasterData[];
  divisions: MasterData[];
  customers: MasterData[];
}

export const SalaryCostsTable = ({ costs, updateCost, deleteCost, openDialog, companies, divisions, customers }: SalaryCostsTableProps) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
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
              <TableCell colSpan={9} className="text-center">No data available.</TableCell>
            </TableRow>
          ) : (
            costs.map((cost) => (
              <TableRow key={cost.id} className={cost.is_new ? "bg-green-50" : cost.is_updated ? "bg-yellow-50" : ""}>
                <TableCell>
                  {cost.is_new && <Badge variant="outline" className="bg-green-100 text-green-800">New</Badge>}
                  {cost.is_updated && <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Modified</Badge>}
                </TableCell>
                <TableCell>{cost.year}</TableCell>
                <TableCell>
                  <Select value={String(cost.month)} onValueChange={(v) => updateCost(cost.id, 'month', Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{MONTHS.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select value={cost.company_id || ''} onValueChange={(v) => updateCost(cost.id, 'company_id', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{companies.map(c => <SelectItem key={c.id} value={c.id}>{c.code}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select value={cost.division_id || ''} onValueChange={(v) => updateCost(cost.id, 'division_id', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{divisions.map(d => <SelectItem key={d.id} value={d.id}>{d.code}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select value={cost.customer_id || ''} onValueChange={(v) => updateCost(cost.id, 'customer_id', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.code}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <NumberInput value={cost.amount} onChange={(v) => updateCost(cost.id, 'amount', v)} className="text-right" />
                </TableCell>
                <TableCell>
                  <Input value={cost.notes || ''} onChange={(e) => updateCost(cost.id, 'notes', e.target.value)} />
                </TableCell>
                <TableCell className="text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openDialog(cost, 'view')}><Eye className="mr-2 h-4 w-4" />View</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openDialog(cost, 'edit')}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => deleteCost(cost)} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
