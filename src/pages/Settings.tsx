
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon } from "lucide-react";
import MasterDataTable from "@/components/MasterDataTable";
import ExchangeRateTable from "@/components/ExchangeRateTable";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MasterData {
  id: string;
  code: string;
  name: string;
  description?: string;
}

interface ExchangeRate {
  id: string;
  year: number;
  month: string;
  currencyID: string;
  exchangeRate: number;
}

const Settings = () => {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<MasterData[]>([]);
  const [companies, setCompanies] = useState<MasterData[]>([]);
  const [divisions, setDivisions] = useState<MasterData[]>([]);
  const [projects, setProjects] = useState<MasterData[]>([]);
  const [projectTypes, setProjectTypes] = useState<MasterData[]>([]);
  const [resources, setResources] = useState<MasterData[]>([]);
  const [currencies, setCurrencies] = useState<MasterData[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data from Supabase on component mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      // Load all master data tables
      const [
        customersRes,
        companiesRes,
        divisionsRes,
        projectsRes,
        projectTypesRes,
        resourcesRes,
        currenciesRes,
        exchangeRatesRes
      ] = await Promise.all([
        supabase.from('customers').select('*'),
        supabase.from('companies').select('*'),
        supabase.from('divisions').select('*'),
        supabase.from('projects').select('*'),
        supabase.from('project_types').select('*'),
        supabase.from('resources').select('*'),
        supabase.from('currencies').select('*'),
        supabase.from('exchange_rates').select('*')
      ]);

      // Handle any errors
      const errors = [
        customersRes.error,
        companiesRes.error,
        divisionsRes.error,
        projectsRes.error,
        projectTypesRes.error,
        resourcesRes.error,
        currenciesRes.error,
        exchangeRatesRes.error
      ].filter(Boolean);

      if (errors.length > 0) {
        console.error('Errors loading data:', errors);
        toast({
          title: "Error",
          description: "Some data failed to load from database",
          variant: "destructive"
        });
      }

      // Set data with fallbacks to localStorage if database is empty
      setCustomers(customersRes.data || loadFromLocalStorage('settings_customers', [
        { id: "1", code: "CUST001", name: "ABC Technology Company", description: "VIP Customer" },
        { id: "2", code: "CUST002", name: "XYZ Solutions Ltd", description: "Regular Customer" },
      ]));

      setCompanies(companiesRes.data || loadFromLocalStorage('settings_companies', [
        { id: "1", code: "COMP001", name: "Main Company", description: "Head Office" },
        { id: "2", code: "COMP002", name: "Hanoi Branch", description: "Northern Branch" },
      ]));

      setDivisions(divisionsRes.data || loadFromLocalStorage('settings_divisions', [
        { id: "1", code: "DIV001", name: "Development Department", description: "R&D Division" },
        { id: "2", code: "DIV002", name: "Sales Department", description: "Sales Division" },
      ]));

      setProjects(projectsRes.data || loadFromLocalStorage('settings_projects', [
        { id: "1", code: "PRJ001", name: "ERP Project", description: "Enterprise Resource Planning System" },
        { id: "2", code: "PRJ002", name: "CRM Project", description: "Customer Relationship Management" },
      ]));

      setProjectTypes(projectTypesRes.data || loadFromLocalStorage('settings_projectTypes', [
        { id: "1", code: "TYPE001", name: "New Development", description: "Brand new project development" },
        { id: "2", code: "TYPE002", name: "Maintenance", description: "System maintenance" },
      ]));

      setResources(resourcesRes.data || loadFromLocalStorage('settings_resources', [
        { id: "1", code: "RES001", name: "Senior Developer", description: "Senior level programmer" },
        { id: "2", code: "RES002", name: "Junior Developer", description: "Entry level programmer" },
      ]));

      setCurrencies(currenciesRes.data || loadFromLocalStorage('settings_currencies', [
        { id: "1", code: "USD", name: "US Dollar", description: "United States Dollar" },
        { id: "2", code: "VND", name: "Vietnam Dong", description: "Vietnamese Dong" },
        { id: "3", code: "JPY", name: "Japanese Yen", description: "Japanese Yen" },
      ]));

      // Transform exchange rates data to match the expected format
      const transformedExchangeRates = exchangeRatesRes.data?.map(rate => ({
        id: rate.id,
        year: rate.year,
        month: getMonthName(rate.month),
        currencyID: rate.currency_id,
        exchangeRate: rate.exchange_rate
      })) || loadFromLocalStorage('settings_exchangeRates', [
        { id: "1", year: 2024, month: "Jan", currencyID: "USD", exchangeRate: 24000 },
        { id: "2", year: 2024, month: "Jan", currencyID: "JPY", exchangeRate: 170 },
      ]);

      setExchangeRates(transformedExchangeRates);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load data from database",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFromLocalStorage = (key: string, defaultData: any[]) => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultData;
  };

  const getMonthName = (monthNumber: number): string => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                       "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return monthNames[monthNumber - 1] || "Jan";
  };

  // Enhanced setters that sync with Supabase
  const createSupabaseSetter = (tableName: string, setter: React.Dispatch<React.SetStateAction<MasterData[]>>) => {
    return async (newData: MasterData[]) => {
      setter(newData);
      
      try {
        // Note: In a real application, you'd want to implement proper CRUD operations
        // For now, we'll just update the local state and save to localStorage as backup
        localStorage.setItem(`settings_${tableName}`, JSON.stringify(newData));
        
        console.log(`Updated ${tableName} data:`, newData);
      } catch (error) {
        console.error(`Error updating ${tableName}:`, error);
        toast({
          title: "Error",
          description: `Failed to save ${tableName} data`,
          variant: "destructive"
        });
      }
    };
  };

  const setCustomersWithSync = createSupabaseSetter('customers', setCustomers);
  const setCompaniesWithSync = createSupabaseSetter('companies', setCompanies);
  const setDivisionsWithSync = createSupabaseSetter('divisions', setDivisions);
  const setProjectsWithSync = createSupabaseSetter('projects', setProjects);
  const setProjectTypesWithSync = createSupabaseSetter('projectTypes', setProjectTypes);
  const setResourcesWithSync = createSupabaseSetter('resources', setResources);
  const setCurrenciesWithSync = createSupabaseSetter('currencies', setCurrencies);

  const setExchangeRatesWithSync = async (newData: ExchangeRate[]) => {
    setExchangeRates(newData);
    
    try {
      localStorage.setItem('settings_exchangeRates', JSON.stringify(newData));
      console.log('Updated exchange rates data:', newData);
    } catch (error) {
      console.error('Error updating exchange rates:', error);
      toast({
        title: "Error",
        description: "Failed to save exchange rates data",
        variant: "destructive"
      });
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
