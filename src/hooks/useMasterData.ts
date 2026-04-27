/**
 * Shared React Query hook for master-data tables.
 *
 * Previously every hook (useDashboardStats, useCompanyReportData, useTopCustomers,
 * useRevenueData, useSettingsData, ...) called `xService.getAll()` directly,
 * so navigating between pages refetched the same data multiple times.
 *
 * By routing every call through React Query with a shared cache key, the data
 * is fetched once and reused everywhere until the staleTime window elapses.
 *
 * Usage:
 *   const { data: customers = [] } = useMasterData("customers");
 *   const { data: companies = [] } = useMasterData("companies");
 */
import { useQuery, useQueries, type UseQueryOptions } from "@tanstack/react-query";
import {
  customersService,
  companiesService,
  divisionsService,
  projectsService,
  projectTypesService,
  resourcesService,
  currenciesService,
  costTypesService,
  type MasterData,
} from "@/services/masterDataService";

export type MasterDataResource =
  | "customers"
  | "companies"
  | "divisions"
  | "projects"
  | "project_types"
  | "resources"
  | "currencies"
  | "cost_types";

const FETCHERS: Record<MasterDataResource, () => Promise<MasterData[]>> = {
  customers: () => customersService.getAll(),
  companies: () => companiesService.getAll(),
  divisions: () => divisionsService.getAll(),
  projects: () => projectsService.getAll(),
  project_types: () => projectTypesService.getAll(),
  resources: () => resourcesService.getAll(),
  currencies: () => currenciesService.getAll(),
  cost_types: () => costTypesService.getAll(),
};

const DEFAULTS = {
  // Master data changes rarely — cache for 15 min, keep in memory 30 min.
  staleTime: 15 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
} as const;

export function useMasterData(
  resource: MasterDataResource,
  options?: Omit<UseQueryOptions<MasterData[]>, "queryKey" | "queryFn">,
) {
  return useQuery<MasterData[]>({
    queryKey: ["master-data", resource],
    queryFn: FETCHERS[resource],
    ...DEFAULTS,
    ...options,
  });
}

/**
 * Fetch multiple master-data resources in parallel, sharing the cache with
 * any other consumer of `useMasterData`.
 */
export function useMasterDataMany(resources: MasterDataResource[]) {
  const results = useQueries({
    queries: resources.map((r) => ({
      queryKey: ["master-data", r],
      queryFn: FETCHERS[r],
      ...DEFAULTS,
    })),
  });
  return resources.reduce(
    (acc, r, i) => {
      acc[r] = (results[i].data ?? []) as MasterData[];
      acc.isLoading = acc.isLoading || results[i].isLoading;
      acc.isError = acc.isError || results[i].isError;
      return acc;
    },
    {
      isLoading: false as boolean,
      isError: false as boolean,
    } as {
      [K in MasterDataResource]?: MasterData[];
    } & { isLoading: boolean; isError: boolean },
  );
}
