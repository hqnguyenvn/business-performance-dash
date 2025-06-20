
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
  const [taxRate, setTaxRate] = useState<number | null>(null); // Will be set from database
  const [bonusRate, setBonusRate] = useState<number | null>(null); // Will be set from database
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
          // Set fallback values when database error occurs
          setTaxRate(0.05); // 5% fallback
          setBonusRate(0.15); // 15% fallback
          return;
        }

        if (data && data.length > 0) {
          let foundTax = false;
          let foundBonus = false;
          
          data.forEach(param => {
            if (param.code === 'Tax') {
              setTaxRate(param.value);
              foundTax = true;
            } else if (param.code === 'Bonus') {
              setBonusRate(param.value);
              foundBonus = true;
            }
          });
          
          // Set fallbacks for missing parameters
          if (!foundTax) {
            setTaxRate(0.05);
          }
          if (!foundBonus) {
            setBonusRate(0.15);
          }
        } else {
          setTaxRate(0.05);
          setBonusRate(0.15);
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
    taxRate: taxRate ?? 0.05,
    bonusRate: bonusRate ?? 0.15,
    loading
  };
};
