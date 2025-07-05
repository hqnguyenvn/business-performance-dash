
import React from "react";
import {
  TableHeader,
  TableRow,
  TableHead
} from "@/components/ui/table";

interface MasterDataTableHeadProps {
  showCompanyColumn: boolean;
  showCustomerColumn: boolean;
  data: any[];  
  setFilter: (field: string, values: string[]) => void;
  getActiveFilters: (field: string) => string[];
  onAddNewItem?: () => void;
  title?: string;
}

const MasterDataTableHead: React.FC<MasterDataTableHeadProps> = ({
  showCompanyColumn,
  showCustomerColumn,
  data,
  setFilter,
  getActiveFilters,
  onAddNewItem,
  title
}) => {
  const getColumnName = (field: string) => {
    if (title === "Project List") {
      if (field === "code") return "Project Code";
      if (field === "name") return "Project Name";
    }
    return field === "code" ? "Code" : field === "name" ? "Name" : field;
  };
  
  return (
  <TableHeader>
    <TableRow className="bg-gray-50">
      <TableHead className="border border-gray-300 w-12 text-center">
        No.
      </TableHead>
      {showCompanyColumn && (
        <TableHead 
          className="border border-gray-300"
          showFilter={true}
          filterData={data}
          filterField="company_id"
          onFilter={setFilter}
          activeFilters={getActiveFilters("company_id")}
        >
          Company
        </TableHead>
      )}
      {showCustomerColumn && (
        <TableHead 
          className="border border-gray-300"
          showFilter={true}
          filterData={data}
          filterField="customer_id"
          onFilter={setFilter}
          activeFilters={getActiveFilters("customer_id")}
        >
          Customer
        </TableHead>
      )}
      <TableHead 
        className="border border-gray-300"
        showFilter={true}
        filterData={data}
        filterField="code"
        onFilter={setFilter}
        activeFilters={getActiveFilters("code")}
      >
        {getColumnName("code")}
      </TableHead>
      <TableHead 
        className="border border-gray-300"
        showFilter={true}
        filterData={data}
        filterField="name"
        onFilter={setFilter}
        activeFilters={getActiveFilters("name")}
      >
        {getColumnName("name")}
      </TableHead>
      <TableHead 
        className="border border-gray-300"
        showFilter={true}
        filterData={data}
        filterField="description"
        onFilter={setFilter}
        activeFilters={getActiveFilters("description")}
      >
        Description
      </TableHead>
      <TableHead className="border border-gray-300 text-center">
        <div className="flex items-center justify-center gap-2">
          <span>Actions</span>
          {onAddNewItem && (
            <button
              onClick={onAddNewItem}
              className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-blue-600 transition-colors"
              title="Add new record at top"
            >
              +
            </button>
          )}
        </div>
      </TableHead>
    </TableRow>
  </TableHeader>
  );
};

export default MasterDataTableHead;
