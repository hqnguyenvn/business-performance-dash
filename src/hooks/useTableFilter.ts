
import { useState, useMemo, useEffect } from "react";

export interface FilterState {
  [field: string]: string[];
}

export const useTableFilter = <T extends Record<string, any>>(data: T[]) => {
  const [filters, setFilters] = useState<FilterState>({});

  // Reset filters only when completely new data is loaded
  const dataHash = JSON.stringify(data.map(d => d.id));
  useEffect(() => {
    setFilters({});
  }, [dataHash]);

  const filteredData = useMemo(() => {
    if (Object.keys(filters).length === 0) return data;

    return data.filter(item => {
      return Object.entries(filters).every(([field, values]) => {
        if (values.length === 0) return true;
        
        const itemValue = item[field];
        const stringValue = itemValue === null || itemValue === undefined 
          ? "" 
          : typeof itemValue === 'object' 
            ? JSON.stringify(itemValue) 
            : String(itemValue);
        
        return values.includes(stringValue);
      });
    });
  }, [data, filters]);

  const setFilter = (field: string, values: string[]) => {
    setFilters(prev => {
      if (values.length === 0) {
        const { [field]: removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [field]: values };
    });
  };

  const clearAllFilters = () => {
    setFilters({});
  };

  const getActiveFilters = (field: string): string[] => {
    return filters[field] || [];
  };

  return {
    filteredData,
    filters,
    setFilter,
    clearAllFilters,
    getActiveFilters
  };
};
