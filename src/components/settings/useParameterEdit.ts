
import { useState } from "react";
import { Parameter } from "@/services/parameterService";

export const useParameterEdit = () => {
  const [editingCell, setEditingCell] = useState<{ id: string; field: keyof Parameter } | null>(null);

  const onEditCell = (id: string, field: keyof Parameter) => {
    setEditingCell({ id, field });
  };

  const onBlurCell = () => {
    setEditingCell(null);
  };

  return {
    editingCell,
    onEditCell,
    onBlurCell,
  };
};
