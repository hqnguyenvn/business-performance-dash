
import { useToast } from "@/hooks/use-toast";
import { Revenue, createRevenue } from "@/services/revenueService";

interface RevenueDataState {
  revenues: Revenue[];
  setRevenues: React.Dispatch<React.SetStateAction<Revenue[]>>;
  fetchData: () => void;
}

interface CalculationHelpers {
  calculateVNDRevenue: (revenue: Partial<Revenue>) => number;
}

export const useRevenueCreation = (
  revenueDataState: RevenueDataState,
  calculationHelpers: CalculationHelpers
) => {
  const { toast } = useToast();
  const { revenues, setRevenues, fetchData } = revenueDataState;
  const { calculateVNDRevenue } = calculationHelpers;

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
    handleAddNewRow,
    handleInsertRowBelow,
    handleCloneRevenue,
  };
};
