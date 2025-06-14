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
    } else if (field === 'id') { // Required string fields
        updatedFields[field] = String(value ?? ''); // Should not be undefined
    } else { // Optional string fields (customer_id, company_id, ..., notes, project_name, currency_id)
        if (value === null || value === undefined) {
            updatedFields[field] = undefined;
        } else {
            updatedFields[field] = String(value);
        }
    }
    
    // Create a temporary complete object for calculations
    // Important: Use a fresh copy of currentRevenue and merge changes from updatedFields
    // This ensures that if a field was not directly edited but is part of updatedFields (e.g. due to earlier logic if any), it's used.
    // However, the above assignments directly to updatedFields[field] should be sufficient for the direct edit.
    let tempCalcRevenue: Revenue = { ...currentRevenue, ...updatedFields };

    // Recalculate original_amount if unit_price or quantity changed
    if (field === 'unit_price' || field === 'quantity') {
      const newOriginalAmount = (numericOrZero(tempCalcRevenue.unit_price)) * (numericOrZero(tempCalcRevenue.quantity));
      updatedFields.original_amount = newOriginalAmount;
      tempCalcRevenue.original_amount = newOriginalAmount; // Update for subsequent VND calculation
    }
    
    // Recalculate VND revenue if relevant fields changed
    const fieldsImpactingVnd = ['unit_price', 'quantity', 'currency_id', 'year', 'month', 'original_amount'];
    if (fieldsImpactingVnd.includes(field) || (updatedFields.original_amount !== undefined && updatedFields.original_amount !== currentRevenue.original_amount)) {
      // Ensure original_amount is current in tempCalcRevenue before calculating VND revenue
      // This is important if original_amount was just calculated and set in updatedFields
      if (updatedFields.original_amount !== undefined) {
        tempCalcRevenue.original_amount = updatedFields.original_amount;
      }
      const newVndRevenue = calculateVNDRevenue(tempCalcRevenue);
      updatedFields.vnd_revenue = newVndRevenue;
      tempCalcRevenue.vnd_revenue = newVndRevenue; 
    }
    
    // Ensure all calculated fields are part of updatedFields if they changed from currentRevenue
    // (original_amount might have been set above, this is more of a safeguard or for other calculated fields if any)
    if (tempCalcRevenue.original_amount !== currentRevenue.original_amount && updatedFields.original_amount === undefined) {
        updatedFields.original_amount = tempCalcRevenue.original_amount;
    }
    if (tempCalcRevenue.vnd_revenue !== currentRevenue.vnd_revenue && updatedFields.vnd_revenue === undefined) {
        updatedFields.vnd_revenue = tempCalcRevenue.vnd_revenue;
    }

    // If no actual changes were made (e.g. user entered same value, or calculations resulted in same values)
    // This check needs to compare updatedFields against currentRevenue for relevant keys in updatedFields
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
    if (!hasChanges && Object.keys(updatedFields).length > 0) { // if updatedFields has keys but values are same as currentRevenue
        // This can happen if user "edits" a cell but puts the same value back.
        // We might still want to proceed if some other logic depends on it, or toast "No changes made".
        // For now, let's proceed if there are any keys in updatedFields, as some calculation might have occurred.
        // A more refined check would be if the final updatedFields object is actually different.
    }


    if (Object.keys(updatedFields).length === 0 && !hasChanges) { // Stricter check: if no keys or no effective changes
      // toast({ title: "No changes detected." }); // Optional: inform user
      return; 
    }

    try {
      await updateRevenue(id, updatedFields); // Pass only the changed fields
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
      fetchData(); // Re-fetch to revert optimistic update on error
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
