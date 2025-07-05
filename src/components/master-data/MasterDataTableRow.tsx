import React from "react";
import { MasterData, useMasterDataEdit } from "@/hooks/useMasterDataEdit";
import { EditableSelect } from "./EditableSelect";
import { EditableInput } from "./EditableInput";
import { RowActions } from "./RowActions";

interface MasterDataTableRowProps {
  item: MasterData;
  index: number;
  companies: MasterData[];
  customers: MasterData[];
  showCompanyColumn: boolean;
  showCustomerColumn: boolean;
  handleCellEdit: (id: string, field: keyof MasterData, value: string) => void;
  deleteItem: (id: string) => void;
  addRowBelow: (index: number) => void;
  setIsEditing: (editing: boolean) => void;
}

export const MasterDataTableRow: React.FC<MasterDataTableRowProps> = ({
  item,
  index,
  companies,
  customers,
  showCompanyColumn,
  showCustomerColumn,
  handleCellEdit,
  deleteItem,
  addRowBelow,
  setIsEditing,
}) => {
  const {
    handleInputChange,
    handleInputFocus,
    handleInputBlur,
    handleKeyDown,
    getInputValue,
  } = useMasterDataEdit({ handleCellEdit, setIsEditing });

  return (
    <tr key={item.id} className="hover:bg-gray-50 h-[40px]">
      <td className="border border-gray-300 text-center font-medium w-12 p-1">
        {index + 1}
      </td>
      
      {showCompanyColumn && (
        <EditableSelect
          item={item}
          field="company_id"
          options={companies}
          placeholder="Select company"
          value={getInputValue(item, 'company_id')}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
        />
      )}
      
      {showCustomerColumn && (
        <EditableSelect
          item={item}
          field="customer_id"
          options={customers}
          placeholder="Select customer"
          value={getInputValue(item, 'customer_id')}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
        />
      )}
      
      <EditableInput
        item={item}
        field="code"
        value={getInputValue(item, 'code')}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
      />
      
      <EditableInput
        item={item}
        field="name"
        value={getInputValue(item, 'name')}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
      />
      
      <EditableInput
        item={item}
        field="description"
        value={getInputValue(item, 'description')}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
      />
      
      <RowActions
        onAddRowBelow={() => addRowBelow(index)}
        onDelete={() => deleteItem(item.id)}
      />
    </tr>
  );
};