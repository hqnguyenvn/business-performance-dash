
import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { BonusByDivision } from "@/services/bonusByDivisionService";
import { MasterData } from "@/services/masterDataService";
import { Plus, Trash } from "lucide-react";

interface BonusByDivisionEditRowProps {
  idx: number;
  editCache: Partial<BonusByDivision>;
  row: BonusByDivision;
  divisions: MasterData[];
  onFieldChange: (field: keyof BonusByDivision, value: any) => void;
  onSave: () => void;
  onCancel: () => void;
}

const BonusByDivisionEditRow: React.FC<BonusByDivisionEditRowProps> = ({
  idx, editCache, row, divisions, onFieldChange, onSave, onCancel
}) => (
  <TableRow>
    <TableCell className="text-center font-medium">{idx + 1}</TableCell>
    <TableCell className="p-1">
      <Input
        type="number"
        value={editCache.year ?? row.year}
        min={2020}
        onChange={e => onFieldChange("year", Number(e.target.value))}
        className="h-8"
      />
    </TableCell>
    <TableCell className="p-1">
      <Select
        value={editCache.division_id ?? row.division_id}
        onValueChange={v => onFieldChange("division_id", v)}
      >
        <SelectTrigger className="h-8">
          <SelectValue placeholder="Select Division" />
        </SelectTrigger>
        <SelectContent>
          {divisions.map(d => (
            <SelectItem key={d.id} value={d.id}>{d.code} - {d.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </TableCell>
    <TableCell className="p-1">
      <Input
        type="number"
        value={editCache.bn_bmm ?? row.bn_bmm}
        min={0}
        step={0.01}
        onChange={e => onFieldChange("bn_bmm", Number(e.target.value))}
        className="h-8"
      />
    </TableCell>
    <TableCell className="p-1">
      <Input
        value={editCache.notes ?? row.notes ?? ""}
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

export default BonusByDivisionEditRow;
