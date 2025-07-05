import React from "react";
import { MasterData, useMasterDataEdit } from "@/hooks/useMasterDataEdit";
import { EditableSelect } from "./EditableSelect";
import { EditableInput } from "./EditableInput";
import { RowActions } from "./RowActions";
import { TableCell, TableRow } from "@/components/ui/table";

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
  saveTempRecord: (tempRecord: MasterData) => Promise<boolean>;
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
  saveTempRecord,
}) => {
  const isTemp = item.id.startsWith("tmp-");

  const handleBlur = async () => {
    if (isTemp && (item.code?.trim() || item.name?.trim())) {
      await saveTempRecord(item);
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isTemp && (item.code?.trim() || item.name?.trim())) {
      await saveTempRecord(item);
    }
  };

  return (
    <TableRow 
      className={`${isTemp ? 'bg-blue-50' : ''} hover:bg-gray-50`}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    >
      <TableCell className="border border-gray-300 text-center text-sm">
        {index + 1}
      </TableCell>
      
      {showCompanyColumn && (
        <TableCell className="border border-gray-300">
          <EditableSelect
            value={item.company_id || ""}
            options={companies}
            onChange={(value) => handleCellEdit(item.id, "company_id", value)}
            placeholder="Select company"
          />
        </TableCell>
      )}
      
      {showCustomerColumn && (
        <TableCell className="border border-gray-300">
          <EditableSelect
            value={item.customer_id || ""}
            options={customers}
            onChange={(value) => handleCellEdit(item.id, "customer_id", value)}
            placeholder="Select customer"
          />
        </TableCell>
      )}
      
      <TableCell className="border border-gray-300">
        <EditableInput
          value={item.code || ""}
          onChange={(value) => handleCellEdit(item.id, "code", value)}
          placeholder="Enter code"
        />
      </TableCell>
      
      <TableCell className="border border-gray-300">
        <EditableInput
          value={item.name || ""}
          onChange={(value) => handleCellEdit(item.id, "name", value)}
          placeholder="Enter name"
        />
      </TableCell>
      
      <TableCell className="border border-gray-300">
        <EditableInput
          value={item.description || ""}
          onChange={(value) => handleCellEdit(item.id, "description", value)}
          placeholder="Enter description"
        />
      </TableCell>
      
      <TableCell className="border border-gray-300">
        <RowActions
          onDelete={() => deleteItem(item.id)}
          onAddBelow={() => addRowBelow(index)}
        />
      </TableCell>
    </TableRow>
  );
};

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