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
    updatedFields[field] = value;

    // Create a temporary complete object for calculations
    let tempCalcRevenue: Revenue = { ...currentRevenue, [field]: value };

    if (field === 'unit_price' || field === 'quantity') {
      const newOriginalAmount = (tempCalcRevenue.unit_price || 0) * (tempCalcRevenue.quantity || 0);
      updatedFields.original_amount = newOriginalAmount;
      tempCalcRevenue.original_amount = newOriginalAmount; // Update for subsequent VND calculation
    }
    
    // Check if any field that affects VND revenue has changed
    // This includes direct changes to currency, year, month, or indirect changes via unit_price/quantity (affecting original_amount)
    if (
      field === 'unit_price' || 
      field === 'quantity' || 
      field === 'currency_id' || 
      field === 'year' || 
      field === 'month' ||
      (updatedFields.original_amount !== undefined && updatedFields.original_amount !== currentRevenue.original_amount) // if original_amount changed
    ) {
      const newVndRevenue = calculateVNDRevenue(tempCalcRevenue);
      updatedFields.vnd_revenue = newVndRevenue;
    }

    if (Object.keys(updatedFields).length === 0) return; // No actual changes to save

    try {
      await updateRevenue(id, updatedFields);
      // Optimistic update or refetch
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
      // Optionally, revert optimistic update or call fetchData() to get consistent state
      fetchData();
    }
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
    const { id, created_at, updated_at, ...cloneData } = revenueToClone;
    const now = new Date();
    cloneData.year = now.getFullYear(); // Default to current year/month or let user edit
    cloneData.month = now.getMonth() + 1;

    // Recalculate VND revenue for the cloned entry if its currency/original_amount exists
    if (cloneData.currency_id && cloneData.original_amount !== undefined) {
       cloneData.vnd_revenue = calculateVNDRevenue(cloneData);
    }

    try {
      const created = await createRevenue(cloneData);
      // Insert into local state correctly
      const newRevenues = [...revenues];
      newRevenues.splice(globalIndex + 1, 0, created);
      setRevenues(newRevenues);
      // fetchData(); // Or update locally
      toast({ title: "Đã nhân bản dòng!" });
    } catch (error) {
      // ... error handling
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
