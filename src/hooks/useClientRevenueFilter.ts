
import { useMemo } from "react";
import { Revenue } from "@/services/revenueService";
import { MasterData } from "@/services/masterDataService";

interface Params {
  revenues: Revenue[];
  searchTerm: string;
  customers: MasterData[];
  companies: MasterData[];
  divisions: MasterData[];
  projects: MasterData[];
  projectTypes: MasterData[];
  resources: MasterData[];
  currencies: MasterData[];
}

export function useClientRevenueFilter({
  revenues,
  searchTerm,
  customers,
  companies,
  divisions,
  projects,
  projectTypes,
  resources,
  currencies,
}: Params) {
  return useMemo(() => {
    if (!searchTerm.trim()) return revenues;
    const lower = searchTerm.trim().toLowerCase();
    return revenues.filter((rev) => {
      const customer = customers.find(c => c.id === rev.customer_id)?.code || "";
      const company = companies.find(c => c.id === rev.company_id)?.code || "";
      const division = divisions.find(c => c.id === rev.division_id)?.code || "";
      const project = projects.find(c => c.id === rev.project_id)?.code || "";
      const projectType = projectTypes.find(c => c.id === rev.project_type_id)?.code || "";
      const resource = resources.find(c => c.id === rev.resource_id)?.code || "";
      const currency = currencies.find(c => c.id === rev.currency_id)?.code || "";

      return (
        (rev.project_name && rev.project_name.toLowerCase().includes(lower)) ||
        (rev.notes && rev.notes.toLowerCase().includes(lower)) ||
        customer.toLowerCase().includes(lower) ||
        company.toLowerCase().includes(lower) ||
        division.toLowerCase().includes(lower) ||
        project.toLowerCase().includes(lower) ||
        projectType.toLowerCase().includes(lower) ||
        resource.toLowerCase().includes(lower) ||
        currency.toLowerCase().includes(lower) ||
        (rev.year && String(rev.year).includes(lower)) ||
        (rev.month && String(rev.month).includes(lower))
      );
    });
  }, [revenues, searchTerm, customers, companies, divisions, projects, projectTypes, resources, currencies]);
}
