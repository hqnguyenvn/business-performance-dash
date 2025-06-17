
import { useState } from "react";
import { Revenue } from "@/types/revenue";
import { createRevenue } from "@/services/revenueApi";
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
    
    const numericValue = (val: any): number => {
        const num = parseFloat(String(val));
        return isNaN(num) ? 0 : num;
    };

    // Calculate original_amount if unit_price or quantity changed
    if (field === 'unit_price' || field === 'quantity') {
        const unitPrice = (field === 'unit_price') ? numericValue(value) : numericValue(updatedTempRow.unit_price);
        const quantity = (field === 'quantity') ? numericValue(value) : numericValue(updatedTempRow.quantity);
        updatedTempRow.original_amount = unitPrice * quantity;
    }

    // Determine if VND revenue needs recalculation
    const fieldsImpactingVndDirectly: (keyof Revenue)[] = ['currency_id', 'year', 'month'];
    let needsVndRecalculation = fieldsImpactingVndDirectly.includes(field);

    // Also recalculate if unit_price or quantity changed (as they affect original_amount, which affects VND revenue)
    if (field === 'unit_price' || field === 'quantity') {
        needsVndRecalculation = true;
    }
    
    if (needsVndRecalculation) {
        // Ensure original_amount is up-to-date in updatedTempRow before calculating VND revenue
        if (field !== 'original_amount') { // if original_amount was not the field being edited directly
             const currentUnitPrice = numericValue(updatedTempRow.unit_price);
             const currentQuantity = numericValue(updatedTempRow.quantity);
             if (field === 'unit_price' || field === 'quantity') { // if one of them just changed
                updatedTempRow.original_amount = currentUnitPrice * currentQuantity;
             } else if (tempRow.original_amount === undefined) { // ensure it has a value if it was undefined
                updatedTempRow.original_amount = currentUnitPrice * currentQuantity;
             }
        }
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
        vnd_revenue: calculateVNDRevenue(toCreate), // Recalculate one last time
        project_name: toCreate.project_name || "",
        customer_id: toCreate.customer_id || undefined,
        company_id: toCreate.company_id || undefined,
        division_id: toCreate.division_id || undefined,
        project_id: toCreate.project_id || undefined,
        project_type_id: toCreate.project_type_id || undefined,
        resource_id: toCreate.resource_id || undefined,
        currency_id: toCreate.currency_id || undefined,
        unit_price: typeof toCreate.unit_price === 'number' ? toCreate.unit_price : undefined,
        quantity: typeof toCreate.quantity === 'number' ? toCreate.quantity : undefined,
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
