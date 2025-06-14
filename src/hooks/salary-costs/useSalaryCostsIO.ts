
import Papa from 'papaparse';
import { useToast } from "@/hooks/use-toast";
import { SalaryCost, SalaryCostInsert } from '@/services/salaryCostService';
import { MasterData } from '@/services/masterDataService';
import { useSalaryCostsMutations } from './useSalaryCostsMutations';

interface UseSalaryCostsIOProps {
  filteredSalaryCosts: SalaryCost[];
  companies: MasterData[];
  divisions: MasterData[];
  customers: MasterData[];
  getMonthName: (month: number) => string;
  getMonthNumber: (name: string) => number;
  getMasterDataName: (id: string | null, data: MasterData[], field?: 'code' | 'name') => string;
  getMasterDataId: (code: string, data: MasterData[]) => string | null;
}

export const useSalaryCostsIO = ({
  filteredSalaryCosts,
  companies,
  divisions,
  customers,
  getMonthName,
  getMonthNumber,
  getMasterDataName,
  getMasterDataId,
}: UseSalaryCostsIOProps) => {
  const { toast } = useToast();
  const { bulkCreateSalaryCostMutation } = useSalaryCostsMutations();

  const exportToCSV = () => {
    const dataToExport = filteredSalaryCosts.map(cost => ({
      Year: cost.year,
      Month: getMonthName(cost.month),
      Company: getMasterDataName(cost.company_id, companies, 'code'),
      Division: getMasterDataName(cost.division_id, divisions, 'code'),
      Customer: getMasterDataName(cost.customer_id, customers, 'code'),
      Amount: cost.amount,
      Notes: cost.notes,
    }));

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `salary_costs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Success", description: "Salary costs exported to CSV." });
  };

  const importFromCSV = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const costsToImport: SalaryCostInsert[] = results.data.map((row: any) => ({
              year: parseInt(row.Year),
              month: getMonthNumber(row.Month),
              company_id: getMasterDataId(row.Company, companies),
              division_id: getMasterDataId(row.Division, divisions),
              customer_id: getMasterDataId(row.Customer, customers),
              amount: parseFloat(row.Amount),
              notes: row.Notes,
            })).filter(cost => !isNaN(cost.year) && !isNaN(cost.month) && !isNaN(cost.amount));
            
            if (costsToImport.length > 0) {
              bulkCreateSalaryCostMutation.mutate(costsToImport);
            } else {
              toast({ variant: 'destructive', title: 'Import Error', description: 'No valid data found in CSV file.' });
            }
          },
          error: (error) => {
            toast({ variant: 'destructive', title: 'Import Error', description: error.message });
          }
        });
      }
    };
    input.click();
  };
  
  const cloneSalaryCosts = (fromYear: number, fromMonth: number, toYear: number, toMonth: number) => {
    const costsToClone = filteredSalaryCosts.filter(c => c.year === fromYear && c.month === fromMonth);
    const newCosts: SalaryCostInsert[] = costsToClone.map(cost => {
      const { id, created_at, updated_at, ...rest } = cost;
      return { ...rest, year: toYear, month: toMonth };
    });

    if (newCosts.length > 0) {
      bulkCreateSalaryCostMutation.mutate(newCosts, {
        onSuccess: () => {
           toast({ title: "Success", description: `Cloned ${newCosts.length} records to ${toYear}-${toMonth}.` });
        }
      });
    } else {
      toast({ title: "No data", description: `No salary costs found for ${fromYear}-${fromMonth} to clone.` });
    }
  };

  return { exportToCSV, importFromCSV, cloneSalaryCosts };
};
