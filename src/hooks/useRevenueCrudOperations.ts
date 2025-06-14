
import { useToast } from "@/hooks/use-toast";
import {
  Revenue,
  createRevenue,
  updateRevenue,
  RevenueSearchParams,
} from "@/services/revenueService";

interface RevenueCalculationsHook {
  getMonthNumber: (monthName: string) => number;
  calculateVNDRevenue: (revenue: Revenue) => number;
}

interface RevenueDataHookControls {
  revenues: Revenue[];
  setRevenues: React.Dispatch<React.SetStateAction<Revenue[]>>;
  fetchData: () => Promise<void>;
  searchParams: RevenueSearchParams;
}

export const useRevenueCrudOperations = (
  revenueDataControls: RevenueDataHookControls,
  revenueCalculations: RevenueCalculationsHook
) => {
  const { toast } = useToast();
  const { revenues, setRevenues, fetchData, searchParams } = revenueDataControls;
  const { getMonthNumber, calculateVNDRevenue } = revenueCalculations;

  const handleCellEdit = async (id: string, field: keyof Revenue, value: any) => {
    try {
      console.log('Editing cell:', { id, field, value });
      const revenueToUpdate = revenues.find((revenue) => revenue.id === id);
      if (!revenueToUpdate) {
        console.error(`Revenue with id ${id} not found`);
        toast({ variant: "destructive", title: `Revenue with id ${id} not found.` });
        return;
      }

      let processedValue = value;
      if (field === 'month' && typeof value === 'string') {
        processedValue = getMonthNumber(value);
      }

      let updatedRevenueData = { ...revenueToUpdate, [field]: processedValue };
      
      if (field === 'unit_price' || field === 'quantity') {
        const unitPrice = field === 'unit_price' ? Number(processedValue) : Number(updatedRevenueData.unit_price || 0);
        const quantity = field === 'quantity' ? Number(processedValue) : Number(updatedRevenueData.quantity || 1);
        updatedRevenueData.original_amount = unitPrice * quantity;
      } else if (field === 'currency_id' || field === 'year' || field === 'month') {
        // If currency, year, or month changes, original_amount might not change directly here
        // but vnd_revenue will, so ensure it's recalculated.
      }


      updatedRevenueData.vnd_revenue = calculateVNDRevenue(updatedRevenueData);
      
      const optimisticUpdateEnabled = true; // Control this if needed
      if (optimisticUpdateEnabled) {
        const updatedRevenuesOptimistic = revenues.map((r) =>
          r.id === id ? updatedRevenueData : r
        );
        setRevenues(updatedRevenuesOptimistic);
      }
      
      const updatePayload: Partial<Revenue> = { 
        [field]: processedValue,
        original_amount: updatedRevenueData.original_amount, // Always send calculated original_amount
        vnd_revenue: updatedRevenueData.vnd_revenue // Always send calculated vnd_revenue
      };
      // If other fields were changed that affect original_amount or vnd_revenue but weren't the primary 'field'
      // ensure they are part of updatePayload or handled by API.
      // Example: changing currency_id should trigger vnd_revenue recalc. This is done above.

      await updateRevenue(id, updatePayload);
      toast({ title: "Revenue record updated successfully!" });
      // fetchData(); // Refetch if optimistic update is not enough or to ensure full consistency.
      // For cell edits, optimistic is usually good. If totals or other parts of app depend on this, refetch.
    } catch (error) {
      console.error("Error updating revenue:", error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem updating the revenue record.",
      });
      fetchData(); // Revert/refetch on error
    }
  };

  const handleAddNewRow = async () => {
    try {
      console.log('Adding new row...');
      const newRevenueData: Omit<Revenue, 'id'> = {
        year: searchParams.year || new Date().getFullYear(),
        month: (searchParams.months && searchParams.months.length > 0 ? searchParams.months[0] : new Date().getMonth() + 1),
        customer_id: null,
        company_id: null,
        division_id: null,
        project_id: null,
        project_type_id: null,
        resource_id: null,
        currency_id: null,
        unit_price: 0,
        quantity: 1,
        original_amount: 0,
        vnd_revenue: 0, // Will be calculated by API or pre-calculated if possible
        notes: null,
        project_name: '',
      };
      
      // Pre-calculate VND revenue if possible (e.g., if default currency is VND or rate is known)
      // For simplicity, assuming API handles initial VND calculation or it defaults to 0.
      
      await createRevenue(newRevenueData);
      toast({ title: "New revenue record added successfully!" });
      fetchData(); 
    } catch (error) {
      console.error("Error adding new revenue:", error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem adding the new revenue record.",
      });
    }
  };

  const handleInsertRowBelow = async (afterIndex: number) => {
    console.log('Inserting row (behaves like Add New):', afterIndex);
    await handleAddNewRow();
  };

  const handleCloneRevenue = async (sourceRevenue: Revenue, afterIndex: number) => {
    try {
      console.log('Cloning revenue (will refetch):', sourceRevenue, 'after visual index:', afterIndex);
      const clonedData: Omit<Revenue, 'id'> = {
        year: sourceRevenue.year,
        month: sourceRevenue.month,
        customer_id: sourceRevenue.customer_id || null,
        company_id: sourceRevenue.company_id || null,
        division_id: sourceRevenue.division_id || null,
        project_id: sourceRevenue.project_id || null,
        project_type_id: sourceRevenue.project_type_id || null,
        resource_id: sourceRevenue.resource_id || null,
        currency_id: sourceRevenue.currency_id || null,
        unit_price: sourceRevenue.unit_price,
        quantity: sourceRevenue.quantity,
        original_amount: sourceRevenue.original_amount,
        vnd_revenue: sourceRevenue.vnd_revenue, // This should be recalculated based on current rates
        notes: sourceRevenue.notes || null,
        project_name: sourceRevenue.project_name || '',
      };
      
      // Recalculate VND revenue for the clone
      clonedData.vnd_revenue = calculateVNDRevenue({...clonedData, id: ''} as Revenue); // Cast as Revenue for calculation

      await createRevenue(clonedData);
      toast({ title: "Revenue record cloned successfully!" });
      fetchData();
    } catch (error) {
      console.error("Error cloning revenue:", error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem cloning the revenue record.",
      });
    }
  };

  return {
    handleCellEdit,
    handleAddNewRow,
    handleInsertRowBelow,
    handleCloneRevenue,
  };
};
