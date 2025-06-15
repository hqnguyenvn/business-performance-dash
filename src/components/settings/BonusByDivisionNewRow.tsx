
import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { BonusByDivision } from "@/services/bonusByDivisionService";
import { MasterData } from "@/services/masterDataService";

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
    <TableCell className="p-1">
      <Input
        type="number"
        value={editCache.year ?? thisYear}
        min={2020}
        onChange={e => onFieldChange("year", Number(e.target.value))}
        className="h-8"
      />
    </TableCell>
    <TableCell className="p-1">
      <Select
        value={editCache.division_id ?? ""}
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
        value={editCache.bn_bmm ?? 0}
        min={0}
        step={0.01}
        onChange={e => onFieldChange("bn_bmm", Number(e.target.value))}
        className="h-8"
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
      <Button size="sm" className="mr-2" onClick={onSave}>Save</Button>
      <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
    </TableCell>
  </TableRow>
);

export default BonusByDivisionNewRow;
