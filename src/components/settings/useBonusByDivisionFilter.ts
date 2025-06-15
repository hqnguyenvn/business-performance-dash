
import { useState, useCallback } from "react";
import { BonusByDivision } from "@/services/bonusByDivisionService";
import { MasterData } from "@/services/masterDataService";

export const useBonusByDivisionFilter = (
  data: BonusByDivision[],
  divisions: MasterData[]
) => {
  const [filters, setFilters] = useState<{ [key: string]: string[] }>({});

  const getActiveFilters = useCallback(
    (field: string) => filters[field] || [],
    [filters]
  );

  const setFilter = useCallback((field: string, values: string[]) => {
    setFilters((prev) => ({ ...prev, [field]: values }));
  }, []);

  // Prepare filtering options for the UI
  const filterDivisionData = divisions.map((d) => ({
    ...d,
    value: d.id,
    displayValue: `${d.code} - ${d.name}`,
  }));
  const filterData = {
    year: Array.from(new Set(data.map((r) => r.year))).map((y) => ({
      value: String(y),
      displayValue: String(y),
    })),
    division_id: filterDivisionData,
    bn_bmm: Array.from(new Set(data.map((r) => r.bn_bmm))).map((b) => ({
      value: String(b),
      displayValue: String(b),
    })),
    notes: Array.from(new Set(data.map((r) => r.notes ?? ""))).map((note) => ({
      value: note ?? "",
      displayValue: note ?? "",
    })),
  };

  // Filtering
  const filterRows = useCallback(
    (rows: BonusByDivision[]) => {
      return rows.filter((r) => {
        if (
          filters.year &&
          filters.year.length > 0 &&
          !filters.year.includes(String(r.year))
        )
          return false;
        if (
          filters.division_id &&
          filters.division_id.length > 0 &&
          !filters.division_id.includes(r.division_id)
        )
          return false;
        if (
          filters.bn_bmm &&
          filters.bn_bmm.length > 0 &&
          !filters.bn_bmm.includes(String(r.bn_bmm))
        )
          return false;
        if (
          filters.notes &&
          filters.notes.length > 0 &&
          !filters.notes.includes(r.notes ?? "")
        )
          return false;
        return true;
      });
    },
    [filters]
  );

  return {
    setFilter,
    getActiveFilters,
    filterData,
    filterRows,
  };
};
