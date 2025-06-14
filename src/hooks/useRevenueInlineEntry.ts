import { useState } from "react";
import { Revenue, createRevenue } from "@/services/revenueService";
import { useToast } from "@/hooks/use-toast";

export function useRevenueInlineEntry(
  fetchData: () => void,
  calculateVNDRevenue: (revenue: Partial<Revenue>) => number
) {
  const { toast } = useToast();
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [tempRow, setTempRow] = useState<Partial<Revenue> | null>(null);

  const handleAddNewRowInline = () => {
    if (tempRow) return;
    const now = new Date();
    const emptyRow: Partial<Revenue> = {
      id: "temp-" + Math.random().toString(36).substring(2, 12),
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      unit_price: 0,
      quantity: 0,
      original_amount: 0,
      vnd_revenue: 0,
      project_name: ""
    };
    setTempRow(emptyRow);
    setEditingCell({ id: emptyRow.id!, field: "year" });
  };

  const handleEditTempRow = (id: string, field: keyof Revenue, value: any) => {
    if (!tempRow || tempRow.id !== id) return;

    let updatedTempRow = { ...tempRow, [field]: value };

    if (field === 'unit_price' || field === 'quantity') {
      updatedTempRow.original_amount = (updatedTempRow.unit_price || 0) * (updatedTempRow.quantity || 0);
    }

    // Recalculate VND revenue if relevant fields change or original_amount was just calculated
    if (
      field === 'unit_price' ||
      field === 'quantity' ||
      field === 'currency_id' ||
      field === 'year' ||
      field === 'month' ||
      (field === 'unit_price' || field === 'quantity') // to trigger after original_amount update
    ) {
      updatedTempRow.vnd_revenue = calculateVNDRevenue(updatedTempRow);
    }
    setTempRow(updatedTempRow);
  };

  const handleCommitTempRow = async () => {
    if (
      !tempRow ||
      !tempRow.year ||
      !tempRow.month ||
      typeof tempRow.original_amount !== "number"
    ) {
      toast({
        variant: "destructive",
        title: "Không thể thêm dòng mới",
        description: "Bạn cần điền đủ các trường chính (năm, tháng, và các trường để tính số tiền gốc)."
      });
      return;
    }
    try {
      const { id, ...toCreate } = tempRow;
      const finalDataForCreation: Omit<Revenue, 'id'> = {
        year: toCreate.year!,
        month: toCreate.month!,
        original_amount: toCreate.original_amount!,
        vnd_revenue: calculateVNDRevenue(toCreate),
        project_name: toCreate.project_name || "",
        customer_id: toCreate.customer_id || undefined,
        company_id: toCreate.company_id || undefined,
        division_id: toCreate.division_id || undefined,
        project_id: toCreate.project_id || undefined,
        project_type_id: toCreate.project_type_id || undefined,
        resource_id: toCreate.resource_id || undefined,
        currency_id: toCreate.currency_id || undefined,
        unit_price: toCreate.unit_price || undefined,
        quantity: toCreate.quantity || undefined,
        notes: toCreate.notes || undefined,
      };

      await createRevenue(finalDataForCreation);
      setTempRow(null);
      setEditingCell(null);
      fetchData();
      toast({ title: "Đã thêm mới bản ghi!" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Có lỗi khi thêm mới.",
        description: error?.message || "Không thể lưu dữ liệu mới lên hệ thống"
      });
    }
  };

  const handleCellEdit = (
    id: string,
    field: keyof Revenue,
    value: any,
    handleCellEditDb: (id: string, field: keyof Revenue, value: any, updatedRevenueFields: Partial<Revenue>) => void
  ) => {
    if (tempRow && id === tempRow.id) {
      handleEditTempRow(id, field, value);
    } else {
      handleCellEditDb(id, field, value, {}); // Pass empty object for now, CrudOps will handle it
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
