import { useToast } from "@/hooks/use-toast";
import { Revenue, updateRevenue, createRevenue, deleteRevenue } from "@/services/revenueService"; // Assuming createRevenue, deleteRevenue might be used by other functions here

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
  const { calculateVNDRevenue } = calculationHelpers;

  const handleCellEdit = async (id: string, field: keyof Revenue, value: any) => {
    const currentRevenue = revenues.find(r => r.id === id);
    if (!currentRevenue) {
      toast({ variant: "destructive", title: "Không tìm thấy bản ghi" });
      return;
    }

    const updatedFields: Partial<Revenue> = {};
    let processedValue = value;

    // Coerce to number for numeric fields, handling potential NaN or empty strings
    if (field === 'year' || field === 'month' || field === 'original_amount' || field === 'vnd_revenue') {
        processedValue = parseFloat(String(value));
        if (isNaN(processedValue)) processedValue = 0; // Default to 0 for required numbers if NaN
    } else if (field === 'unit_price' || field === 'quantity') {
        if (value === null || String(value).trim() === '') {
            processedValue = undefined; // Optional numeric fields can be undefined
        } else {
            processedValue = parseFloat(String(value));
            if (isNaN(processedValue)) processedValue = undefined; // Or some other default like 0
        }
    }
    
    updatedFields[field] = processedValue;


    // Create a temporary complete object for calculations
    let tempCalcRevenue: Revenue = { ...currentRevenue, ...updatedFields }; // Spread updatedFields to include all changes

    if (field === 'unit_price' || field === 'quantity') {
      const newOriginalAmount = (numericOrZero(tempCalcRevenue.unit_price)) * (numericOrZero(tempCalcRevenue.quantity));
      updatedFields.original_amount = newOriginalAmount;
      tempCalcRevenue.original_amount = newOriginalAmount; // Update for subsequent VND calculation
    }
    
    if (
      field === 'unit_price' || 
      field === 'quantity' || 
      field === 'currency_id' || 
      field === 'year' || 
      field === 'month' ||
      (updatedFields.original_amount !== undefined && updatedFields.original_amount !== currentRevenue.original_amount)
    ) {
      const newVndRevenue = calculateVNDRevenue(tempCalcRevenue);
      updatedFields.vnd_revenue = newVndRevenue;
      tempCalcRevenue.vnd_revenue = newVndRevenue; // ensure tempCalcRevenue has the latest
    }
    
    // Ensure all calculated fields are part of updatedFields if they changed
    if (tempCalcRevenue.original_amount !== currentRevenue.original_amount) {
        updatedFields.original_amount = tempCalcRevenue.original_amount;
    }
    if (tempCalcRevenue.vnd_revenue !== currentRevenue.vnd_revenue) {
        updatedFields.vnd_revenue = tempCalcRevenue.vnd_revenue;
    }


    if (Object.keys(updatedFields).length === 0) return; 

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
      vnd_revenue: baseRevenue?.vnd_revenue || 0, // Will be recalculated if currency changes
      project_name: baseRevenue?.project_name || "",
      // ... other fields from baseRevenue or defaults
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
    // Recalculate VND revenue based on the new/cloned entry if currency is set
    if (newRevenueEntry.currency_id && newRevenueEntry.original_amount !== undefined) {
       newRevenueEntry.vnd_revenue = calculateVNDRevenue(newRevenueEntry);
    }

    try {
      await createRevenue(newRevenueEntry);
      fetchData(); // Refresh data
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
    const baseRevenue = revenues[globalIndex]; // Assuming globalIndex maps correctly
    const now = new Date();
    const newRevenueEntry: Omit<Revenue, "id"> = {
      year: baseRevenue?.year || now.getFullYear(),
      month: baseRevenue?.month || now.getMonth() + 1,
      original_amount: 0, // Default for new row
      vnd_revenue: 0,     // Default for new row
      project_name: "",
      // All other fields null or undefined to represent an empty new row
    };
    try {
      const created = await createRevenue(newRevenueEntry);
      // Insert into local state correctly
      const newRevenues = [...revenues];
      newRevenues.splice(globalIndex + 1, 0, created);
      setRevenues(newRevenues);
      // fetchData(); // Or update locally for faster UI response
      toast({ title: "Đã chèn dòng mới bên dưới!" });
    } catch (error) {
      // ... error handling
      toast({ variant: "destructive", title: "Lỗi khi chèn dòng" });

    }
  };

  const handleCloneRevenue = async (revenueToClone: Revenue, globalIndex: number) => {
    // Remove id, created_at, and updated_at for cloning
    // The Revenue type doesn't have created_at/updated_at, so we only destructure id.
    const { id, ...cloneDataWithoutId } = revenueToClone; 
    const cloneData = cloneDataWithoutId; // Alias for clarity

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
