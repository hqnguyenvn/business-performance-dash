
import { useMemo, useState } from "react";
import { Parameter } from "@/services/parameterService";

export const useParameterFilter = (data: Parameter[]) => {
  const [yearFilter, setYearFilter] = useState<number[]>([]);
  const [codeFilter, setCodeFilter] = useState<string[]>([]);

  const filteredData = useMemo(() => {
    return data.filter(row => {
      const yearMatch = yearFilter.length === 0 || yearFilter.includes(row.year);
      const codeMatch = codeFilter.length === 0 || codeFilter.includes(row.code);
      return yearMatch && codeMatch;
    });
  }, [data, yearFilter, codeFilter]);

  const availableYears = useMemo(() => {
    return Array.from(new Set(data.map(item => item.year))).sort((a, b) => b - a);
  }, [data]);

  const availableCodes = useMemo(() => {
    return Array.from(new Set(data.map(item => item.code))).sort();
  }, [data]);

  return {
    filteredData,
    yearFilter,
    setYearFilter,
    codeFilter,
    setCodeFilter,
    availableYears,
    availableCodes,
  };
};
