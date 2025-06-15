
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { bonusByDivisionService, BonusByDivision } from "@/services/bonusByDivisionService";
import { MasterData } from "@/services/masterDataService";
import { useToast } from "@/hooks/use-toast";

interface BonusByDivisionTableProps {
  data: BonusByDivision[];
  setter: React.Dispatch<React.SetStateAction<BonusByDivision[]>>;
  divisions: MasterData[];
}

const MONTHS = [
  "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"
];

const thisYear = new Date().getFullYear();

const BonusByDivisionTable: React.FC<BonusByDivisionTableProps> = ({
  data,
  setter,
  divisions
}) => {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<BonusByDivision>>({});

  const handleEdit = (id: string) => {
    setEditingId(id);
    const row = data.find(d => d.id === id);
    setForm(row ? { ...row } : {});
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm({});
  };

  const handleChange = (field: keyof BonusByDivision, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      if (!form.id) {
        // Ensure all required fields before submit
        if (
          typeof form.year === "number" &&
          typeof form.month === "number" &&
          typeof form.division_id === "string" &&
          typeof form.bn_bmm === "number"
        ) {
          const added = await bonusByDivisionService.add({
            year: form.year,
            month: form.month,
            division_id: form.division_id,
            bn_bmm: form.bn_bmm,
            notes: form.notes ?? "",
          });
          setter(prev => [added, ...prev]);
          toast({ title: "Success", description: "Created new entry" });
        } else {
          toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
          return;
        }
      } else {
        // Update
        const updated = await bonusByDivisionService.update(form.id, form);
        setter(prev =>
          prev.map(item => (item.id === updated.id ? updated : item))
        );
        toast({ title: "Success", description: "Updated entry" });
      }
      setEditingId(null);
      setForm({});
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await bonusByDivisionService.delete(id);
      setter(prev => prev.filter(item => item.id !== id));
      toast({ title: "Success", description: "Deleted entry" });
      if (editingId === id) {
        setEditingId(null);
        setForm({});
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleAdd = () => {
    setEditingId("");
    setForm({ year: thisYear, month: 1, bn_bmm: 0, notes: "" });
  };

  return (
    <Card className="bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Bonus by Division</CardTitle>
          <Button onClick={handleAdd} variant="outline" size="sm">Add</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8 text-center">No.</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Division</TableHead>
                <TableHead>BN_BMM</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {editingId === "" && (
                <TableRow>
                  <TableCell />
                  <TableCell>
                    <Input
                      type="number"
                      min={2020}
                      value={form.year || thisYear}
                      onChange={e => handleChange("year", Number(e.target.value))}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Select value={form.month?.toString() ?? "1"} onValueChange={v => handleChange("month", Number(v))}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select value={form.division_id ?? ""} onValueChange={v => handleChange("division_id", v)}>
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
                  <TableCell>
                    <Input
                      type="number"
                      value={form.bn_bmm ?? 0}
                      min={0}
                      step={0.01}
                      onChange={e => handleChange("bn_bmm", Number(e.target.value))}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={form.notes ?? ""}
                      onChange={e => handleChange("notes", e.target.value)}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Button size="sm" className="mr-2" onClick={handleSave}>Save</Button>
                    <Button variant="ghost" size="sm" onClick={handleCancel}>Cancel</Button>
                  </TableCell>
                </TableRow>
              )}

              {data.map((row, idx) =>
                editingId === row.id ? (
                  <TableRow key={row.id}>
                    <TableCell />
                    <TableCell>
                      <Input
                        type="number"
                        min={2020}
                        value={form.year || thisYear}
                        onChange={e => handleChange("year", Number(e.target.value))}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Select value={form.month?.toString() ?? row.month.toString()} onValueChange={v => handleChange("month", Number(v))}>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select value={form.division_id ?? row.division_id} onValueChange={v => handleChange("division_id", v)}>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {divisions.map(d => (
                            <SelectItem key={d.id} value={d.id}>{d.code} - {d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={form.bn_bmm ?? row.bn_bmm}
                        min={0}
                        step={0.01}
                        onChange={e => handleChange("bn_bmm", Number(e.target.value))}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={form.notes ?? row.notes ?? ""}
                        onChange={e => handleChange("notes", e.target.value)}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Button size="sm" className="mr-2" onClick={handleSave}>Save</Button>
                      <Button variant="ghost" size="sm" onClick={handleCancel}>Cancel</Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow key={row.id}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{row.year}</TableCell>
                    <TableCell>{row.month}</TableCell>
                    <TableCell>
                      {divisions.find(d => d.id === row.division_id)?.code ?? ""}
                    </TableCell>
                    <TableCell>{row.bn_bmm}</TableCell>
                    <TableCell>{row.notes}</TableCell>
                    <TableCell className="text-center">
                      <Button size="sm" className="mr-2" onClick={() => handleEdit(row.id)}>Edit</Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(row.id)}>Delete</Button>
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default BonusByDivisionTable;

