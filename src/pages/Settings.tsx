
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import MasterDataTable from "@/components/MasterDataTable";
import ExchangeRateTable from "@/components/ExchangeRateTable";
import { useToast } from "@/hooks/use-toast";
import { importDataFromLocalStorage } from "@/utils/importData";
import {
  customersService,
  companiesService,
  divisionsService,
  projectsService,
  projectTypesService,
  resourcesService,
  currenciesService,
  MasterData
} from "@/services/masterDataService";
import { exchangeRateService, ExchangeRateDisplay } from "@/services/exchangeRateService";

const Settings = () => {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<MasterData[]>([]);
  const [companies, setCompanies] = useState<MasterData[]>([]);
  const [divisions, setDivisions] = useState<MasterData[]>([]);
  const [projects, setProjects] = useState<MasterData[]>([]);
  const [projectTypes, setProjectTypes] = useState<MasterData[]>([]);
  const [resources, setResources] = useState<MasterData[]>([]);
  const [currencies, setCurrencies] = useState<MasterData[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRateDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data from Supabase on component mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      console.log("Loading data from Supabase...");
      
      // Load all data in parallel
      const [
        customersData,
        companiesData,
        divisionsData,
        projectsData,
        projectTypesData,
        resourcesData,
        currenciesData,
        exchangeRatesData
      ] = await Promise.all([
        customersService.getAll(),
        companiesService.getAll(),
        divisionsService.getAll(),
        projectsService.getAll(),
        projectTypesService.getAll(),
        resourcesService.getAll(),
        currenciesService.getAll(),
        exchangeRateService.getAll()
      ]);

      setCustomers(customersData);
      setCompanies(companiesData);
      setDivisions(divisionsData);
      setProjects(projectsData);
      setProjectTypes(projectTypesData);
      setResources(resourcesData);
      setCurrencies(currenciesData);
      setExchangeRates(exchangeRatesData);

      console.log("All data loaded successfully from Supabase");

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
  };

  // Enhanced setters that sync with Supabase
  const createSupabaseSetter = (service: any, setter: React.Dispatch<React.SetStateAction<MasterData[]>>) => {
    return async (newData: MasterData[]) => {
      setter(newData);
      console.log('Data updated in local state');
    };
  };

  const setCustomersWithSync = createSupabaseSetter(customersService, setCustomers);
  const setCompaniesWithSync = createSupabaseSetter(companiesService, setCompanies);
  const setDivisionsWithSync = createSupabaseSetter(divisionsService, setDivisions);
  const setProjectsWithSync = createSupabaseSetter(projectsService, setProjects);
  const setProjectTypesWithSync = createSupabaseSetter(projectTypesService, setProjectTypes);
  const setResourcesWithSync = createSupabaseSetter(resourcesService, setResources);
  const setCurrenciesWithSync = createSupabaseSetter(currenciesService, setCurrencies);

  const setExchangeRatesWithSync = async (newData: ExchangeRateDisplay[]) => {
    setExchangeRates(newData);
    console.log('Exchange rates updated in local state');
  };

  const handleImportData = async () => {
    try {
      setLoading(true);
      toast({
        title: "Import Starting",
        description: "Importing data from localStorage...",
      });

      const result = await importDataFromLocalStorage();
      
      if (result.success) {
        toast({
          title: "Import Successful",
          description: result.message,
        });
        // Reload data after successful import
        await loadAllData();
      } else {
        toast({
          title: "Import Failed",
          description: result.message,
          variant: "destructive"
        });
        console.error('Import error details:', result.details);
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: "An unexpected error occurred during import",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Settings"
        description="Manage system master data"
        icon={SettingsIcon}
        actions={
          <Button onClick={handleImportData} variant="outline" disabled={loading}>
            <Upload className="h-4 w-4 mr-2" />
            Import from LocalStorage
          </Button>
        }
      />

      <div className="p-6">
        <Tabs defaultValue="customers" className="w-full">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="companies">Companies</TabsTrigger>
            <TabsTrigger value="divisions">Divisions</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="projectTypes">Project Types</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="currencies">Currencies</TabsTrigger>
            <TabsTrigger value="exchangeRates">Exchange Rates</TabsTrigger>
          </TabsList>

          <TabsContent value="customers">
            <MasterDataTable data={customers} setter={setCustomersWithSync} title="Customer List" />
          </TabsContent>

          <TabsContent value="companies">
            <MasterDataTable data={companies} setter={setCompaniesWithSync} title="Company List" />
          </TabsContent>

          <TabsContent value="divisions">
            <MasterDataTable 
              data={divisions} 
              setter={setDivisionsWithSync} 
              title="Division List" 
              showCompanyColumn={true}
              companies={companies}
            />
          </TabsContent>

          <TabsContent value="projects">
            <MasterDataTable data={projects} setter={setProjectsWithSync} title="Project List" />
          </TabsContent>

          <TabsContent value="projectTypes">
            <MasterDataTable data={projectTypes} setter={setProjectTypesWithSync} title="Project Type List" />
          </TabsContent>

          <TabsContent value="resources">
            <MasterDataTable data={resources} setter={setResourcesWithSync} title="Resource List" />
          </TabsContent>

          <TabsContent value="currencies">
            <MasterDataTable data={currencies} setter={setCurrenciesWithSync} title="Currency List" />
          </TabsContent>

          <TabsContent value="exchangeRates">
            <ExchangeRateTable 
              exchangeRates={exchangeRates} 
              setExchangeRates={setExchangeRatesWithSync} 
              currencies={currencies}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
