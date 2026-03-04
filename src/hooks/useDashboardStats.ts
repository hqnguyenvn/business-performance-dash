import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getConvertFactor, getBusinessDays } from "@/types/employee";

interface DashboardStatsArgs {
  year: number;
  months: number[];
  incomeTaxRate: number;
  bonusRate: number;
}
export interface StatWithChange {
  value: number;
  prevValue: number | null;
  percentChange: number | null;
}
export interface DashboardStats {
  totalRevenue: StatWithChange;
  totalCost: StatWithChange;
  grossProfit: StatWithChange;
  netProfit: StatWithChange;
  customerCount: StatWithChange;
  devEE: StatWithChange;
  devEEBMM: number;
  devEECMM: number;
  ee: StatWithChange;
  eeBMM: number;
  eeCMM: number;
  overheadRatio: StatWithChange;
  loading: boolean;
}

function getPreviousPeriod(year: number, months: number[]): { prevYear: number, prevMonths: number[] } | null {
  if (months.length === 0) return null;
  return { prevYear: year - 1, prevMonths: [...months] };
}

export function useDashboardStats({
  year,
  months,
  incomeTaxRate,
  bonusRate,
}: DashboardStatsArgs): DashboardStats {
  const [initialLoading, setInitialLoading] = useState(true);
  const [revenues, setRevenues] = useState<any[]>([]);
  const [costs, setCosts] = useState<any[]>([]);
  const [costTypes, setCostTypes] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [prevRevenues, setPrevRevenues] = useState<any[]>([]);
  const [prevCosts, setPrevCosts] = useState<any[]>([]);
  const [prevEmployees, setPrevEmployees] = useState<any[]>([]);

  const prevPeriod = useMemo(() => getPreviousPeriod(year, months), [year, months]);

  useEffect(() => {
    async function fetchData() {
      const queries: any[] = [
        supabase.from("revenues").select("*").in("year", [year]).in("month", months),
        supabase.from("costs").select("*").in("year", [year]).in("month", months),
        supabase.from("cost_types").select("id, code"),
        supabase.from("employees").select("*").eq("year", year).in("month", months),
      ];
      if (prevPeriod) {
        queries.push(
          supabase.from("revenues").select("*").eq("year", prevPeriod.prevYear).in("month", prevPeriod.prevMonths),
          supabase.from("costs").select("*").eq("year", prevPeriod.prevYear).in("month", prevPeriod.prevMonths),
          supabase.from("employees").select("*").eq("year", prevPeriod.prevYear).in("month", prevPeriod.prevMonths),
        );
      }

      const results = await Promise.all(queries);

      setRevenues(results[0]?.data || []);
      setCosts(results[1]?.data || []);
      setCostTypes(results[2]?.data || []);
      setEmployees(results[3]?.data || []);
      if (prevPeriod) {
        setPrevRevenues(results[4]?.data || []);
        setPrevCosts(results[5]?.data || []);
        setPrevEmployees(results[6]?.data || []);
      } else {
        setPrevRevenues([]);
        setPrevCosts([]);
        setPrevEmployees([]);
      }
      setInitialLoading(false);
    }
    fetchData();
  }, [year, months.join(","), incomeTaxRate, bonusRate]);

  function calcStats(revenuesArr: any[], costsArr: any[], costTypesArr: any[], employeesArr: any[], statYear: number) {
    const totalRevenue = revenuesArr.reduce((sum, r) => sum + (r.vnd_revenue || 0), 0);

    const salaryType = costTypesArr.find((ct: any) => ct.code?.toLowerCase() === "salary");
    const salaryCostTypeId = salaryType?.id;

    const baseCost = costsArr.reduce((sum, c) => sum + (c.cost || 0), 0);

    let bonus = 0;
    const monthsArr = Array.from(new Set(costsArr.map(c => c.month)));
    monthsArr.forEach((m) => {
      const monthlySalary = costsArr
        .filter((c) => c.cost_type === salaryCostTypeId && c.month === m)
        .reduce((sum, c) => sum + (c.cost || 0), 0);
      bonus += monthlySalary * (bonusRate / 100);
    });
    const grossProfit = totalRevenue - baseCost;
    const incomeTax = grossProfit > 0 ? grossProfit * (incomeTaxRate / 100) : 0;
    const totalCost = baseCost + bonus + incomeTax;
    const netProfit = totalRevenue - totalCost;

    const customerSet = new Set<string>();
    for (const row of revenuesArr) {
      if (row.customer_id) customerSet.add(row.customer_id);
    }
    const customerCount = customerSet.size;

    // EE = BMM / CMM
    const totalBMM = revenuesArr.reduce((sum, r) => sum + (r.quantity || 0), 0);
    let totalCMM = 0;
    let devCMM = 0;
    let totalCWD = 0;
    let overheadCWD = 0;
    for (const emp of employeesArr) {
      const convertFactor = getConvertFactor(emp.type);
      const cwd = (emp.working_day || 0) * convertFactor;
      totalCWD += cwd;
      if ((emp.category || "").toLowerCase() === "overhead") {
        overheadCWD += cwd;
      }
      const bizDays = getBusinessDays(emp.year || statYear, emp.month);
      if (bizDays > 0) {
        const empCMM = cwd / bizDays;
        totalCMM += empCMM;
        if ((emp.category || "").toLowerCase() === "development") {
          devCMM += empCMM;
        }
      }
    }
    const ee = totalCMM > 0 ? totalBMM / totalCMM : 0;
    const devEE = devCMM > 0 ? totalBMM / devCMM : 0;
    const overheadRatio = totalCWD > 0 ? overheadCWD / totalCWD : 0;

    return { totalRevenue, totalCost, grossProfit, netProfit, customerCount, ee, totalBMM, totalCMM, devEE, devCMM, overheadRatio };
  }

  const stats = useMemo(() => {
    if (initialLoading) {
      return {
        totalRevenue: { value: 0, prevValue: null, percentChange: null },
        totalCost: { value: 0, prevValue: null, percentChange: null },
        grossProfit: { value: 0, prevValue: null, percentChange: null },
        netProfit: { value: 0, prevValue: null, percentChange: null },
        customerCount: { value: 0, prevValue: null, percentChange: null },
        devEE: { value: 0, prevValue: null, percentChange: null },
        devEEBMM: 0,
        devEECMM: 0,
        ee: { value: 0, prevValue: null, percentChange: null },
        eeBMM: 0,
        eeCMM: 0,
        overheadRatio: { value: 0, prevValue: null, percentChange: null },
        loading: true,
      };
    }

    const nowStats = calcStats(revenues, costs, costTypes, employees, year);
    const prevStats = prevPeriod && (prevRevenues.length + prevCosts.length + prevEmployees.length > 0)
      ? calcStats(prevRevenues, prevCosts, costTypes, prevEmployees, prevPeriod.prevYear)
      : null;

    function percentChange(current: number, prev: number | null): number | null {
      if (prev === null || prev === 0) return null;
      return ((current - prev) / Math.abs(prev)) * 100;
    }

    return {
      totalRevenue: {
        value: nowStats.totalRevenue,
        prevValue: prevStats ? prevStats.totalRevenue : null,
        percentChange: percentChange(nowStats.totalRevenue, prevStats ? prevStats.totalRevenue : null),
      },
      totalCost: {
        value: nowStats.totalCost,
        prevValue: prevStats ? prevStats.totalCost : null,
        percentChange: percentChange(nowStats.totalCost, prevStats ? prevStats.totalCost : null),
      },
      grossProfit: {
        value: nowStats.grossProfit,
        prevValue: prevStats ? prevStats.grossProfit : null,
        percentChange: percentChange(nowStats.grossProfit, prevStats ? prevStats.grossProfit : null),
      },
      netProfit: {
        value: nowStats.netProfit,
        prevValue: prevStats ? prevStats.netProfit : null,
        percentChange: percentChange(nowStats.netProfit, prevStats ? prevStats.netProfit : null),
      },
      customerCount: {
        value: nowStats.customerCount,
        prevValue: prevStats ? prevStats.customerCount : null,
        percentChange: percentChange(nowStats.customerCount, prevStats ? prevStats.customerCount : null),
      },
      devEE: {
        value: nowStats.devEE,
        prevValue: prevStats ? prevStats.devEE : null,
        percentChange: percentChange(nowStats.devEE, prevStats ? prevStats.devEE : null),
      },
      devEEBMM: nowStats.totalBMM,
      devEECMM: nowStats.devCMM,
      ee: {
        value: nowStats.ee,
        prevValue: prevStats ? prevStats.ee : null,
        percentChange: percentChange(nowStats.ee, prevStats ? prevStats.ee : null),
      },
      eeBMM: nowStats.totalBMM,
      eeCMM: nowStats.totalCMM,
      overheadRatio: {
        value: nowStats.overheadRatio,
        prevValue: prevStats ? prevStats.overheadRatio : null,
        percentChange: percentChange(nowStats.overheadRatio, prevStats ? prevStats.overheadRatio : null),
      },
      loading: false,
    };
  }, [
    revenues, costs, costTypes, employees, initialLoading,
    bonusRate, incomeTaxRate, months, year,
    prevPeriod, prevRevenues, prevCosts, prevEmployees,
  ]);

  return stats;
}
