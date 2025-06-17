
import { useMemo, useState } from "react";
import { BonusByCompany } from "@/services/bonusByCompanyService";
import { MasterData } from "@/services/masterDataService";

export const useBonusByCompanyFilter = (data: BonusByCompany[], companies: MasterData[]) => {
  const [filters, setFilters] = useState<Record<string, string[]>>({});

  const setFilter = (field: string, values: string[]) => {
    setFilters(prev => ({
      ...prev,
      [field]: values
    }));
  };

  const getActiveFilters = (field: string) => filters[field] || [];

  const filterData = useMemo(() => {
    const years = [...new Set(data.map(item => item.year.toString()))].sort();
    const companyIds = [...new Set(data.map(item => item.company_id))].filter(Boolean);
    const companyOptions = companyIds.map(id => {
      const company = companies.find(c => c.id === id);
      return { value: id, label: company?.code || id };
    });
    const bnBmmValues = [...new Set(data.map(item => item.bn_bmm.toString()))].sort();
    const notesValues = [...new Set(data.map(item => item.notes).filter(Boolean))].sort();

    return {
      year: years.map(year => ({ value: year, label: year })),
      company_id: companyOptions,
      bn_bmm: bnBmmValues.map(value => ({ value, label: value })),
      notes: notesValues.map(note => ({ value: note, label: note }))
    };
  }, [data, companies]);

  const filterRows = (rows: BonusByCompany[]) => {
    return rows.filter(row => {
      return Object.entries(filters).every(([field, values]) => {
        if (!values.length) return true;
        
        const rowValue = row[field as keyof BonusByCompany];
        if (rowValue === null || rowValue === undefined) return false;
        
        return values.includes(rowValue.toString());
      });
    });
  };

  return {
    setFilter,
    getActiveFilters,
    filterData,
    filterRows
  };
};
