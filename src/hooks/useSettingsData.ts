
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  customersService,
  companiesService,
  divisionsService,
  projectsService,
  projectTypesService,
  resourcesService,
  currenciesService,
  costTypesService,
  MasterData
} from "@/services/masterDataService";
import { exchangeRateService, ExchangeRateDisplay } from "@/services/exchangeRateService";
import { bonusByDivisionService, BonusByDivision } from "@/services/bonusByDivisionService";
import { bonusByCompanyService, BonusByCompany } from "@/services/bonusByCompanyService";
import { parameterService, Parameter } from "@/services/parameterService";

export const useSettingsData = () => {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<MasterData[]>([]);
  const [companies, setCompanies] = useState<MasterData[]>([]);
  const [divisions, setDivisions] = useState<MasterData[]>([]);
  const [projects, setProjects] = useState<MasterData[]>([]);
  const [projectTypes, setProjectTypes] = useState<MasterData[]>([]);
  const [resources, setResources] = useState<MasterData[]>([]);
  const [currencies, setCurrencies] = useState<MasterData[]>([]);
  const [costTypes, setCostTypes] = useState<MasterData[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRateDisplay[]>([]);
  const [bonusByDivision, setBonusByDivision] = useState<BonusByDivision[]>([]);
  const [bonusByCompany, setBonusByCompany] = useState<BonusByCompany[]>([]);
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [
        customersData,
        companiesData,
        divisionsData,
        projectsData,
        projectTypesData,
        resourcesData,
        currenciesData,
        costTypesData,
        exchangeRatesData,
        bonusByDivisionData,
        bonusByCompanyData,
        parametersData
      ] = await Promise.all([
        customersService.getAll(),
        companiesService.getAll(),
        divisionsService.getAll(),
        projectsService.getAll(),
        projectTypesService.getAll(),
        resourcesService.getAll(),
        currenciesService.getAll(),
        costTypesService.getAll(),
        exchangeRateService.getAll(),
        bonusByDivisionService.getAll(),
        bonusByCompanyService.getAll(),
        parameterService.getAll()
      ]);

      setCustomers(customersData);
      setCompanies(companiesData);
      setDivisions(divisionsData);
      setProjects(projectsData);
      setProjectTypes(projectTypesData);
      setResources(resourcesData);
      setCurrencies(currenciesData);
      setCostTypes(costTypesData);
      setExchangeRates(exchangeRatesData);
      setBonusByDivision(bonusByDivisionData);
      setBonusByCompany(bonusByCompanyData);
      setParameters(parametersData);

    } catch (error) {
      console.error('Error loading data from Supabase:', error);
      toast({
        title: "Error",
        description: "Failed to load data from database",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  return {
    data: {
      customers,
      companies,
      divisions,
      projects,
      projectTypes,
      resources,
      currencies,
      costTypes,
      exchangeRates,
      bonusByDivision,
      bonusByCompany,
      parameters,
    },
    setters: {
      setCustomers,
      setCompanies,
      setDivisions,
      setProjects,
      setProjectTypes,
      setResources,
      setCurrencies,
      setCostTypes,
      setExchangeRates,
      setBonusByDivision,
      setBonusByCompany,
      setParameters,
    },
    loading,
    setLoading,
    loadAllData,
  };
};
