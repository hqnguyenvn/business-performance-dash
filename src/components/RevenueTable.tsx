import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import RevenueTableRow from "./RevenueTableRow";
import { Revenue } from "@/services/revenueService";
import { MasterData } from "@/services/masterDataService";
import { useTableFilter } from "@/hooks/useTableFilter";

interface RevenueTableProps {
  revenues: Revenue[];
  customers: MasterData[];
  companies: MasterData[];
  divisions: MasterData[];
  projects: MasterData[];
  projectTypes: MasterData[];
  resources: MasterData[];
  currencies: MasterData[];
  searchParams: any;
  getMonthName: (monthNumber: number) => string;
  calculateVNDRevenue: (revenue: Revenue) => number;
  onCellEdit: (id: string, field: keyof Revenue, value: any) => void;
  onInsertRowBelow: (index: number) => void;
  onCloneRevenue: (revenue: Revenue, index: number) => void;
  onOpenDialog: (revenue: Revenue, mode: 'view' | 'edit') => void;
  onDeleteRevenue: (id: string) => void;
}

const RevenueTable: React.FC<RevenueTableProps> = ({
  revenues,
  customers,
  companies,
  divisions,
  projects,
  projectTypes,
  resources,
  currencies,
  searchParams,
  getMonthName,
  calculateVNDRevenue,
  onCellEdit,
  onInsertRowBelow,
  onCloneRevenue,
  onOpenDialog,
  onDeleteRevenue,
}) => {
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  
  // Table filtering
  const { filteredData, setFilter, clearAllFilters, getActiveFilters } = useTableFilter(revenues);

  // Prepare filter data for table filters - use actual data values for filtering
  const getFilterData = (field: string) => {
    return revenues.map(revenue => {
      const value = revenue[field as keyof Revenue];
      return { [field]: value };
    });
  };

  // Helper function to get display values for filter options
  const getFilterDisplayData = (field: string) => {
    const uniqueValues = new Set();
    const displayData: any[] = [];
    
    revenues.forEach(revenue => {
      let value = revenue[field as keyof Revenue];
      let displayValue = value;
      
      // Convert IDs to codes for display but keep original value for filtering
      if (field === 'customer_id') {
        const customer = customers.find(c => c.id === value);
        displayValue = customer?.code || '';
      } else if (field === 'company_id') {
        const company = companies.find(c => c.id === value);
        displayValue = company?.code || '';
      } else if (field === 'division_id') {
        const division = divisions.find(d => d.id === value);
        displayValue = division?.code || '';
      } else if (field === 'project_id') {
        const project = projects.find(p => p.id === value);
        displayValue = project?.code || '';
      } else if (field === 'project_type_id') {
        const projectType = projectTypes.find(pt => pt.id === value);
        displayValue = projectType?.code || '';
      } else if (field === 'resource_id') {
        const resource = resources.find(r => r.id === value);
        displayValue = resource?.code || '';
      } else if (field === 'currency_id') {
        const currency = currencies.find(c => c.id === value);
        displayValue = currency?.code || '';
      } else if (field === 'month') {
        displayValue = getMonthName(value as number);
      }
      
      if (!uniqueValues.has(value)) {
        uniqueValues.add(value);
        displayData.push({ 
          id: value, 
          code: displayValue || value,
          originalValue: value 
        });
      }
    });
    
    return displayData;
  };

  return (
    <div className="border rounded-lg">
      <div className="flex">
        {/* Scrollable table content */}
        <div className="flex-1 overflow-x-auto">
          <Table>
            <TableCaption>
              A list of your recent revenue records.
            </TableCaption>
            <TableHeader className="sticky top-0 bg-white z-10">
              <TableRow>
                <TableHead className="w-[50px] border-r">No.</TableHead>
                <TableHead 
                  className="w-[60px] border-r"
                  showFilter={true}
                  filterData={getFilterData('year')}
                  filterField="year"
                  onFilter={setFilter}
                  activeFilters={getActiveFilters('year')}
                >
                  Year
                </TableHead>
                <TableHead 
                  className="w-[60px] border-r"
                  showFilter={true}
                  filterData={getFilterData('month')}
                  filterField="month"
                  onFilter={setFilter}
                  activeFilters={getActiveFilters('month')}
                >
                  Month
                </TableHead>
                <TableHead 
                  className="w-[100px] border-r"
                  showFilter={true}
                  filterData={getFilterData('customer_id')}
                  filterField="customer_id"
                  onFilter={setFilter}
                  activeFilters={getActiveFilters('customer_id')}
                >
                  Customer
                </TableHead>
                <TableHead 
                  className="w-[100px] border-r"
                  showFilter={true}
                  filterData={getFilterData('company_id')}
                  filterField="company_id"
                  onFilter={setFilter}
                  activeFilters={getActiveFilters('company_id')}
                >
                  Company
                </TableHead>
                <TableHead 
                  className="w-[100px] border-r"
                  showFilter={true}
                  filterData={getFilterData('division_id')}
                  filterField="division_id"
                  onFilter={setFilter}
                  activeFilters={getActiveFilters('division_id')}
                >
                  Division
                </TableHead>
                <TableHead 
                  className="w-[100px] border-r"
                  showFilter={true}
                  filterData={getFilterData('project_id')}
                  filterField="project_id"
                  onFilter={setFilter}
                  activeFilters={getActiveFilters('project_id')}
                >
                  Project
                </TableHead>
                <TableHead 
                  className="w-[120px] border-r"
                  showFilter={true}
                  filterData={getFilterData('project_name')}
                  filterField="project_name"
                  onFilter={setFilter}
                  activeFilters={getActiveFilters('project_name')}
                >
                  Project Name
                </TableHead>
                <TableHead 
                  className="w-[100px] border-r"
                  showFilter={true}
                  filterData={getFilterData('project_type_id')}
                  filterField="project_type_id"
                  onFilter={setFilter}
                  activeFilters={getActiveFilters('project_type_id')}
                >
                  Project Type
                </TableHead>
                <TableHead 
                  className="w-[100px] border-r"
                  showFilter={true}
                  filterData={getFilterData('resource_id')}
                  filterField="resource_id"
                  onFilter={setFilter}
                  activeFilters={getActiveFilters('resource_id')}
                >
                  Resource
                </TableHead>
                <TableHead 
                  className="w-[80px] border-r"
                  showFilter={true}
                  filterData={getFilterData('currency_id')}
                  filterField="currency_id"
                  onFilter={setFilter}
                  activeFilters={getActiveFilters('currency_id')}
                >
                  Currency
                </TableHead>
                <TableHead className="w-[100px] text-right border-r">Unit Price</TableHead>
                <TableHead className="w-[80px] text-right border-r">BMM</TableHead>
                <TableHead className="w-[120px] text-right border-r">Original Revenue</TableHead>
                <TableHead className="w-[120px] text-right border-r">VND Revenue</TableHead>
                <TableHead 
                  className="w-[120px] border-r"
                  showFilter={true}
                  filterData={getFilterData('notes')}
                  filterField="notes"
                  onFilter={setFilter}
                  activeFilters={getActiveFilters('notes')}
                >
                  Notes
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((revenue, index) => (
                <RevenueTableRow
                  key={revenue.id}
                  revenue={revenue}
                  index={index}
                  pageIndex={searchParams.page!}
                  pageSize={searchParams.pageSize!}
                  editingCell={editingCell}
                  customers={customers}
                  companies={companies}
                  divisions={divisions}
                  projects={projects}
                  projectTypes={projectTypes}
                  resources={resources}
                  currencies={currencies}
                  getMonthName={getMonthName}
                  calculateVNDRevenue={calculateVNDRevenue}
                  onCellEdit={onCellEdit}
                  setEditingCell={setEditingCell}
                  onInsertRowBelow={onInsertRowBelow}
                  onCloneRevenue={onCloneRevenue}
                  onOpenDialog={onOpenDialog}
                  onDeleteRevenue={onDeleteRevenue}
                />
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Fixed Actions column */}
        <div className="w-[140px] border-l-2 border-gray-200 bg-white">
          <div className="h-12 px-4 text-left align-middle font-medium text-muted-foreground flex items-center justify-center border-b">
            Actions
          </div>
          {filteredData.map((revenue, index) => (
            <div key={`actions-${revenue.id}`} className="h-[53px] flex items-center justify-center border-b">
              <div className="flex justify-center gap-1">
                {/* Action buttons will be rendered here from RevenueTableRow */}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RevenueTable;
