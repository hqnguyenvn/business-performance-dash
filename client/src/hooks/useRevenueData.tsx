
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Revenue, RevenueSearchParams } from "@/types/revenue";
import {
  createRevenue,
  updateRevenue,
  deleteRevenue,
  getRevenues,
} from "@/services/revenueApi";
import {
  MasterData,
  getMasterDatas,
} from "@/services/masterDataService";
import { exchangeRateService } from "@/services/exchangeRateService";

export const useRevenueData = () => {
  const { toast } = useToast();
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [customers, setCustomers] = useState<MasterData[]>([]);
  const [companies, setCompanies] = useState<MasterData[]>([]);
  const [divisions, setDivisions] = useState<MasterData[]>([]);
  const [projects, setProjects] = useState<MasterData[]>([]);
  const [projectTypes, setProjectTypes] = useState<MasterData[]>([]);
  const [resources, setResources] = useState<MasterData[]>([]);
  const [currencies, setCurrencies] = useState<MasterData[]>([]);
  const [exchangeRates, setExchangeRates] = useState<any[]>([]);
  
  // Default to months 1 to current month
  const currentMonth = new Date().getMonth() + 1;
  const defaultMonths = Array.from({ length: currentMonth }, (_, i) => i + 1);
  
  const [searchParams, setSearchParams] = useState<RevenueSearchParams>({
    year: new Date().getFullYear(),
    months: defaultMonths,
    page: 1,
    pageSize: 25,
  });
  const [total, setTotal] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      console.log('Fetching data with params:', searchParams);
      
      // Prepare params for API call
      const apiParams = { ...searchParams };
      
      // If pageSize is 'all', don't send pageSize and page to get all records
      if (searchParams.pageSize === 'all') {
        delete apiParams.pageSize;
        delete apiParams.page;
      }
      
      const [
        revenuesData,
        customersData,
        companiesData,
        divisionsData,
        projectsData,
        projectTypesData,
        resourcesData,
        currenciesData,
        exchangeRatesData,
      ] = await Promise.all([
        getRevenues(apiParams),
        getMasterDatas('customers'),
        getMasterDatas('companies'),
        getMasterDatas('divisions'),
        getMasterDatas('projects'),
        getMasterDatas('project_types'),
        getMasterDatas('resources'),
        getMasterDatas('currencies'),
        exchangeRateService.getAll(),
      ]);
      setRevenues(revenuesData.data);
      setTotal(revenuesData.total);
      setCustomers(customersData);
      setCompanies(companiesData);
      setDivisions(divisionsData);
      setProjects(projectsData);
      setProjectTypes(projectTypesData);
      setResources(resourcesData);
      setCurrencies(currenciesData);
      setExchangeRates(exchangeRatesData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem fetching data.",
      });
    }
  }, [searchParams, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveRevenue = async (revenue: Revenue) => {
    try {
      if (revenue.id) {
        await updateRevenue(revenue.id, revenue);
        toast({
          title: "Revenue record updated successfully!",
        });
      } else {
        await createRevenue(revenue);
        toast({
          title: "Revenue record created successfully!",
        });
      }
      fetchData();
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
      setRevenues(revenues.filter((revenue) => revenue.id !== id));
      toast({
        title: "Revenue record deleted successfully!",
      });
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
    fetchData,
    handleSaveRevenue,
    handleDeleteRevenue,
  };
};
