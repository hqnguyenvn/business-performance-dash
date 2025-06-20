
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ParameterValues {
  taxRate: number;
  bonusRate: number;
  loading: boolean;
}

export const useParameterValues = (year?: number): ParameterValues => {
  const { toast } = useToast();
  const [taxRate, setTaxRate] = useState<number>(5); // Default fallback
  const [bonusRate, setBonusRate] = useState<number>(15); // Default fallback
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchParameterValues = async () => {
      try {
        setLoading(true);
        
        const currentYear = year || new Date().getFullYear();
        
        const { data, error } = await supabase
          .from('parameter')
          .select('code, value')
          .eq('year', currentYear)
          .in('code', ['Tax', 'Bonus']);

        if (error) {
          console.error('Error fetching parameters:', error);
          toast({
            variant: "destructive",
            title: "Lỗi lấy dữ liệu",
            description: "Không thể lấy thông số từ database. Sử dụng giá trị mặc định.",
          });
          return;
        }

        if (data && data.length > 0) {
          data.forEach(param => {
            if (param.code === 'Tax') {
              // Convert from decimal (0.05) to percentage (5)
              setTaxRate(param.value * 100);
            } else if (param.code === 'Bonus') {
              // Convert from decimal (0.15) to percentage (15)
              setBonusRate(param.value * 100);
            }
          });
        }
      } catch (error) {
        console.error('Error in fetchParameterValues:', error);
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Có lỗi xảy ra khi lấy thông số. Sử dụng giá trị mặc định.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchParameterValues();
  }, [year, toast]);

  return {
    taxRate,
    bonusRate,
    loading
  };
};
