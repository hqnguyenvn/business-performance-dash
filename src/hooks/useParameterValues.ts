
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
  const [taxRate, setTaxRate] = useState<number>(0.05); // Default fallback
  const [bonusRate, setBonusRate] = useState<number>(0.15); // Default fallback
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchParameterValues = async () => {
      try {
        setLoading(true);
        
        const currentYear = year || new Date().getFullYear();
        
        console.log('🔍 QUERYING PARAMETERS:');
        console.log('   📅 Year:', currentYear);
        console.log('   🎯 Codes:', ['Tax', 'Bonus']);
        
        const { data, error } = await supabase
          .from('parameter')
          .select('code, value')
          .eq('year', currentYear)
          .in('code', ['Tax', 'Bonus']);
          
        console.log('📊 QUERY RESULT:');
        console.log('   ✅ Data:', data);
        console.log('   ❌ Error:', error);

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
          console.log('🔍 PARAMETER HOOK DEBUG:');
          console.log('   📅 Year:', currentYear);
          console.log('   📊 Raw parameter data:', data);
          
          data.forEach(param => {
            console.log(`   ⚙️ Processing parameter: ${param.code} = ${param.value}`);
            if (param.code === 'Tax') {
              // Keep as decimal (0.05)
              setTaxRate(param.value);
              console.log(`   💸 Tax Rate set to: ${param.value}`);
            } else if (param.code === 'Bonus') {
              // Keep as decimal (0.15)
              setBonusRate(param.value);
              console.log(`   🎁 Bonus Rate set to: ${param.value} (${param.value * 100}%)`);
            }
          });
        } else {
          console.log('⚠️ No parameter data found, using defaults');
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
