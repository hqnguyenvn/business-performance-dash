import React from "react";
import { MasterData } from "@/hooks/useMasterDataEdit";

interface EditableSelectProps {
  item: MasterData;
  field: keyof MasterData;
  options: MasterData[];
  placeholder: string;
  value: string;
  onChange: (id: string, field: keyof MasterData, value: string) => void;
  onFocus: () => void;
  onBlur: (id: string, field: keyof MasterData) => void;
  onKeyDown: (e: React.KeyboardEvent, id: string, field: keyof MasterData) => void;
}

export const EditableSelect: React.FC<EditableSelectProps> = ({
  item,
  field,
  options,
  placeholder,
  value,
  onChange,
  onFocus,
  onBlur,
  onKeyDown,
}) => {
  return (
    <td className="border border-gray-300 p-1">
      <select
        className="border-0 p-1 h-8 w-full"
        value={value}
        onChange={(e) => onChange(item.id, field, e.target.value)}
        onFocus={onFocus}
        onBlur={() => onBlur(item.id, field)}
        onKeyDown={(e) => onKeyDown(e, item.id, field)}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </td>
  );
};