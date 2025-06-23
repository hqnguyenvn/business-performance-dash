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
  batchCreateCostMutation: Mutations['batchCreateCostMutation'];
  getMonthName: (month: number) => string;
  getMonthNumber: (name: string) => number;
  getCostTypeId: (code: string) => string;
}

export const useCostsIO = ({ filteredCosts, costTypes, createCostMutation, batchCreateCostMutation, getMonthName, getMonthNumber, getCostTypeId }: UseCostsIOProps) => {
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
        exportCSVUtil({
          costs: filteredCosts,
          costTypes,
          getMonthName,
        });
        toast({
          title: "Export Initiated",
          description: filteredCosts.length > 0
            ? `An export of ${filteredCosts.length} cost records has started.`
            : "Exported empty cost list with headers only.",
        });
    };

    const importFromCSV = () => {
        if (batchCreateCostMutation.isPending) {
          toast({ 
            title: "Import in Progress", 
            description: "Please wait for the current import to complete.", 
            variant: "default" 
          });
          return;
        }

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';

        const getMonthNumberFromCsv = (monthStr: string): number => {
            const monthMap: { [key: string]: number } = {
                'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
                'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
            };
            if (!monthStr) return 0;
            const key = monthStr.trim().substring(0, 3).toLowerCase();
            return monthMap[key] || 0;
        };

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
                  const month = getMonthNumberFromCsv(row.Month);
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
                    is_checked: (row.Checked || 'FALSE').toUpperCase() === 'TRUE',
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
                  await batchCreateCostMutation.mutateAsync(newCosts);
                } catch (error) {
                  console.error('Batch import error:', error);
                }
              },
            });
          }
        };
        input.click();
    };

    return { cloneCosts, exportToCSV, importFromCSV };
};
