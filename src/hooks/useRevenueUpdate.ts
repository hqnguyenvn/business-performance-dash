
import { useToast } from "@/hooks/use-toast";
import { Revenue, updateRevenue } from "@/services/revenueService";

interface RevenueDataState {
  revenues: Revenue[];
  setRevenues: React.Dispatch<React.SetStateAction<Revenue[]>>;
  fetchData: () => void;
}

interface CalculationHelpers {
  calculateVNDRevenue: (revenue: Partial<Revenue>) => number;
}

const numericOrZero = (value: any): number => {
    const num = parseFloat(String(value));
    return isNaN(num) ? 0 : num;
};

function getUpdatedFields(
    currentRevenue: Revenue,
    field: keyof Revenue,
    value: any,
    calculateVNDRevenue: (revenue: Partial<Revenue>) => number
): Partial<Revenue> {
    const updatedFields: Partial<Revenue> = {};

    // Coerce and assign value based on field type, using 'any' locally to bypass complex TS issues with dynamic keys.
    if (field === 'year' || field === 'month' || field === 'original_amount' || field === 'vnd_revenue') {
        const numValue = parseFloat(String(value));
        (updatedFields as any)[field] = isNaN(numValue) ? 0 : numValue;
    } else if (field === 'unit_price' || field === 'quantity') {
        if (value === null || String(value).trim() === '') {
            (updatedFields as any)[field] = undefined;
        } else {
            const numValue = parseFloat(String(value));
            (updatedFields as any)[field] = isNaN(numValue) ? undefined : numValue;
        }
    } else if (field === 'id') { 
        (updatedFields as any)[field] = String(value ?? '');
    } else { 
        if (value === null || value === undefined) {
            (updatedFields as any)[field] = undefined;
        } else {
            (updatedFields as any)[field] = String(value);
        }
    }
    
    let tempCalcRevenue: Revenue = { ...currentRevenue, ...updatedFields };

    if (field === 'unit_price' || field === 'quantity') {
      const calculatedOriginalAmount = numericOrZero(tempCalcRevenue.unit_price) * numericOrZero(tempCalcRevenue.quantity);
      updatedFields.original_amount = Number(calculatedOriginalAmount);
      tempCalcRevenue.original_amount = Number(calculatedOriginalAmount);
    }
    
    const fieldsImpactingVnd = ['unit_price', 'quantity', 'currency_id', 'year', 'month', 'original_amount'];
    if (fieldsImpactingVnd.includes(field) || (updatedFields.original_amount !== undefined && updatedFields.original_amount !== currentRevenue.original_amount)) {
      if (updatedFields.original_amount !== undefined) {
        tempCalcRevenue.original_amount = updatedFields.original_amount;
      }
      const calculatedVndRevenue = calculateVNDRevenue(tempCalcRevenue);
      updatedFields.vnd_revenue = Number(calculatedVndRevenue);
      tempCalcRevenue.vnd_revenue = Number(calculatedVndRevenue); 
    }
    
    if (tempCalcRevenue.original_amount !== currentRevenue.original_amount && updatedFields.original_amount === undefined) {
        updatedFields.original_amount = Number(tempCalcRevenue.original_amount);
    }
    if (tempCalcRevenue.vnd_revenue !== currentRevenue.vnd_revenue && updatedFields.vnd_revenue === undefined) {
        updatedFields.vnd_revenue = Number(tempCalcRevenue.vnd_revenue);
    }

    const finalUpdatedFields: Partial<Revenue> = {};
    for (const key in updatedFields) {
        if (Object.prototype.hasOwnProperty.call(updatedFields, key)) {
            const typedKey = key as keyof Revenue;
            if (updatedFields[typedKey] !== currentRevenue[typedKey]) {
                (finalUpdatedFields as any)[typedKey] = updatedFields[typedKey];
            }
        }
    }

    return finalUpdatedFields;
}


export const useRevenueUpdate = (
  revenueDataState: RevenueDataState,
  calculationHelpers: CalculationHelpers
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

    const updatedFields = getUpdatedFields(currentRevenue, field, value, calculateVNDRevenue);

    if (Object.keys(updatedFields).length === 0) {
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

  return { handleCellEdit };
};
