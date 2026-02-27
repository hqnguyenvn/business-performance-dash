import { useState, useCallback } from "react";

export interface MasterData {
  id: string;
  code: string;
  name: string;
  description?: string;
  company_id?: string;
  customer_id?: string;
}

interface UseMasterDataEditProps {
  handleCellEdit: (id: string, field: keyof MasterData, value: string) => void;
  setIsEditing: (editing: boolean) => void;
}

export const useMasterDataEdit = ({ handleCellEdit, setIsEditing }: UseMasterDataEditProps) => {
  const [editingValues, setEditingValues] = useState<Record<string, any>>({});

  const handleInputChange = useCallback((id: string, field: keyof MasterData, value: string) => {
    const key = `${id}-${field}`;
    setEditingValues(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleInputFocus = useCallback(() => {
    setIsEditing(true);
  }, [setIsEditing]);

  const handleInputBlur = useCallback((id: string, field: keyof MasterData) => {
    setIsEditing(false);
    const key = `${id}-${field}`;
    const value = editingValues[key];
    if (value !== undefined) {
      handleCellEdit(id, field, value);
      setEditingValues(prev => {
        const newValues = { ...prev };
        delete newValues[key];
        return newValues;
      });
    }
  }, [editingValues, handleCellEdit, setIsEditing]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, id: string, field: keyof MasterData) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      setIsEditing(false);
      handleInputBlur(id, field);
      // Focus next input if needed
      const currentElement = e.target as HTMLElement;
      const nextElement = currentElement.closest('td')?.nextElementSibling?.querySelector('input, select') as HTMLElement;
      if (nextElement) {
        setTimeout(() => {
          nextElement.focus();
          setIsEditing(true);
        }, 0);
      }
    }
  }, [handleInputBlur, setIsEditing]);

  const getInputValue = useCallback((item: MasterData, field: keyof MasterData) => {
    const key = `${item.id}-${field}`;
    return editingValues[key] !== undefined ? editingValues[key] : (item[field] || "");
  }, [editingValues]);

  return {
    handleInputChange,
    handleInputFocus,
    handleInputBlur,
    handleKeyDown,
    getInputValue,
  };
};