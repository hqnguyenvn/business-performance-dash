
import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { BonusByDivision } from "@/services/bonusByDivisionService";
import { MasterData } from "@/services/masterDataService";
import { Plus, Trash } from "lucide-react";

interface BonusByDivisionNewRowProps {
  divisions: MasterData[];
  editCache: Partial<BonusByDivision>;
  onFieldChange: (field: keyof BonusByDivision, value: any) => void;
  onSave: () => void;
  onCancel: () => void;
  thisYear: number;
}

const BonusByDivisionNewRow: React.FC<BonusByDivisionNewRowProps> = ({
  divisions, editCache, onFieldChange, onSave, onCancel, thisYear
}) => (
  <TableRow>
    <TableCell />
    <TableCell className="p-1 text-center">
      <Input
        type="number"
        value={editCache.year ?? thisYear}
        min={2020}
        onChange={e => onFieldChange("year", Number(e.target.value))}
        className="h-8 text-center"
      />
    </TableCell>
    <TableCell className="p-1 text-center">
      <Select
        value={editCache.division_id ?? ""}
        onValueChange={v => onFieldChange("division_id", v)}
      >
        <SelectTrigger className="h-8">
          <SelectValue placeholder="Select Division" />
        </SelectTrigger>
        <SelectContent>
          {divisions.map(d => (
            <SelectItem key={d.id} value={d.id}>{d.code}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </TableCell>
    <TableCell className="p-1 text-right">
      <Input
        type="number"
        value={editCache.bn_bmm ?? 0}
        min={0}
        step={0.01}
        onChange={e => onFieldChange("bn_bmm", Number(e.target.value))}
        className="h-8 text-right"
      />
    </TableCell>
    <TableCell className="p-1">
      <Input
        value={editCache.notes ?? ""}
        onChange={e => onFieldChange("notes", e.target.value)}
        className="h-8"
      />
    </TableCell>
    <TableCell className="p-1 text-center">
      <div className="flex items-center justify-center gap-2">
        <Button size="icon" variant="outline" className="h-8 w-8" title="Save" onClick={onSave}>
          <Plus size={18} />
        </Button>
        <Button variant="destructive" size="icon" className="h-8 w-8" title="Cancel" onClick={onCancel}>
          <Trash size={18} />
        </Button>
      </div>
    </TableCell>
  </TableRow>
);

export default BonusByDivisionNewRow;
