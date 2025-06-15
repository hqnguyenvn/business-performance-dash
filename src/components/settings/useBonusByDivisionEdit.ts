
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { bonusByDivisionService, BonusByDivision } from "@/services/bonusByDivisionService";
import { MasterData } from "@/services/masterDataService";

export const useBonusByDivisionEdit = (
  data: BonusByDivision[],
  setter: React.Dispatch<React.SetStateAction<BonusByDivision[]>>,
  divisions: MasterData[],
  thisYear: number
) => {
  const { toast } = useToast();

  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editCache, setEditCache] = useState<Partial<BonusByDivision>>({});
  const [addingBelowIdx, setAddingBelowIdx] = useState<number | null>(null);

  // Helper: generate empty row
  const emptyRow = () => ({
    id: "",
    year: thisYear,
    division_id: divisions.length ? divisions[0].id : "",
    bn_bmm: 0,
    notes: "",
  });

  const onEdit = (row: BonusByDivision) => {
    setEditingRowId(row.id);
    setEditCache({ ...row });
  };

  const onAddNew = () => {
    setEditingRowId(""); // Empty id: means "new"
    setEditCache(emptyRow());
  };

  const onInsertBelow = (idx: number) => {
    setAddingBelowIdx(idx);
    setEditingRowId("");
    setEditCache(emptyRow());
  };

  const onCancel = () => {
    setEditingRowId(null);
    setEditCache({});
    setAddingBelowIdx(null);
  };

  const onFieldChange = (field: keyof BonusByDivision, value: any) => {
    setEditCache((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      if (editingRowId === "") {
        // add new
        if (
          typeof editCache.year === "number" &&
          typeof editCache.division_id === "string" &&
          editCache.division_id &&
          typeof editCache.bn_bmm === "number"
        ) {
          const added = await bonusByDivisionService.add({
            year: editCache.year,
            division_id: editCache.division_id,
            bn_bmm: editCache.bn_bmm,
            notes: editCache.notes ?? "",
          });
          if (addingBelowIdx !== null) {
            const newArr = [...data];
            newArr.splice(addingBelowIdx + 1, 0, added);
            setter(newArr);
          } else {
            setter((prev) => [added, ...prev]);
          }
          toast({ title: "Success", description: "Created new entry" });
        } else {
          toast({
            title: "Error",
            description: "Fill all required fields",
            variant: "destructive",
          });
          return;
        }
      } else if (editingRowId) {
        // update
        if (
          typeof editCache.year === "number" &&
          typeof editCache.division_id === "string" &&
          editCache.division_id &&
          typeof editCache.bn_bmm === "number"
        ) {
          const updated = await bonusByDivisionService.update(editingRowId, {
            year: editCache.year,
            division_id: editCache.division_id,
            bn_bmm: editCache.bn_bmm,
            notes: editCache.notes ?? "",
          });
          setter((prev) =>
            prev.map((item) => (item.id === editingRowId ? updated : item))
          );
          toast({ title: "Success", description: "Updated entry" });
        } else {
          toast({
            title: "Error",
            description: "Fill all required fields",
            variant: "destructive",
          });
          return;
        }
      }
      setEditingRowId(null);
      setEditCache({});
      setAddingBelowIdx(null);
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await bonusByDivisionService.delete(id);
      setter((prev) => prev.filter((item) => item.id !== id));
      toast({ title: "Success", description: "Deleted entry" });
      if (editingRowId === id) {
        setEditingRowId(null);
        setEditCache({});
        setAddingBelowIdx(null);
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  return {
    editingRowId,
    editCache,
    addingBelowIdx,
    onEdit,
    onAddNew,
    onInsertBelow,
    onCancel,
    onFieldChange,
    handleSave,
    handleDelete
  };
};
