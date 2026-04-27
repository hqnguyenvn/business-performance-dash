import { useState } from "react";
import {
  Users, Building2, Network, FolderKanban, Tag, UserCog, Coins,
  Receipt, Shield, TrendingUp, Gift, Sliders, type LucideIcon,
} from "lucide-react";
import MasterDataTable from "@/components/MasterDataTable";
import RolesTable from "@/components/RolesTable";
import ExchangeRateTable from "@/components/ExchangeRateTable";
import { MasterData } from "@/services/masterDataService";
import { Role } from "@/types/role";
import { ExchangeRateDisplay } from "@/services/exchangeRateService";
import {
  customersService, companiesService, divisionsService,
  projectsService, projectTypesService, resourcesService,
  currenciesService, costTypesService,
} from "@/services/masterDataService";
import BonusByDivisionTable from "./BonusByDivisionTable";
import BonusByCompanyTable from "./BonusByCompanyTable";
import ParameterTable from "./ParameterTable";
import { BonusByDivision } from "@/services/bonusByDivisionService";
import { BonusByCompany } from "@/services/bonusByCompanyService";
import { Parameter } from "@/services/parameterService";
import { cn } from "@/lib/utils";

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
    roles: Role[];
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
    setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
    setExchangeRates: React.Dispatch<React.SetStateAction<ExchangeRateDisplay[]>>;
    setBonusByDivision: React.Dispatch<React.SetStateAction<BonusByDivision[]>>;
    setBonusByCompany: React.Dispatch<React.SetStateAction<BonusByCompany[]>>;
    setParameters: React.Dispatch<React.SetStateAction<Parameter[]>>;
  };
}

type SectionKey =
  | "customers" | "companies" | "divisions" | "projects"
  | "projectTypes" | "resources" | "currencies" | "costTypes"
  | "roles" | "exchangeRates" | "bonusByDivision" | "bonusByCompany" | "parameters";

interface NavItem { key: SectionKey; label: string; icon: LucideIcon; }
interface NavGroup { label: string; items: NavItem[]; }

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Master Data",
    items: [
      { key: "customers", label: "Customers", icon: Users },
      { key: "companies", label: "Companies", icon: Building2 },
      { key: "divisions", label: "Divisions", icon: Network },
      { key: "projects", label: "Projects", icon: FolderKanban },
      { key: "projectTypes", label: "Project Types", icon: Tag },
      { key: "resources", label: "Resources", icon: UserCog },
      { key: "currencies", label: "Currencies", icon: Coins },
      { key: "costTypes", label: "Cost Types", icon: Receipt },
    ],
  },
  {
    label: "Rates & Parameters",
    items: [
      { key: "exchangeRates", label: "Exchange Rates", icon: TrendingUp },
      { key: "parameters", label: "Parameters", icon: Sliders },
    ],
  },
  {
    label: "Bonus",
    items: [
      { key: "bonusByDivision", label: "Bonus by Division", icon: Gift },
      { key: "bonusByCompany", label: "Bonus by Company", icon: Gift },
    ],
  },
  {
    label: "Access Control",
    items: [
      { key: "roles", label: "Roles", icon: Shield },
    ],
  },
];

export const SettingsTabs = ({ data, setters }: SettingsTabsProps) => {
  const [active, setActive] = useState<SectionKey>("customers");

  const renderContent = () => {
    switch (active) {
      case "customers":
        return <MasterDataTable data={data.customers} setter={setters.setCustomers} title="Customer List" service={customersService} />;
      case "companies":
        return <MasterDataTable data={data.companies} setter={setters.setCompanies} title="Company List" service={companiesService} />;
      case "divisions":
        return <MasterDataTable data={data.divisions} setter={setters.setDivisions} title="Division List" showCompanyColumn companies={data.companies} service={divisionsService} />;
      case "projects":
        return <MasterDataTable data={data.projects} setter={setters.setProjects} title="Project List" showCustomerColumn showGroupCodeColumn showDeleteAllButton customers={data.customers} service={projectsService} />;
      case "projectTypes":
        return <MasterDataTable data={data.projectTypes} setter={setters.setProjectTypes} title="Project Type List" service={projectTypesService} />;
      case "resources":
        return <MasterDataTable data={data.resources} setter={setters.setResources} title="Resource List" service={resourcesService} />;
      case "currencies":
        return <MasterDataTable data={data.currencies} setter={setters.setCurrencies} title="Currency List" service={currenciesService} />;
      case "costTypes":
        return <MasterDataTable data={data.costTypes} setter={setters.setCostTypes} title="Cost Type List" service={costTypesService} />;
      case "roles":
        return <RolesTable data={data.roles} setter={setters.setRoles} />;
      case "exchangeRates":
        return <ExchangeRateTable exchangeRates={data.exchangeRates} setExchangeRates={setters.setExchangeRates} currencies={data.currencies} />;
      case "bonusByDivision":
        return <BonusByDivisionTable data={data.bonusByDivision} setter={setters.setBonusByDivision} divisions={data.divisions} />;
      case "bonusByCompany":
        return <BonusByCompanyTable data={data.bonusByCompany} setter={setters.setBonusByCompany} companies={data.companies} />;
      case "parameters":
        return <ParameterTable data={data.parameters} setter={setters.setParameters} />;
    }
  };

  return (
    <div className="flex gap-6">
      <aside className="w-56 shrink-0">
        <nav className="sticky top-4 space-y-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="px-3 mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = active === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setActive(item.key)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition text-left",
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-foreground/80 hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex-1 min-w-0">{renderContent()}</div>
    </div>
  );
};
