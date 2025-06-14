import { Revenue } from "@/types/revenue";
import { MasterData } from "@/services/masterDataService";
import { Cost } from "@/services/costService";

interface CostsCSVExportOptions {
  costs: Cost[];
  costTypes: MasterData[];
  getMonthName: (monthNumber: number) => string;
}

export const exportCostsCSV = ({
  costs,
  costTypes,
  getMonthName,
}: CostsCSVExportOptions) => {
  const headers = [
    'Year',
    'Month',
    'Description',
    'Unit Price',
    'Volume',
    'Cost',
    'Category',
    'Is Cost',
    'Checked',
    'Notes'
  ];

  const getCostTypeName = (costTypeId: string) => {
    return costTypes.find(c => c.id === costTypeId)?.code || costTypeId;
  };

  const rows = costs.map((cost) => {
    return [
      cost.year,
      getMonthName(cost.month).substring(0, 3),
      cost.description || '',
      cost.price || 0,
      cost.volume || 0,
      cost.cost,
      getCostTypeName(cost.cost_type),
      cost.is_cost ? 'TRUE' : 'FALSE',
      cost.is_checked ? 'TRUE' : 'FALSE',
      cost.notes || ''
    ];
  });

  const csvContent = [headers, ...rows]
    .map(row => 
      row.map(field => {
        const stringField = String(field);
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
          return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
      }).join(',')
    )
    .join('\n');

  const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    const currentDate = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `costs_export_${currentDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};


interface CSVExportOptions {
  revenues: Revenue[];
  customers: MasterData[];
  companies: MasterData[];
  divisions: MasterData[];
  projects: MasterData[];
  projectTypes: MasterData[];
  resources: MasterData[];
  currencies: MasterData[];
  getMonthName: (monthNumber: number) => string;
  calculateVNDRevenue: (revenue: Revenue) => number;
}

export const exportRevenueCSV = ({
  revenues,
  customers,
  companies,
  divisions,
  projects,
  projectTypes,
  resources,
  currencies,
  getMonthName,
  calculateVNDRevenue,
}: CSVExportOptions) => {
  // CSV headers
  const headers = [
    'No.',
    'Year',
    'Month',
    'Customer',
    'Company',
    'Division',
    'Project',
    'Project Name',
    'Project Type',
    'Resource',
    'Currency',
    'Unit Price',
    'BMM',
    'Original Revenue',
    'VND Revenue',
    'Notes'
  ];

  // Convert data to CSV rows
  const rows = revenues.map((revenue, index) => {
    const customer = customers.find(c => c.id === revenue.customer_id);
    const company = companies.find(c => c.id === revenue.company_id);
    const division = divisions.find(d => d.id === revenue.division_id);
    const project = projects.find(p => p.id === revenue.project_id);
    const projectType = projectTypes.find(pt => pt.id === revenue.project_type_id);
    const resource = resources.find(r => r.id === revenue.resource_id);
    const currency = currencies.find(c => c.id === revenue.currency_id);

    return [
      (index + 1).toString(),
      revenue.year.toString(),
      getMonthName(revenue.month),
      customer?.code || '',
      company?.code || '',
      division?.code || '',
      project?.code || '',
      revenue.project_name || '',
      projectType?.code || '',
      resource?.code || '',
      currency?.code || '',
      revenue.unit_price?.toString() || '',
      revenue.quantity?.toString() || '',
      revenue.original_amount.toLocaleString(),
      calculateVNDRevenue(revenue).toLocaleString(),
      revenue.notes || ''
    ];
  });

  // Combine headers and rows
  const csvContent = [headers, ...rows]
    .map(row => 
      row.map(field => {
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        const stringField = String(field);
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
          return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
      }).join(',')
    )
    .join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    // Generate filename with current date
    const currentDate = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `revenue_export_${currentDate}.csv`);
    
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
