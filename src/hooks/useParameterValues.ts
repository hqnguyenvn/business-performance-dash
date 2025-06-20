
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
        
        console.log('');
        console.log('🔍 PARAMETER VALUES HOOK DEBUG - START');
        console.log('===========================================');
        console.log('📅 Query Year:', currentYear);
        console.log('🎯 Query Codes:', ['Tax', 'Bonus']);
        
        const { data, error } = await supabase
          .from('parameter')
          .select('code, value')
          .eq('year', currentYear)
          .in('code', ['Tax', 'Bonus']);
          
        console.log('');
        console.log('📊 RAW QUERY RESULT:');
        console.log('   ✅ Data:', JSON.stringify(data, null, 2));
        console.log('   ❌ Error:', error);
        console.log('   📏 Data length:', data?.length || 0);

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
          console.log('');
          console.log('🔍 PROCESSING PARAMETERS:');
          console.log('========================');
          
          let foundTax = false;
          let foundBonus = false;
          
          data.forEach(param => {
            console.log(`⚙️ Processing: ${param.code} = ${param.value} (type: ${typeof param.value})`);
            
            if (param.code === 'Tax') {
              setTaxRate(param.value);
              foundTax = true;
              console.log(`   💸 ✅ Tax Rate SET to: ${param.value} (${param.value * 100}%)`);
            } else if (param.code === 'Bonus') {
              setBonusRate(param.value);
              foundBonus = true;
              console.log(`   🎁 ✅ Bonus Rate SET to: ${param.value} (${param.value * 100}%)`);
            }
          });
          
          console.log('');
          console.log('📋 PARAMETER FOUND STATUS:');
          console.log(`   💸 Tax found: ${foundTax}`);
          console.log(`   🎁 Bonus found: ${foundBonus}`);
          
          // Set fallbacks for missing parameters
          if (!foundTax) {
            console.log('   ⚠️ Tax not found, using fallback: 0.05');
            setTaxRate(0.05);
          }
          if (!foundBonus) {
            console.log('   ⚠️ Bonus not found, using fallback: 0.15');
            setBonusRate(0.15);
          }
        } else {
          console.log('');
          console.log('⚠️ NO PARAMETER DATA FOUND');
          console.log('=========================');
          console.log('Using fallback defaults:');
          console.log('   💸 Tax Rate: 0.05 (5%)');
          console.log('   🎁 Bonus Rate: 0.15 (15%)');
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

  // Final state logging
  const finalTaxRate = taxRate ?? 0.05;
  const finalBonusRate = bonusRate ?? 0.15;
  
  if (!loading) {
    console.log('');
    console.log('🎯 FINAL PARAMETER VALUES RETURNED:');
    console.log('==================================');
    console.log(`   💸 Final Tax Rate: ${finalTaxRate} (${finalTaxRate * 100}%)`);
    console.log(`   🎁 Final Bonus Rate: ${finalBonusRate} (${finalBonusRate * 100}%)`);
    console.log('   📊 Loading:', loading);
    console.log('🔍 PARAMETER VALUES HOOK DEBUG - END');
    console.log('=========================================');
    console.log('');
  }

  return {
    taxRate: finalTaxRate,
    bonusRate: finalBonusRate,
    loading
  };
};
