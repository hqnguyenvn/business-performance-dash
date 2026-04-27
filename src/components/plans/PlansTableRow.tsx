import React, { useState } from "react";
import { AnnualPlan } from "@/types/plan";
import { MasterData } from "@/services/masterDataService";
import { MONTH_LABELS } from "@/types/employee";
import { RowActions } from "@/components/master-data/RowActions";

interface PlansTableRowProps {
  item: AnnualPlan;
  index: number;
  companies: MasterData[];
  currencies: MasterData[];
  handleCellEdit: (
    id: string,
    field: keyof AnnualPlan,
    value: string | number | null,
  ) => void;
  deleteItem: (id: string) => void;
  addRowBelow: (index: number) => void;
}

export const PlansTableRow: React.FC<PlansTableRowProps> = ({
  item,
  index,
  companies,
  currencies,
  handleCellEdit,
  deleteItem,
  addRowBelow,
}) => {
  const [editing, setEditing] = useState<Record<string, string>>({});

  const getValue = (field: keyof AnnualPlan): string => {
    const key = `${item.id}-${field}`;
    if (editing[key] !== undefined) return editing[key];
    const v = item[field];
    return v === null || v === undefined ? "" : String(v);
  };

  const handleChange = (field: keyof AnnualPlan, value: string) => {
    setEditing((prev) => ({ ...prev, [`${item.id}-${field}`]: value }));
  };

  const handleBlur = (field: keyof AnnualPlan) => {
    const key = `${item.id}-${field}`;
    const value = editing[key];
    if (value === undefined) return;
    let normalized: string | number = value;
    if (field === "bmm" || field === "revenue" || field === "year" || field === "month") {
      const n = Number(value);
      if (!Number.isFinite(n)) {
        setEditing((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
        return;
      }
      normalized = n;
    }
    handleCellEdit(item.id, field, normalized);
    setEditing((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSelectChange = (
    field: keyof AnnualPlan,
    value: string | null,
  ) => {
    let normalized: string | number | null = value;
    if (field === "month" || field === "year") {
      const n = Number(value);
      normalized = Number.isFinite(n) ? n : null;
    }
    handleCellEdit(item.id, field, normalized);
  };

  return (
    <tr className="hover:bg-gray-50 h-[40px]">
      <td className="border border-gray-300 text-center font-medium w-12 p-1">
        {index + 1}
      </td>
      <td className="border border-gray-300 p-1">
        <input
          type="number"
          className="border-0 p-1 h-8 w-full"
          value={getValue("year")}
          onChange={(e) => handleChange("year", e.target.value)}
          onBlur={() => handleBlur("year")}
        />
      </td>
      <td className="border border-gray-300 p-1">
        <select
          className="border-0 p-1 h-8 w-full"
          value={item.month || 1}
          onChange={(e) => handleSelectChange("month", e.target.value)}
        >
          {MONTH_LABELS.map((label, idx) => (
            <option key={idx + 1} value={idx + 1}>
              {label.charAt(0) + label.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      </td>
      <td className="border border-gray-300 p-1">
        <select
          className="border-0 p-1 h-8 w-full"
          value={item.company_id || ""}
          onChange={(e) => handleSelectChange("company_id", e.target.value)}
        >
          <option value="">Select company</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code}
            </option>
          ))}
        </select>
      </td>
      <td className="border border-gray-300 p-1">
        <input
          type="number"
          className="border-0 p-1 h-8 w-full text-right"
          value={getValue("bmm")}
          onChange={(e) => handleChange("bmm", e.target.value)}
          onBlur={() => handleBlur("bmm")}
        />
      </td>
      <td className="border border-gray-300 p-1">
        <input
          type="number"
          className="border-0 p-1 h-8 w-full text-right"
          value={getValue("revenue")}
          onChange={(e) => handleChange("revenue", e.target.value)}
          onBlur={() => handleBlur("revenue")}
        />
      </td>
      <td className="border border-gray-300 p-1">
        <select
          className="border-0 p-1 h-8 w-full"
          value={item.currency_id || ""}
          onChange={(e) =>
            handleSelectChange("currency_id", e.target.value || null)
          }
        >
          <option value="">—</option>
          {currencies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code}
            </option>
          ))}
        </select>
      </td>
      <td className="border border-gray-300 p-1">
        <input
          className="border-0 p-1 h-8 w-full"
          value={getValue("notes")}
          onChange={(e) => handleChange("notes", e.target.value)}
          onBlur={() => handleBlur("notes")}
        />
      </td>
      <RowActions
        onAddRowBelow={() => addRowBelow(index)}
        onDelete={() => deleteItem(item.id)}
      />
    </tr>
  );
};
