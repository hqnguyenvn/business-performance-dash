
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
}

const MasterDataTableHead: React.FC<MasterDataTableHeadProps> = ({
  showCompanyColumn,
  showCustomerColumn,
  data,
  setFilter,
  getActiveFilters
}) => (
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
        Code
      </TableHead>
      <TableHead 
        className="border border-gray-300"
        showFilter={true}
        filterData={data}
        filterField="name"
        onFilter={setFilter}
        activeFilters={getActiveFilters("name")}
      >
        Name
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
        Actions
      </TableHead>
    </TableRow>
  </TableHeader>
);

export default MasterDataTableHead;
