import { api } from "@/lib/api";

export interface MasterData {
  id: string;
  code: string;
  name: string;
  description?: string;
  company_id?: string;
  customer_id?: string;
}

/**
 * Factory tạo service CRUD cho 1 master data entity.
 * Giữ signature getAll / create / update / delete để consumer không cần đổi.
 */
function createMasterService(resource: string) {
  return class {
    async getAll(): Promise<MasterData[]> {
      return api.get<MasterData[]>(`/${resource}`);
    }
    async create(item: Omit<MasterData, "id">): Promise<MasterData> {
      return api.post<MasterData>(`/${resource}`, item);
    }
    async update(id: string, item: Partial<MasterData>): Promise<MasterData> {
      return api.put<MasterData>(`/${resource}/${id}`, item);
    }
    async delete(id: string): Promise<void> {
      await api.delete<void>(`/${resource}/${id}`);
    }
  };
}

export const CustomersService = createMasterService("customers");
export const CompaniesService = createMasterService("companies");
export const DivisionsService = createMasterService("divisions");
class ProjectsServiceClass extends createMasterService("projects") {
  async deleteAll(): Promise<{ deleted: number }> {
    return api.post<{ deleted: number }>("/projects/delete-all", {});
  }
}
export const ProjectsService = ProjectsServiceClass;
export const ProjectTypesService = createMasterService("project-types");
export const ResourcesService = createMasterService("resources");
export const CurrenciesService = createMasterService("currencies");
export const CostTypesService = createMasterService("cost-types");

// Service instances
export const customersService = new CustomersService();
export const companiesService = new CompaniesService();
export const divisionsService = new DivisionsService();
export const projectsService = new ProjectsService();
export const projectTypesService = new ProjectTypesService();
export const resourcesService = new ResourcesService();
export const currenciesService = new CurrenciesService();
export const costTypesService = new CostTypesService();

// Utility function to get master data by type
export const getMasterDatas = async (type: string): Promise<MasterData[]> => {
  switch (type) {
    case "customers":
      return customersService.getAll();
    case "companies":
      return companiesService.getAll();
    case "divisions":
      return divisionsService.getAll();
    case "projects":
      return projectsService.getAll();
    case "project_types":
      return projectTypesService.getAll();
    case "resources":
      return resourcesService.getAll();
    case "currencies":
      return currenciesService.getAll();
    case "cost_types":
      return costTypesService.getAll();
    default:
      throw new Error(`Unknown master data type: ${type}`);
  }
};
