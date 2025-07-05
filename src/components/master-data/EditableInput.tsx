
import React from "react";

interface EditableInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const EditableInput: React.FC<EditableInputProps> = ({
  value,
  onChange,
  placeholder = "",
  className = "",
}) => {
  return (
    <input
      className={`border-0 p-1 h-8 w-full ${className}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
};
