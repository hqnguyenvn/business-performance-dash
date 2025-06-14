
import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import RevenueTableRow from "./RevenueTableRow"; // Default import
import { RevenueRowActions } from "./RevenueTableRow"; // Named import
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
  searchParams: any; // Contains page and pageSize
  getMonthName: (monthNumber: number) => string;
  calculateVNDRevenue: (revenue: Revenue) => number;
  onCellEdit: (id: string, field: keyof Revenue, value: any) => void;
  onInsertRowBelow: (globalIndex: number) => void;
  onCloneRevenue: (revenue: Revenue, globalIndex: number) => void;
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
  
  const { filteredData, setFilter, clearAllFilters, getActiveFilters } = useTableFilter(revenues);

  // Prepare filter data for table filters - use actual data values for filtering
  const getFilterData = (field: string) => {
    return revenues.map(revenue => {
      const value = revenue[field as keyof Revenue];
      return { [field]: value };
    });
  };

  const getFilterDisplayData = (field: string) => {
    const uniqueValues = new Set();
    const displayData: any[] = [];
    
    revenues.forEach(revenue => {
      let value = revenue[field as keyof Revenue];
      let displayValue = value;
      
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
                  filterData={getFilterDisplayData('year')}
                  filterField="year"
                  onFilter={setFilter}
                  activeFilters={getActiveFilters('year')}
                >
                  Year
                </TableHead>
                <TableHead 
                  className="w-[60px] border-r"
                  showFilter={true}
                  filterData={getFilterDisplayData('month')}
                  filterField="month"
                  onFilter={setFilter}
                  activeFilters={getActiveFilters('month')}
                >
                  Month
                </TableHead>
                <TableHead 
                  className="w-[100px] border-r"
                  showFilter={true}
                  filterData={getFilterDisplayData('customer_id')}
                  filterField="customer_id"
                  onFilter={setFilter}
                  activeFilters={getActiveFilters('customer_id')}
                >
                  Customer
                </TableHead>
                <TableHead 
                  className="w-[100px] border-r"
                  showFilter={true}
                  filterData={getFilterDisplayData('company_id')}
                  filterField="company_id"
                  onFilter={setFilter}
                  activeFilters={getActiveFilters('company_id')}
                >
                  Company
                </TableHead>
                <TableHead 
                  className="w-[100px] border-r"
                  showFilter={true}
                  filterData={getFilterDisplayData('division_id')}
                  filterField="division_id"
                  onFilter={setFilter}
                  activeFilters={getActiveFilters('division_id')}
                >
                  Division
                </TableHead>
                <TableHead 
                  className="w-[100px] border-r"
                  showFilter={true}
                  filterData={getFilterDisplayData('project_id')}
                  filterField="project_id"
                  onFilter={setFilter}
                  activeFilters={getActiveFilters('project_id')}
                >
                  Project
                </TableHead>
                <TableHead 
                  className="w-[120px] border-r"
                  showFilter={true}
                  filterData={getFilterDisplayData('project_name')}
                  filterField="project_name"
                  onFilter={setFilter}
                  activeFilters={getActiveFilters('project_name')}
                >
                  Project Name
                </TableHead>
                <TableHead 
                  className="w-[100px] border-r"
                  showFilter={true}
                  filterData={getFilterDisplayData('project_type_id')}
                  filterField="project_type_id"
                  onFilter={setFilter}
                  activeFilters={getActiveFilters('project_type_id')}
                >
                  Project Type
                </TableHead>
                <TableHead 
                  className="w-[100px] border-r"
                  showFilter={true}
                  filterData={getFilterDisplayData('resource_id')}
                  filterField="resource_id"
                  onFilter={setFilter}
                  activeFilters={getActiveFilters('resource_id')}
                >
                  Resource
                </TableHead>
                <TableHead 
                  className="w-[80px] border-r"
                  showFilter={true}
                  filterData={getFilterDisplayData('currency_id')}
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
                  filterData={getFilterDisplayData('notes')}
                  filterField="notes"
                  onFilter={setFilter}
                  activeFilters={getActiveFilters('notes')}
                >
                  Notes
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((revenue, pageSpecificIndex) => (
                <RevenueTableRow
                  key={revenue.id}
                  revenue={revenue}
                  index={pageSpecificIndex}
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
                  // These are passed to RevenueTableRow but not directly used by RevenueRowActions from here
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
        <div className="w-[200px] border-l-2 border-gray-200 bg-white"> {/* Increased width for all buttons */}
          <div className="h-12 px-4 text-left align-middle font-medium text-muted-foreground flex items-center justify-center border-b sticky top-0 bg-white z-10">
            Actions
          </div>
          {filteredData.map((revenue, pageSpecificIndex) => {
            // Calculate globalIndex for handlers that expect it
            // Note: searchParams.page is 1-based, pageSpecificIndex is 0-based
            const globalIndex = (searchParams.page! - 1) * searchParams.pageSize! + pageSpecificIndex;
            return (
              <div key={`actions-${revenue.id}`} className="h-[53px] flex items-center justify-center border-b">
                <RevenueRowActions
                  revenue={revenue}
                  index={pageSpecificIndex} // Pass pageSpecificIndex; RRA will use this when calling its onInsert/onClone
                  onInsertRowBelow={() => onInsertRowBelow(globalIndex)}
                  onCloneRevenue={() => onCloneRevenue(revenue, globalIndex)}
                  onOpenDialog={onOpenDialog} // onOpenDialog expects (revenue, mode), RRA will provide these
                  onDeleteRevenue={onDeleteRevenue} // onDeleteRevenue expects (id), RRA will provide this
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RevenueTable;

