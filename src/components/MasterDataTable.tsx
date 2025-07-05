
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody
} from "@/components/ui/table";
import MasterDataTableHead from "./MasterDataTableHead";
import MasterDataTableBody from "./MasterDataTableBody";
import { useMasterDataTableLogic, MasterDataService } from "./useMasterDataTableLogic";
import { MasterData } from "@/hooks/useMasterDataEdit";

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

  return (
    <Card className="bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
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
              onAddNewItem={addNewItem}
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
