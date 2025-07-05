import React from "react";
import { MasterData } from "@/hooks/useMasterDataEdit";

interface EditableSelectProps {
  value: string;
  options: MasterData[];
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}

export const EditableSelect: React.FC<EditableSelectProps> = ({
  value,
  options,
  onChange,
  placeholder,
  className = "",
}) => {
  return (
    <select
      className={`border-0 p-1 h-8 w-full ${className}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.name}
        </option>
      ))}
    </select>
  );
};