
import React from "react";
import { MasterData } from "@/hooks/useMasterDataEdit";
import { MasterDataTableRow } from "./master-data/MasterDataTableRow";

interface MasterDataTableBodyProps {
  data: MasterData[];
  companies: MasterData[];
  customers: MasterData[];
  showCompanyColumn: boolean;
  showCustomerColumn: boolean;
  handleCellEdit: (id: string, field: keyof MasterData, value: string) => void;
  deleteItem: (id: string) => void;
  addRowBelow: (index: number) => void;
  setIsEditing: (editing: boolean) => void;
}

const MasterDataTableBody: React.FC<MasterDataTableBodyProps> = ({
  data,
  companies,
  customers,
  showCompanyColumn,
  showCustomerColumn,
  handleCellEdit,
  deleteItem,
  addRowBelow,
  setIsEditing,
}) => {
  return (
    <>
      {data.map((item, idx) => (
        <MasterDataTableRow
          key={item.id}
          item={item}
          index={idx}
          companies={companies}
          customers={customers}
          showCompanyColumn={showCompanyColumn}
          showCustomerColumn={showCustomerColumn}
          handleCellEdit={handleCellEdit}
          deleteItem={deleteItem}
          addRowBelow={addRowBelow}
          setIsEditing={setIsEditing}
        />
      ))}
    </>
  );
};

export default MasterDataTableBody;
