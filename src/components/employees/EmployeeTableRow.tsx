import React, { useState, useCallback } from "react";
import { Employee, EMPLOYEE_TYPES, EMPLOYEE_CATEGORIES, EMPLOYEE_STATUSES } from "@/types/employee";
import { MasterData } from "@/hooks/useMasterDataEdit";
import { Role } from "@/types/role";
import { RowActions } from "@/components/master-data/RowActions";

interface EmployeeTableRowProps {
  item: Employee;
  index: number;
  divisions: MasterData[];
  roles: Role[];
  handleCellEdit: (id: string, field: keyof Employee, value: string) => void;
  deleteItem: (id: string) => void;
  addRowBelow: (index: number) => void;
}

export const EmployeeTableRow: React.FC<EmployeeTableRowProps> = ({
  item,
  index,
  divisions,
  roles,
  handleCellEdit,
  deleteItem,
  addRowBelow,
}) => {
  const [editingValues, setEditingValues] = useState<Record<string, string>>({});

  const getValue = (field: keyof Employee) => {
    const key = `${item.id}-${field}`;
    return editingValues[key] !== undefined ? editingValues[key] : ((item[field] as string) || "");
  };

  const handleChange = (field: keyof Employee, value: string) => {
    const key = `${item.id}-${field}`;
    setEditingValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleBlur = (field: keyof Employee) => {
    const key = `${item.id}-${field}`;
    const value = editingValues[key];
    if (value !== undefined) {
      handleCellEdit(item.id, field, value);
      setEditingValues((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleSelectChange = (field: keyof Employee, value: string) => {
    handleCellEdit(item.id, field, value);
  };

  return (
    <tr className="hover:bg-gray-50 h-[40px]">
      <td className="border border-gray-300 text-center font-medium w-12 p-1">
        {index + 1}
      </td>
      <td className="border border-gray-300 p-1">
        <input
          className="border-0 p-1 h-8 w-full"
          value={getValue("username")}
          onChange={(e) => handleChange("username", e.target.value)}
          onBlur={() => handleBlur("username")}
        />
      </td>
      <td className="border border-gray-300 p-1">
        <input
          className="border-0 p-1 h-8 w-full"
          value={getValue("name")}
          onChange={(e) => handleChange("name", e.target.value)}
          onBlur={() => handleBlur("name")}
        />
      </td>
      <td className="border border-gray-300 p-1">
        <select
          className="border-0 p-1 h-8 w-full"
          value={item.type || ""}
          onChange={(e) => handleSelectChange("type", e.target.value)}
        >
          <option value="">Select type</option>
          {EMPLOYEE_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </td>
      <td className="border border-gray-300 p-1">
        <select
          className="border-0 p-1 h-8 w-full"
          value={item.division_id || ""}
          onChange={(e) => handleSelectChange("division_id", e.target.value)}
        >
          <option value="">Select division</option>
          {divisions.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </td>
      <td className="border border-gray-300 p-1">
        <select
          className="border-0 p-1 h-8 w-full"
          value={item.role_id || ""}
          onChange={(e) => handleSelectChange("role_id", e.target.value)}
        >
          <option value="">Select role</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>{r.code}</option>
          ))}
        </select>
      </td>
      <td className="border border-gray-300 p-1">
        <select
          className="border-0 p-1 h-8 w-full"
          value={item.category || ""}
          onChange={(e) => handleSelectChange("category", e.target.value)}
        >
          <option value="">Select category</option>
          {EMPLOYEE_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </td>
      <td className="border border-gray-300 p-1">
        <select
          className="border-0 p-1 h-8 w-full"
          value={item.status || "Working"}
          onChange={(e) => handleSelectChange("status", e.target.value)}
        >
          {EMPLOYEE_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </td>
      <RowActions
        onAddRowBelow={() => addRowBelow(index)}
        onDelete={() => deleteItem(item.id)}
      />
    </tr>
  );
};
