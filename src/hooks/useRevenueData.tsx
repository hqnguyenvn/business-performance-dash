import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Revenue, RevenueSearchParams } from "@/types/revenue";
import {
  createRevenue,
  updateRevenue,
  deleteRevenue,
  getRevenues,
} from "@/services/revenueApi";
import { useMasterData } from "@/hooks/useMasterData";
import { exchangeRateService } from "@/services/exchangeRateService";

/**
 * Data layer for the Revenues page.
 *
 * - Revenues use React Query keyed on searchParams, with a dedicated cache
 *   that invalidates on mutation (no manual re-fetch).
 * - Master data use `useMasterData` so each table is fetched once and shared
 *   with every other hook that needs it (dashboard, reports, salary costs).
 *   Previously every filter-change refetched all 8 master tables.
 */
export const useRevenueData = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Master data — cached across pages/hooks via useMasterData
  const { data: customers = [] } = useMasterData("customers");
  const { data: companies = [] } = useMasterData("companies");
  const { data: divisions = [] } = useMasterData("divisions");
  const { data: projects = [] } = useMasterData("projects");
  const { data: projectTypes = [] } = useMasterData("project_types");
  const { data: resources = [] } = useMasterData("resources");
  const { data: currencies = [] } = useMasterData("currencies");

  // Exchange rates: moderate-churn reference data
  const { data: exchangeRates = [] } = useQuery({
    queryKey: ["exchange-rates"],
    queryFn: () => exchangeRateService.getAll(),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Default to months 1 to previous month
  const currentMonth = new Date().getMonth() + 1;
  const defaultMonths = Array.from(
    { length: Math.max(currentMonth - 1, 0) },
    (_, i) => i + 1,
  );

  const [searchParams, setSearchParams] = useState<RevenueSearchParams>({
    year: new Date().getFullYear(),
    months: defaultMonths,
    page: 1,
    pageSize: 25,
  });

  const monthsKey = [...(searchParams.months ?? [])]
    .sort((a, b) => a - b)
    .join(",");

  const {
    data: revenuesResult,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: [
      "revenues-list",
      searchParams.year,
      monthsKey,
      searchParams.page,
      searchParams.pageSize,
      searchParams.customer_id,
      searchParams.company_id,
      searchParams.division_id,
      searchParams.project_id,
      searchParams.project_type_id,
      searchParams.resource_id,
      searchParams.currency_id,
      searchParams.q,
    ],
    queryFn: () => {
      // If pageSize is 'all', don't send page — get all records
      const apiParams = { ...searchParams };
      if (searchParams.pageSize === "all") {
        delete apiParams.pageSize;
        delete apiParams.page;
        apiParams.pageSize = "all";
      }
      return getRevenues(apiParams);
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const revenues = revenuesResult?.data ?? [];
  const total = revenuesResult?.total ?? 0;

  // Keep a setter for consumers that previously mutated revenues locally.
  // It now just invalidates the query so the cache is the source of truth.
  const setRevenues = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["revenues-list"] });
  }, [queryClient]);

  const fetchData = useCallback(() => refetch(), [refetch]);

  const handleSaveRevenue = async (revenue: Revenue) => {
    try {
      if (revenue.id) {
        const { id, ...patch } = revenue;
        await updateRevenue(id, patch);
        toast({ title: "Revenue record updated successfully!" });
      } else {
        await createRevenue(revenue);
        toast({ title: "Revenue record created successfully!" });
      }
      queryClient.invalidateQueries({ queryKey: ["revenues-list"] });
    } catch (error) {
      console.error("Error saving revenue:", error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem saving the revenue record.",
      });
    }
  };

  const handleDeleteRevenue = async (id: string) => {
    try {
      await deleteRevenue(id);
      queryClient.invalidateQueries({ queryKey: ["revenues-list"] });
      toast({ title: "Revenue record deleted successfully!" });
    } catch (error) {
      console.error("Error deleting revenue:", error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem deleting the revenue record.",
      });
    }
  };

  return {
    revenues,
    setRevenues,
    customers,
    companies,
    divisions,
    projects,
    projectTypes,
    resources,
    currencies,
    exchangeRates,
    searchParams,
    setSearchParams,
    total,
    loading: isLoading,
    fetching: isFetching,
    fetchData,
    handleSaveRevenue,
    handleDeleteRevenue,
  };
};
