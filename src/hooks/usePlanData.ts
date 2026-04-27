import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import type { AnnualPlan } from "@/types/plan";
import {
  getPlans,
  createPlan,
  updatePlan,
  deletePlan,
} from "@/services/planService";
import { companiesService, currenciesService, type MasterData } from "@/services/masterDataService";

export function usePlanData() {
  const { toast } = useToast();
  const [plans, setPlans] = useState<AnnualPlan[]>([]);
  const [companies, setCompanies] = useState<MasterData[]>([]);
  const [currencies, setCurrencies] = useState<MasterData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [planResp, companyData, currencyData] = await Promise.all([
        getPlans({ pageSize: "all" }),
        companiesService.getAll(),
        currenciesService.getAll(),
      ]);
      setPlans(planResp.data);
      setCompanies(companyData);
      setCurrencies(currencyData);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load plan data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCellEdit = useCallback(
    async (id: string, field: keyof AnnualPlan, value: string | number | null) => {
      const oldItem = plans.find((p) => p.id === id);
      if (!oldItem) return;

      // Optimistic update
      setPlans((prev) =>
        prev.map((p) => (p.id === id ? { ...p, [field]: value as never } : p)),
      );

      try {
        const isTmp = id.startsWith("tmp-");
        if (!isTmp) {
          await updatePlan(id, { [field]: value } as Partial<AnnualPlan>);
          toast({ title: "Saved", description: "Plan updated." });
        } else {
          // Promote temp row to real on first edit if required fields are set
          const updated = { ...oldItem, [field]: value as never };
          if (
            updated.year &&
            updated.month &&
            updated.company_id
          ) {
            const { id: _id, created_at, updated_at, ...toCreate } = updated;
            const created = await createPlan(toCreate);
            setPlans((prev) => prev.map((p) => (p.id === id ? created : p)));
            toast({ title: "Created", description: "New plan added." });
          }
        }
      } catch (err: any) {
        // Revert
        setPlans((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, [field]: oldItem[field] as never } : p,
          ),
        );
        toast({
          title: "Error",
          description: err?.message || "Failed to save plan.",
          variant: "destructive",
        });
      }
    },
    [plans, toast],
  );

  const addNewItem = useCallback(
    (year?: number, month?: number) => {
      const now = new Date();
      const useYear = year ?? now.getFullYear();
      const useMonth = month ?? now.getMonth() + 1;
      const vnd = currencies.find((c) => c.code.toUpperCase() === "VND");
      const newItem: AnnualPlan = {
        id: "tmp-" + Date.now() + Math.random().toString(36).slice(2, 6),
        year: useYear,
        month: useMonth,
        company_id: "",
        bmm: 0,
        revenue: 0,
        currency_id: vnd?.id || null,
        notes: "",
      };
      setPlans((prev) => [newItem, ...prev]);
    },
    [currencies],
  );

  const addRowBelow = useCallback(
    (index: number) => {
      const now = new Date();
      const vnd = currencies.find((c) => c.code.toUpperCase() === "VND");
      const newItem: AnnualPlan = {
        id: "tmp-" + Date.now() + Math.random().toString(36).slice(2, 6),
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        company_id: "",
        bmm: 0,
        revenue: 0,
        currency_id: vnd?.id || null,
        notes: "",
      };
      setPlans((prev) => {
        const next = [...prev];
        next.splice(index + 1, 0, newItem);
        return next;
      });
    },
    [currencies],
  );

  const deleteItem = useCallback(
    async (id: string) => {
      try {
        if (!id.startsWith("tmp-")) {
          await deletePlan(id);
        }
        setPlans((prev) => prev.filter((p) => p.id !== id));
        toast({ title: "Deleted", description: "Plan deleted." });
      } catch (err: any) {
        toast({
          title: "Error",
          description: err?.message || "Failed to delete plan.",
          variant: "destructive",
        });
      }
    },
    [toast],
  );

  const cloneData = useCallback(
    async (
      sourceYear: number,
      sourceMonth: number,
      targetYear: number,
      targetMonth: number,
    ) => {
      try {
        const sourcePlans = plans.filter(
          (p) =>
            p.year === sourceYear &&
            p.month === sourceMonth &&
            !p.id.startsWith("tmp-"),
        );
        if (sourcePlans.length === 0) {
          toast({
            title: "No data",
            description: "No plans found for the source month.",
            variant: "destructive",
          });
          return;
        }
        const results = await Promise.allSettled(
          sourcePlans.map((p) => {
            const { id, created_at, updated_at, ...rest } = p;
            return createPlan({
              ...rest,
              year: targetYear,
              month: targetMonth,
            });
          }),
        );
        const created = results.filter((r) => r.status === "fulfilled").length;
        const failed = results.length - created;
        toast({
          title: "Cloned",
          description: `${created} plans cloned${failed > 0 ? `, ${failed} failed (likely duplicates)` : ""}.`,
        });
        loadData();
      } catch (err: any) {
        toast({
          title: "Error",
          description: err?.message || "Failed to clone plans.",
          variant: "destructive",
        });
      }
    },
    [plans, toast, loadData],
  );

  return {
    plans,
    companies,
    currencies,
    loading,
    handleCellEdit,
    addNewItem,
    addRowBelow,
    deleteItem,
    cloneData,
    reload: loadData,
  };
}
