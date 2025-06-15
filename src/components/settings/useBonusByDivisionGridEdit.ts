
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { bonusByDivisionService, BonusByDivision } from "@/services/bonusByDivisionService";
import { MasterData } from "@/services/masterDataService";

type EditingCell = { id: string, field: keyof BonusByDivision } | null;

export const useBonusByDivisionGridEdit = (
  data: BonusByDivision[],
  setter: React.Dispatch<React.SetStateAction<BonusByDivision[]>>,
  divisions: MasterData[],
  thisYear: number
) => {
  const { toast } = useToast();

  const [editingCell, setEditingCell] = useState<EditingCell>(null);
  const [addingBelowIdx, setAddingBelowIdx] = useState<number | null>(null);
  const [newRowCache, setNewRowCache] = useState<Partial<BonusByDivision>>({});

  // Dùng cho add row (chỉ 1 dòng nhập mới)
  const emptyRow = () => ({
    id: "",
    year: thisYear,
    division_id: divisions.length ? divisions[0].id : "",
    bn_bmm: 0,
    notes: "",
  });

  const handleEditCell = (id: string, field: keyof BonusByDivision) => {
    setEditingCell({ id, field });
  };

  const handleBlurCell = () => setEditingCell(null);

  // Update Field cho row đã có (inline save khi blur)
  const saveCell = async (id: string, field: keyof BonusByDivision, value: string | number) => {
    const row = data.find(r => r.id === id);
    if (!row) return;
    const updates: any = { ...row, [field]: value };
    // Validate
    if (
      typeof updates.year === "number" &&
      typeof updates.division_id === "string" &&
      updates.division_id &&
      typeof updates.bn_bmm === "number"
    ) {
      try {
        const updated = await bonusByDivisionService.update(id, {
          year: updates.year,
          division_id: updates.division_id,
          bn_bmm: updates.bn_bmm,
          notes: updates.notes ?? "",
        });
        setter(prev => prev.map(item => (item.id === id ? updated : item)));
        toast({ title: "Đã lưu", description: "Đã tự động lưu thay đổi." });
      } catch (e: any) {
        toast({ title: "Lỗi", description: e.message, variant: "destructive" });
      }
    }
  };

  // New row
  const onInsertBelow = (idx: number) => {
    setAddingBelowIdx(idx);
    setNewRowCache(emptyRow());
    setEditingCell({ id: "new", field: "year" });
  };
  const onCancelNewRow = () => {
    setAddingBelowIdx(null);
    setNewRowCache({});
    setEditingCell(null);
  };

  // Save new row
  const handleSaveNewRow = async () => {
    if (
      typeof newRowCache.year === "number" &&
      typeof newRowCache.division_id === "string" &&
      newRowCache.division_id &&
      typeof newRowCache.bn_bmm === "number"
    ) {
      try {
        const added = await bonusByDivisionService.add({
          year: newRowCache.year,
          division_id: newRowCache.division_id,
          bn_bmm: newRowCache.bn_bmm,
          notes: newRowCache.notes ?? "",
        });
        if (addingBelowIdx !== null) {
          const newArr = [...data];
          newArr.splice(addingBelowIdx + 1, 0, added);
          setter(newArr);
        } else {
          setter(prev => [added, ...prev]);
        }
        toast({ title: "Success", description: "Created new entry" });
        setAddingBelowIdx(null);
        setNewRowCache({});
        setEditingCell(null);
      } catch (e: any) {
        toast({ title: "Error", description: e.message, variant: "destructive" });
      }
    } else {
      toast({
        title: "Error",
        description: "Fill all required fields",
        variant: "destructive",
      });
    }
  };

  // New row input handler
  const onNewRowFieldChange = (field: keyof BonusByDivision, value: any) => {
    setNewRowCache(prev => ({ ...prev, [field]: value }));
  };

  // Delete
  const handleDelete = async (id: string) => {
    try {
      await bonusByDivisionService.delete(id);
      setter(prev => prev.filter(item => item.id !== id));
      toast({ title: "Success", description: "Deleted entry" });
      if (editingCell?.id === id) setEditingCell(null);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return {
    editingCell,
    setEditingCell,
    handleEditCell,
    handleBlurCell,
    saveCell,
    addingBelowIdx,
    onInsertBelow,
    newRowCache,
    onNewRowFieldChange,
    handleSaveNewRow,
    onCancelNewRow,
    handleDelete,
  };
};
