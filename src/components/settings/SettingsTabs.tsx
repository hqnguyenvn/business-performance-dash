
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MasterDataTable from "@/components/MasterDataTable";
import ExchangeRateTable from "@/components/ExchangeRateTable";
import { MasterData } from "@/services/masterDataService";
import { ExchangeRateDisplay } from "@/services/exchangeRateService";
import {
  customersService,
  companiesService,
  divisionsService,
  projectsService,
  projectTypesService,
  resourcesService,
  currenciesService,
  costTypesService,
  rolesService,
} from "@/services/masterDataService";
import BonusByDivisionTable from "./BonusByDivisionTable";
import BonusByCompanyTable from "./BonusByCompanyTable";
import ParameterTable from "./ParameterTable";
import { BonusByDivision } from "@/services/bonusByDivisionService";
import { BonusByCompany } from "@/services/bonusByCompanyService";
import { Parameter } from "@/services/parameterService";

interface SettingsTabsProps {
  data: {
    customers: MasterData[];
    companies: MasterData[];
    divisions: MasterData[];
    projects: MasterData[];
    projectTypes: MasterData[];
    resources: MasterData[];
    currencies: MasterData[];
    costTypes: MasterData[];
    roles: MasterData[];
    exchangeRates: ExchangeRateDisplay[];
    bonusByDivision: BonusByDivision[];
    bonusByCompany: BonusByCompany[];
    parameters: Parameter[];
  };
  setters: {
    setCustomers: React.Dispatch<React.SetStateAction<MasterData[]>>;
    setCompanies: React.Dispatch<React.SetStateAction<MasterData[]>>;
    setDivisions: React.Dispatch<React.SetStateAction<MasterData[]>>;
    setProjects: React.Dispatch<React.SetStateAction<MasterData[]>>;
    setProjectTypes: React.Dispatch<React.SetStateAction<MasterData[]>>;
    setResources: React.Dispatch<React.SetStateAction<MasterData[]>>;
    setCurrencies: React.Dispatch<React.SetStateAction<MasterData[]>>;
    setCostTypes: React.Dispatch<React.SetStateAction<MasterData[]>>;
    setRoles: React.Dispatch<React.SetStateAction<MasterData[]>>;
    setExchangeRates: React.Dispatch<React.SetStateAction<ExchangeRateDisplay[]>>;
    setBonusByDivision: React.Dispatch<React.SetStateAction<BonusByDivision[]>>;
    setBonusByCompany: React.Dispatch<React.SetStateAction<BonusByCompany[]>>;
    setParameters: React.Dispatch<React.SetStateAction<Parameter[]>>;
  };
}

export const SettingsTabs = ({ data, setters }: SettingsTabsProps) => {
  return (
    <Tabs defaultValue="customers" className="w-full">
      <TabsList className="flex flex-wrap h-auto w-full p-2 gap-1">
        <TabsTrigger value="customers" className="whitespace-nowrap px-3 py-2">
          Customers
        </TabsTrigger>
        <TabsTrigger value="companies" className="whitespace-nowrap px-3 py-2">
          Companies
        </TabsTrigger>
        <TabsTrigger value="divisions" className="whitespace-nowrap px-3 py-2">
          Divisions
        </TabsTrigger>
        <TabsTrigger value="projects" className="whitespace-nowrap px-3 py-2">
          Projects
        </TabsTrigger>
        <TabsTrigger value="projectTypes" className="whitespace-nowrap px-3 py-2">
          Project Types
        </TabsTrigger>
        <TabsTrigger value="resources" className="whitespace-nowrap px-3 py-2">
          Resources
        </TabsTrigger>
        <TabsTrigger value="currencies" className="whitespace-nowrap px-3 py-2">
          Currencies
        </TabsTrigger>
        <TabsTrigger value="costTypes" className="whitespace-nowrap px-3 py-2">
          Cost Types
        </TabsTrigger>
        <TabsTrigger value="roles" className="whitespace-nowrap px-3 py-2">
          Roles
        </TabsTrigger>
        <TabsTrigger value="exchangeRates" className="whitespace-nowrap px-3 py-2">
          Exchange Rates
        </TabsTrigger>
        <TabsTrigger value="bonusByDivision" className="whitespace-nowrap px-3 py-2">
          Bonus by D
        </TabsTrigger>
        <TabsTrigger value="bonusByCompany" className="whitespace-nowrap px-3 py-2">
          Bonus by C
        </TabsTrigger>
        <TabsTrigger value="parameters" className="whitespace-nowrap px-3 py-2">
          Parameters
        </TabsTrigger>
      </TabsList>

      <TabsContent value="customers">
        <MasterDataTable
          data={data.customers}
          setter={setters.setCustomers}
          title="Customer List"
          service={customersService}
        />
      </TabsContent>

      <TabsContent value="companies">
        <MasterDataTable
          data={data.companies}
          setter={setters.setCompanies}
          title="Company List"
          service={companiesService}
        />
      </TabsContent>

      <TabsContent value="divisions">
        <MasterDataTable
          data={data.divisions}
          setter={setters.setDivisions}
          title="Division List"
          showCompanyColumn={true}
          companies={data.companies}
          service={divisionsService}
        />
      </TabsContent>

      <TabsContent value="projects">
        <MasterDataTable
          data={data.projects}
          setter={setters.setProjects}
          title="Project List"
          showCustomerColumn={true}
          customers={data.customers}
          service={projectsService}
        />
      </TabsContent>

      <TabsContent value="projectTypes">
        <MasterDataTable
          data={data.projectTypes}
          setter={setters.setProjectTypes}
          title="Project Type List"
          service={projectTypesService}
        />
      </TabsContent>

      <TabsContent value="resources">
        <MasterDataTable
          data={data.resources}
          setter={setters.setResources}
          title="Resource List"
          service={resourcesService}
        />
      </TabsContent>

      <TabsContent value="currencies">
        <MasterDataTable
          data={data.currencies}
          setter={setters.setCurrencies}
          title="Currency List"
          service={currenciesService}
        />
      </TabsContent>

      <TabsContent value="costTypes">
        <MasterDataTable
          data={data.costTypes}
          setter={setters.setCostTypes}
          title="Cost Type List"
          service={costTypesService}
        />
      </TabsContent>

      <TabsContent value="roles">
        <MasterDataTable
          data={data.roles}
          setter={setters.setRoles}
          title="Role List"
          service={rolesService}
        />
      </TabsContent>

      <TabsContent value="exchangeRates">
        <ExchangeRateTable
          exchangeRates={data.exchangeRates}
          setExchangeRates={setters.setExchangeRates}
          currencies={data.currencies}
        />
      </TabsContent>
      
      <TabsContent value="bonusByDivision">
        <BonusByDivisionTable
          data={data.bonusByDivision}
          setter={setters.setBonusByDivision}
          divisions={data.divisions}
        />
      </TabsContent>
      
      <TabsContent value="bonusByCompany">
        <BonusByCompanyTable
          data={data.bonusByCompany}
          setter={setters.setBonusByCompany}
          companies={data.companies}
        />
      </TabsContent>
      
      <TabsContent value="parameters">
        <ParameterTable
          data={data.parameters}
          setter={setters.setParameters}
        />
      </TabsContent>
    </Tabs>
  );
};
