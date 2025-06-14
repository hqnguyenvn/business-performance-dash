import { useToast } from "@/hooks/use-toast";
import { Revenue, updateRevenue, createRevenue, deleteRevenue } from "@/services/revenueService";

interface RevenueDataState {
  revenues: Revenue[];
  setRevenues: React.Dispatch<React.SetStateAction<Revenue[]>>;
  fetchData: () => void;
  searchParams: any; // Adjust as per actual type
}

interface RevenueCalculationHelpers {
  getMonthNumber: (monthName: string) => number;
  calculateVNDRevenue: (revenue: Partial<Revenue>) => number;
}

export const useRevenueCrudOperations = (
  revenueDataState: RevenueDataState,
  calculationHelpers: RevenueCalculationHelpers
) => {
  const { toast } = useToast();
  const { revenues, setRevenues, fetchData } = revenueDataState;
  const { getMonthNumber, calculateVNDRevenue } = calculationHelpers;

  const handleCellEdit = async (id: string, field: keyof Revenue, value: any) => {
    const currentRevenue = revenues.find(r => r.id === id);
    if (!currentRevenue) {
      toast({ variant: "destructive", title: "Không tìm thấy bản ghi" });
      return;
    }

    const updatedFields: Partial<Revenue> = {};

    // Coerce and assign value based on field type
    if (field === 'year' || field === 'month' || field === 'original_amount' || field === 'vnd_revenue') {
        const numValue = parseFloat(String(value));
        updatedFields[field] = isNaN(numValue) ? 0 : numValue;
    } else if (field === 'unit_price' || field === 'quantity') {
        if (value === null || String(value).trim() === '') {
            updatedFields[field] = undefined;
        } else {
            const numValue = parseFloat(String(value));
            updatedFields[field] = isNaN(numValue) ? undefined : numValue;
        }
    } else if (field === 'id') { 
        updatedFields[field] = String(value ?? '');
    } else { 
        if (value === null || value === undefined) {
            updatedFields[field] = undefined;
        } else {
            updatedFields[field] = String(value);
        }
    }
    
    let tempCalcRevenue: Revenue = { ...currentRevenue, ...updatedFields };

    // Recalculate original_amount if unit_price or quantity changed
    if (field === 'unit_price' || field === 'quantity') {
      const calculatedOriginalAmount = (numericOrZero(tempCalcRevenue.unit_price)) * (numericOrZero(tempCalcRevenue.quantity));
      updatedFields.original_amount = Number(calculatedOriginalAmount); // Explicitly cast to number
      tempCalcRevenue.original_amount = Number(calculatedOriginalAmount); // Update for subsequent VND calculation
    }
    
    // Recalculate VND revenue if relevant fields changed
    const fieldsImpactingVnd = ['unit_price', 'quantity', 'currency_id', 'year', 'month', 'original_amount'];
    if (fieldsImpactingVnd.includes(field) || (updatedFields.original_amount !== undefined && updatedFields.original_amount !== currentRevenue.original_amount)) {
      if (updatedFields.original_amount !== undefined) {
        tempCalcRevenue.original_amount = updatedFields.original_amount;
      }
      const calculatedVndRevenue = calculateVNDRevenue(tempCalcRevenue);
      updatedFields.vnd_revenue = Number(calculatedVndRevenue); // Explicitly cast to number
      tempCalcRevenue.vnd_revenue = Number(calculatedVndRevenue); 
    }
    
    // Ensure all calculated fields are part of updatedFields if they changed from currentRevenue
    if (tempCalcRevenue.original_amount !== currentRevenue.original_amount && updatedFields.original_amount === undefined) {
        updatedFields.original_amount = Number(tempCalcRevenue.original_amount);
    }
    if (tempCalcRevenue.vnd_revenue !== currentRevenue.vnd_revenue && updatedFields.vnd_revenue === undefined) {
        updatedFields.vnd_revenue = Number(tempCalcRevenue.vnd_revenue);
    }

    let hasChanges = false;
    for (const key in updatedFields) {
        if (updatedFields.hasOwnProperty(key)) {
            const typedKey = key as keyof Revenue;
            if (updatedFields[typedKey] !== currentRevenue[typedKey]) {
                hasChanges = true;
                break;
            }
        }
    }

    if (Object.keys(updatedFields).length === 0 && !hasChanges) {
      return; 
    }

    try {
      await updateRevenue(id, updatedFields); 
      setRevenues(prevRevenues =>
        prevRevenues.map(r =>
          r.id === id ? { ...r, ...updatedFields } : r
        )
      );
      toast({ title: "Cập nhật thành công!" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Lỗi cập nhật",
        description: error?.message || "Không thể cập nhật dữ liệu.",
      });
      fetchData(); 
    }
  };

  const numericOrZero = (value: any): number => {
    const num = parseFloat(String(value));
    return isNaN(num) ? 0 : num;
  };

  const handleAddNewRow = async (baseRevenue?: Partial<Revenue>) => {
    const now = new Date();
    const newRevenueEntry: Omit<Revenue, "id"> = {
      year: baseRevenue?.year || now.getFullYear(),
      month: baseRevenue?.month || now.getMonth() + 1,
      original_amount: baseRevenue?.original_amount || 0,
      vnd_revenue: baseRevenue?.vnd_revenue || 0, 
      project_name: baseRevenue?.project_name || "",
      customer_id: baseRevenue?.customer_id,
      company_id: baseRevenue?.company_id,
      division_id: baseRevenue?.division_id,
      project_id: baseRevenue?.project_id,
      project_type_id: baseRevenue?.project_type_id,
      resource_id: baseRevenue?.resource_id,
      currency_id: baseRevenue?.currency_id,
      unit_price: baseRevenue?.unit_price,
      quantity: baseRevenue?.quantity,
      notes: baseRevenue?.notes,
    };
    if (newRevenueEntry.currency_id && newRevenueEntry.original_amount !== undefined) {
       newRevenueEntry.vnd_revenue = calculateVNDRevenue(newRevenueEntry);
    }

    try {
      await createRevenue(newRevenueEntry);
      fetchData(); 
      toast({ title: "Đã thêm bản ghi mới!" });
    } catch (error) {
      console.error("Error creating new revenue:", error);
      toast({
        variant: "destructive",
        title: "Lỗi khi thêm mới",
        description: "Không thể tạo bản ghi doanh thu mới.",
      });
    }
  };

  const handleInsertRowBelow = async (globalIndex: number) => {
    const baseRevenue = revenues[globalIndex]; 
    const now = new Date();
    const newRevenueEntry: Omit<Revenue, "id"> = {
      year: baseRevenue?.year || now.getFullYear(),
      month: baseRevenue?.month || now.getMonth() + 1,
      original_amount: 0, 
      vnd_revenue: 0,     
      project_name: "",
    };
    try {
      const created = await createRevenue(newRevenueEntry);
      const newRevenues = [...revenues];
      newRevenues.splice(globalIndex + 1, 0, created);
      setRevenues(newRevenues);
      toast({ title: "Đã chèn dòng mới bên dưới!" });
    } catch (error) {
      toast({ variant: "destructive", title: "Lỗi khi chèn dòng" });
    }
  };

  const handleCloneRevenue = async (revenueToClone: Revenue, globalIndex: number) => {
    const { id, ...cloneDataWithoutId } = revenueToClone; 
    const cloneData = cloneDataWithoutId; 

    const now = new Date();
    cloneData.year = now.getFullYear(); 
    cloneData.month = now.getMonth() + 1;

    if (cloneData.currency_id && cloneData.original_amount !== undefined) {
       cloneData.vnd_revenue = calculateVNDRevenue(cloneData);
    }

    try {
      const created = await createRevenue(cloneData);
      const newRevenues = [...revenues];
      newRevenues.splice(globalIndex + 1, 0, created);
      setRevenues(newRevenues);
      toast({ title: "Đã nhân bản dòng!" });
    } catch (error) {
      toast({ variant: "destructive", title: "Lỗi khi nhân bản dòng" });
    }
  };

  return {
    handleCellEdit,
    handleAddNewRow,
    handleInsertRowBelow,
    handleCloneRevenue,
  };
};
