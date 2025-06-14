
import { useState } from "react";
import { Revenue, createRevenue } from "@/services/revenueService";
import { useToast } from "@/hooks/use-toast";

export function useRevenueInlineEntry(fetchData: () => void) {
  const { toast } = useToast();
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [tempRow, setTempRow] = useState<any | null>(null);

  const handleAddNewRowInline = () => {
    if (tempRow) return;
    const now = new Date();
    const emptyRow = {
      id: "temp-" + Math.random().toString(36).substring(2, 12),
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      customer_id: "",
      company_id: "",
      division_id: "",
      project_id: "",
      project_type_id: "",
      resource_id: "",
      currency_id: "",
      unit_price: 0,
      quantity: 0,
      original_amount: 0,
      vnd_revenue: 0,
      notes: "",
      project_name: ""
    };
    setTempRow(emptyRow);
    setEditingCell({ id: emptyRow.id, field: "year" });
  };

  const handleEditTempRow = (id: string, field: keyof typeof tempRow, value: any) => {
    if (!tempRow || tempRow.id !== id) return;
    const updatedTempRow = { ...tempRow, [field]: value };
    setTempRow(updatedTempRow);
  };

  const handleCommitTempRow = async () => {
    // Validate minimal fields
    if (
      !tempRow.year ||
      !tempRow.month ||
      typeof tempRow.original_amount !== "number" ||
      typeof tempRow.vnd_revenue !== "number"
    ) {
      setTempRow(null);
      setEditingCell(null);
      toast({
        variant: "destructive",
        title: "Không thể thêm dòng mới",
        description: "Bạn cần điền đủ các trường chính (năm, tháng, số tiền gốc, số tiền VND)."
      });
      return;
    }
    try {
      const { id, ...toCreate } = tempRow;
      await createRevenue(toCreate);
      setTempRow(null);
      setEditingCell(null);
      fetchData();
      toast({ title: "Đã thêm mới bản ghi!" });
    } catch (error) {
      setTempRow(null);
      setEditingCell(null);
      toast({
        variant: "destructive",
        title: "Có lỗi khi thêm mới.",
        description: "Không thể lưu dữ liệu mới lên hệ thống"
      });
    }
  };

  const handleCellEdit = (id: string, field: keyof Revenue, value: any, handleCellEditDb: (id: string, field: keyof Revenue, value: any) => void) => {
    if (tempRow && id === tempRow.id) {
      handleEditTempRow(id, field as keyof typeof tempRow, value);
    } else {
      handleCellEditDb(id, field, value);
    }
  };

  return {
    editingCell,
    setEditingCell,
    tempRow,
    setTempRow,
    handleAddNewRowInline,
    handleEditTempRow,
    handleCommitTempRow,
    handleCellEdit
  };
}
