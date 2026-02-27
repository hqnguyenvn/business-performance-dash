
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Plus } from "lucide-react";
import MasterDataTableHead from "./MasterDataTableHead";
import MasterDataTableBody from "./MasterDataTableBody";
import { useMasterDataTableLogic, MasterDataService } from "./useMasterDataTableLogic";
import { MasterData } from "@/hooks/useMasterDataEdit";
import { exportToCsv } from "@/utils/exportCsv";

interface MasterDataTableProps {
  data: MasterData[];
  setter: React.Dispatch<React.SetStateAction<MasterData[]>>;
  title: string;
  showCompanyColumn?: boolean;
  showCustomerColumn?: boolean;
  companies?: MasterData[];
  customers?: MasterData[];
  service: MasterDataService;
}

const MasterDataTable: React.FC<MasterDataTableProps> = ({
  data,
  setter,
  title,
  showCompanyColumn = false,
  showCustomerColumn = false,
  companies = [],
  customers = [],
  service,
}) => {
  const {
    filteredData,
    setFilter,
    getActiveFilters,
    handleCellEdit,
    deleteItem,
    addRowBelow,
    addNewItem,
    deleteId,
    setDeleteId,
    setIsEditing,
  } = useMasterDataTableLogic({
    data,
    setter,
    companies,
    customers,
    showCompanyColumn,
    showCustomerColumn,
    service,
  });

  const handleExport = () => {
    const columns: { key: string; header: string }[] = [
      { key: "code", header: "Code" },
      { key: "name", header: "Name" },
      { key: "description", header: "Description" },
    ];
    if (showCompanyColumn) {
      columns.push({ key: "company_name", header: "Company" });
    }
    if (showCustomerColumn) {
      columns.push({ key: "customer_name", header: "Customer" });
    }
    const exportData = data.map((item) => ({
      ...item,
      company_name: showCompanyColumn
        ? companies.find((c) => c.id === item.company_id)?.name || ""
        : undefined,
      customer_name: showCustomerColumn
        ? customers.find((c) => c.id === item.customer_id)?.name || ""
        : undefined,
    }));
    const filename = title.replace(/\s+/g, "_");
    exportToCsv(exportData, filename, columns);
  };

  return (
    <Card className="bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button onClick={addNewItem} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add {title.replace(" List", "")}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <MasterDataTableHead
              showCompanyColumn={showCompanyColumn}
              showCustomerColumn={showCustomerColumn}
              data={data}
              setFilter={setFilter}
              getActiveFilters={getActiveFilters}
              title={title}
            />
            <TableBody>
              <MasterDataTableBody
                data={filteredData}
                companies={companies}
                customers={customers}
                showCompanyColumn={showCompanyColumn}
                showCustomerColumn={showCustomerColumn}
                handleCellEdit={handleCellEdit}
                deleteItem={deleteItem}
                addRowBelow={addRowBelow}
                setIsEditing={setIsEditing}
              />
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default MasterDataTable;
