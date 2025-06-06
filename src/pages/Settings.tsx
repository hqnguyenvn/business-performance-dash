import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon } from "lucide-react";
import MasterDataTable from "@/components/MasterDataTable";
import ExchangeRateTable from "@/components/ExchangeRateTable";

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
  const [customers, setCustomers] = useState<MasterData[]>([]);
  const [companies, setCompanies] = useState<MasterData[]>([]);
  const [divisions, setDivisions] = useState<MasterData[]>([]);
  const [projects, setProjects] = useState<MasterData[]>([]);
  const [projectTypes, setProjectTypes] = useState<MasterData[]>([]);
  const [resources, setResources] = useState<MasterData[]>([]);
  const [currencies, setCurrencies] = useState<MasterData[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);

  // Load data from localStorage on component mount
  useEffect(() => {
    const loadData = (key: string, defaultData: any[]) => {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultData;
    };

    setCustomers(loadData('settings_customers', [
      { id: "1", code: "CUST001", name: "ABC Technology Company", description: "VIP Customer" },
      { id: "2", code: "CUST002", name: "XYZ Solutions Ltd", description: "Regular Customer" },
    ]));

    setCompanies(loadData('settings_companies', [
      { id: "1", code: "COMP001", name: "Main Company", description: "Head Office" },
      { id: "2", code: "COMP002", name: "Hanoi Branch", description: "Northern Branch" },
    ]));

    setDivisions(loadData('settings_divisions', [
      { id: "1", code: "DIV001", name: "Development Department", description: "R&D Division" },
      { id: "2", code: "DIV002", name: "Sales Department", description: "Sales Division" },
    ]));

    setProjects(loadData('settings_projects', [
      { id: "1", code: "PRJ001", name: "ERP Project", description: "Enterprise Resource Planning System" },
      { id: "2", code: "PRJ002", name: "CRM Project", description: "Customer Relationship Management" },
    ]));

    setProjectTypes(loadData('settings_projectTypes', [
      { id: "1", code: "TYPE001", name: "New Development", description: "Brand new project development" },
      { id: "2", code: "TYPE002", name: "Maintenance", description: "System maintenance" },
    ]));

    setResources(loadData('settings_resources', [
      { id: "1", code: "RES001", name: "Senior Developer", description: "Senior level programmer" },
      { id: "2", code: "RES002", name: "Junior Developer", description: "Entry level programmer" },
    ]));

    setCurrencies(loadData('settings_currencies', [
      { id: "1", code: "USD", name: "US Dollar", description: "United States Dollar" },
      { id: "2", code: "VND", name: "Vietnam Dong", description: "Vietnamese Dong" },
      { id: "3", code: "JPY", name: "Japanese Yen", description: "Japanese Yen" },
    ]));

    setExchangeRates(loadData('settings_exchangeRates', [
      { id: "1", year: 2024, month: "Jan", currencyID: "USD", exchangeRate: 24000 },
      { id: "2", year: 2024, month: "Jan", currencyID: "JPY", exchangeRate: 170 },
    ]));
  }, []);

  // Save data to localStorage whenever any data changes
  useEffect(() => {
    localStorage.setItem('settings_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('settings_companies', JSON.stringify(companies));
  }, [companies]);

  useEffect(() => {
    localStorage.setItem('settings_divisions', JSON.stringify(divisions));
  }, [divisions]);

  useEffect(() => {
    localStorage.setItem('settings_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('settings_projectTypes', JSON.stringify(projectTypes));
  }, [projectTypes]);

  useEffect(() => {
    localStorage.setItem('settings_resources', JSON.stringify(resources));
  }, [resources]);

  useEffect(() => {
    localStorage.setItem('settings_currencies', JSON.stringify(currencies));
  }, [currencies]);

  useEffect(() => {
    localStorage.setItem('settings_exchangeRates', JSON.stringify(exchangeRates));
  }, [exchangeRates]);

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
            <MasterDataTable data={customers} setter={setCustomers} title="Customer List" />
          </TabsContent>

          <TabsContent value="companies">
            <MasterDataTable data={companies} setter={setCompanies} title="Company List" />
          </TabsContent>

          <TabsContent value="divisions">
            <MasterDataTable 
              data={divisions} 
              setter={setDivisions} 
              title="Division List" 
              showCompanyColumn={true}
              companies={companies}
            />
          </TabsContent>

          <TabsContent value="projects">
            <MasterDataTable data={projects} setter={setProjects} title="Project List" />
          </TabsContent>

          <TabsContent value="projectTypes">
            <MasterDataTable data={projectTypes} setter={setProjectTypes} title="Project Type List" />
          </TabsContent>

          <TabsContent value="resources">
            <MasterDataTable data={resources} setter={setResources} title="Resource List" />
          </TabsContent>

          <TabsContent value="currencies">
            <MasterDataTable data={currencies} setter={setCurrencies} title="Currency List" />
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
