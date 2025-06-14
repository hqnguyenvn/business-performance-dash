
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { costService, NewCost } from "@/services/costService";
import type { Cost } from "./useCostsState";
import type { MasterData } from "@/services/masterDataService";
import { exportCostsCSV as exportCSVUtil } from "@/utils/csvExport";
import Papa from "papaparse";
import type { useCostsMutations } from './useCostsMutations';

type Mutations = ReturnType<typeof useCostsMutations>;

interface UseCostsIOProps {
  filteredCosts: Cost[];
  costTypes: MasterData[];
  createCostMutation: Mutations['createCostMutation'];
  getMonthName: (month: number) => string;
  getMonthNumber: (name: string) => number;
  getCostTypeId: (code: string) => string;
}

export const useCostsIO = ({ filteredCosts, costTypes, createCostMutation, getMonthName, getMonthNumber, getCostTypeId }: UseCostsIOProps) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const cloneCosts = async (sourceYear: number, sourceMonth: number, targetYear: number, targetMonth: number) => {
        try {
            const costsToClone = await costService.getByFilters({ year: sourceYear, month: sourceMonth });

            if (costsToClone.length === 0) {
                toast({ title: "No Data", description: "No cost data found for the source period to clone." });
                return;
            }

            const costsForTargetPeriod = await costService.getByFilters({ year: targetYear, month: targetMonth });
            if (costsForTargetPeriod.length > 0) {
                toast({ 
                    title: "Data Exists", 
                    description: `Cost data already exists for ${getMonthName(targetMonth)} ${targetYear}. Please clear it first.`,
                    variant: "destructive"
                });
                return;
            }

            const newCosts: NewCost[] = costsToClone.map(cost => {
                const { id, created_at, updated_at, ...rest } = cost;
                return {
                    ...rest,
                    year: targetYear,
                    month: targetMonth,
                    is_checked: false,
                };
            });

            const creationPromises = newCosts.map(c => createCostMutation.mutateAsync(c));
            await Promise.all(creationPromises);
            
            toast({
                title: "Success",
                description: `Successfully cloned ${newCosts.length} cost items to ${getMonthName(targetMonth)} ${targetYear}.`,
            });

            queryClient.invalidateQueries({ queryKey: ['costs'] });

        } catch (error) {
            toast({
                title: "Error Cloning Data",
                description: "An error occurred while cloning cost data.",
                variant: "destructive"
            });
        }
      };

    const exportToCSV = () => {
        if (!filteredCosts || filteredCosts.length === 0) {
            toast({
                title: "No Data to Export",
                description: "There are no costs matching the current filters.",
                variant: "destructive",
            });
            return;
        }
        exportCSVUtil({
          costs: filteredCosts,
          costTypes,
          getMonthName,
        });
        toast({
          title: "Export Initiated",
          description: `An export of ${filteredCosts.length} cost records has started.`,
        });
    };

    const importFromCSV = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';
        input.onchange = (e) => {
          const target = e.target as HTMLInputElement;
          if (!target.files) return;
          const file = target.files[0];
          if (file) {
            Papa.parse(file, {
              header: true,
              skipEmptyLines: true,
              complete: async (results) => {
                if (results.errors.length) {
                  toast({ title: "Import Error", description: `Error parsing CSV: ${results.errors[0].message}`, variant: "destructive" });
                  return;
                }
    
                const newCosts: NewCost[] = [];
                const rows = results.data as Record<string, string>[];
                
                for (const row of rows) {
                  const year = parseInt(row.Year, 10);
                  const month = getMonthNumber(row.Month);
                  const cost_type = getCostTypeId(row.Category);
    
                  if (!year || !month || !cost_type) {
                    console.warn("Skipping invalid row:", row);
                    continue;
                  }
    
                  const price = parseFloat(row['Unit Price']) || 0;
                  const volume = parseFloat(row.Volume) || 1;
    
                  newCosts.push({
                    year,
                    month,
                    description: row.Description || "",
                    price,
                    volume,
                    cost: price * volume,
                    cost_type,
                    is_cost: (row['Is Cost'] || 'TRUE').toUpperCase() === 'TRUE',
                    is_checked: (row.Checked || 'FALSE').toUpperCase() === 'FALSE',
                    notes: row.Notes || "",
                    company_id: null,
                    division_id: null,
                    project_id: null,
                    resource_id: null,
                  });
                }
    
                if (newCosts.length === 0) {
                  toast({ title: "No Data", description: "No valid data to import from file.", variant: "destructive" });
                  return;
                }
    
                toast({ title: "Importing...", description: `Importing ${newCosts.length} new cost records.` });
                try {
                  await Promise.all(newCosts.map(cost => createCostMutation.mutateAsync(cost)));
                  toast({ title: "Import Successful", description: `Successfully imported ${newCosts.length} records.` });
                  queryClient.invalidateQueries({ queryKey: ['costs'] });
                } catch (error) {
                  toast({ title: "Import Failed", description: `An error occurred: ${(error as Error).message}`, variant: "destructive" });
                }
              },
            });
          }
        };
        input.click();
    };

    return { cloneCosts, exportToCSV, importFromCSV };
};

