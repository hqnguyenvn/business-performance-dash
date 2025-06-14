
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
  costTypesService,
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
  const [costTypes, setCostTypes] = useState<MasterData[]>([]);
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
        costTypesData,
        exchangeRatesData
      ] = await Promise.all([
        customersService.getAll(),
        companiesService.getAll(),
        divisionsService.getAll(),
        projectsService.getAll(),
        projectTypesService.getAll(),
        resourcesService.getAll(),
        currenciesService.getAll(),
        costTypesService.getAll(),
        exchangeRateService.getAll()
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
          <TabsList className="grid w-full grid-cols-9">
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="companies">Companies</TabsTrigger>
            <TabsTrigger value="divisions">Divisions</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="projectTypes">Project Types</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="currencies">Currencies</TabsTrigger>
            <TabsTrigger value="costTypes">Cost Types</TabsTrigger>
            <TabsTrigger value="exchangeRates">Exchange Rates</TabsTrigger>
          </TabsList>

          <TabsContent value="customers">
            <MasterDataTable 
              data={customers} 
              setter={setCustomers} 
              title="Customer List"
              service={customersService}
            />
          </TabsContent>

          <TabsContent value="companies">
            <MasterDataTable 
              data={companies} 
              setter={setCompanies} 
              title="Company List"
              service={companiesService}
            />
          </TabsContent>

          <TabsContent value="divisions">
            <MasterDataTable 
              data={divisions} 
              setter={setDivisions} 
              title="Division List" 
              showCompanyColumn={true}
              companies={companies}
              service={divisionsService}
            />
          </TabsContent>

          <TabsContent value="projects">
            <MasterDataTable 
              data={projects} 
              setter={setProjects} 
              title="Project List"
              showCustomerColumn={true}
              customers={customers}
              service={projectsService}
            />
          </TabsContent>

          <TabsContent value="projectTypes">
            <MasterDataTable 
              data={projectTypes} 
              setter={setProjectTypes} 
              title="Project Type List"
              service={projectTypesService}
            />
          </TabsContent>

          <TabsContent value="resources">
            <MasterDataTable 
              data={resources} 
              setter={setResources} 
              title="Resource List"
              service={resourcesService}
            />
          </TabsContent>

          <TabsContent value="currencies">
            <MasterDataTable 
              data={currencies} 
              setter={setCurrencies} 
              title="Currency List"
              service={currenciesService}
            />
          </TabsContent>

          <TabsContent value="costTypes">
            <MasterDataTable 
              data={costTypes} 
              setter={setCostTypes} 
              title="Cost Type List"
              service={costTypesService}
            />
          </TabsContent>

          <TabsContent value="exchangeRates">
            <ExchangeRateTable 
              exchangeRates={exchangeRates} 
              setExchangeRates={setExchangeRates} 
              currencies={currencies}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
