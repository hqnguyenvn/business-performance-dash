
import React, { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MasterData } from "@/services/masterDataService";
import { BonusByCompany, bonusByCompanyService } from "@/services/bonusByCompanyService";
import { useBonusByCompanyFilter } from "./useBonusByCompanyFilter";
import BonusByCompanyRow from "./BonusByCompanyRow";
import { useToast } from "@/hooks/use-toast";
import { exportExcel, type ImportError, type ExcelSchema } from "@/utils/excelIO";
import ExcelImportDialog, { type ImportResult, type ImportProgress } from "@/components/ExcelImportDialog";
import { reportRowProgress } from "@/utils/importProgress";

interface BonusByCompanyTableProps {
  data: BonusByCompany[];
  setter: React.Dispatch<React.SetStateAction<BonusByCompany[]>>;
  companies: MasterData[];
}

const thisYear = new Date().getFullYear();

const BonusByCompanyTable: React.FC<BonusByCompanyTableProps> = ({
  data,
  setter,
  companies,
}) => {
  const { toast } = useToast();
  const [userModified, setUserModified] = useState(false);

  const sortedData = useMemo(() => {
    if (userModified) return data;
    return [...data].sort((a, b) => b.year - a.year);
  }, [data, userModified]);

  const {
    setFilter,
    getActiveFilters,
    filterData,
    filterRows,
  } = useBonusByCompanyFilter(sortedData, companies);

  const [editingCell, setEditingCell] = useState<{ id: string; field: keyof BonusByCompany } | null>(null);

  const handleEditCell = useCallback((id: string, field: keyof BonusByCompany) => {
    setEditingCell({ id, field });
  }, []);

  const handleBlurCell = useCallback(() => {
    setEditingCell(null);
  }, []);

  const handleAddRow = useCallback(() => {
    setUserModified(true);
    const newId = `new-${Date.now()}`;
    const newRow: BonusByCompany = {
      id: newId,
      year: thisYear,
      company_id: companies.length > 0 ? companies[0].id : '',
      bn_bmm: 0,
      notes: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setter(prev => [newRow, ...prev]);
    setTimeout(() => handleEditCell(newId, 'year'), 50);
  }, [setter, companies, handleEditCell]);

  const handleAddRowAfter = useCallback((afterId: string) => {
    setUserModified(true);
    const anchorRow = data.find(r => r.id === afterId);
    if (!anchorRow) return;

    const newId = `new-${Date.now()}`;
    const newRow: BonusByCompany = {
      id: newId,
      year: anchorRow.year,
      company_id: anchorRow.company_id,
      bn_bmm: 0,
      notes: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const anchorIndexInData = data.findIndex(r => r.id === afterId);

    if (anchorIndexInData !== -1) {
      setter(prev => {
        const newData = [...prev];
        newData.splice(anchorIndexInData + 1, 0, newRow);
        return newData;
      });
      setTimeout(() => handleEditCell(newId, 'bn_bmm'), 50);
    }
  }, [data, setter, handleEditCell]);

  const handleDelete = useCallback(async (id: string) => {
    const isNew = id.toString().startsWith('new-');
    if (isNew) {
      setter(prev => prev.filter(row => row.id !== id));
      return;
    }
    try {
      await bonusByCompanyService.delete(id);
      setter(prev => prev.filter(row => row.id !== id));
      toast({ title: "Success", description: "Deleted entry" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  }, [setter, toast]);

  const saveCell = useCallback(async (id: string, field: keyof BonusByCompany, value: any) => {
    const isNew = id.toString().startsWith('new-');
    const originalRow = data.find(r => r.id === id);
    if (!originalRow) return;

    setter(prev => prev.map(row => (row.id === id ? { ...row, [field]: value } : row)));

    const updatedRow = { ...originalRow, [field]: value };
    const { year, company_id, bn_bmm, notes } = updatedRow;
    
    if (!company_id) return;
    
    try {
        if (isNew) {
            if (year && company_id) { // Only add if required fields are present
                const newRecord = await bonusByCompanyService.add({ year, company_id, bn_bmm, notes: notes ?? '' });
                setter(prev => prev.map(row => (row.id === id ? newRecord : row)));
                toast({ title: "Success", description: "Created new entry" });
            }
        } else {
            const updatedRecord = await bonusByCompanyService.update(id, { [field]: value });
            setter(prev => prev.map(row => (row.id === id ? updatedRecord : row)));
            toast({ title: "Success", description: "Updated entry" });
        }
    } catch (e: any) {
        setter(prev => prev.map(r => r.id === id ? originalRow : r)); // Revert on error
        toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  }, [data, setter, toast]);

  const filteredData = filterRows(sortedData);

  const [importOpen, setImportOpen] = useState(false);

  const schema = useMemo<ExcelSchema>(() => ({
    sheetName: "Bonus by Company",
    lookups: { companies: companies.map((c) => ({ code: c.code, name: c.name })) },
    columns: [
      { key: "year", header: "Year", type: "integer", required: true, width: 8 },
      { key: "company_code", header: "Company", lookup: "companies", required: true, width: 20 },
      { key: "bn_bmm", header: "BN_BMM", type: "number", width: 12 },
      { key: "notes", header: "Notes", width: 40 },
    ],
  }), [companies]);

  const handleExport = async () => {
    try {
      const rows = data.map((r) => ({
        year: r.year,
        company_code: companies.find((c) => c.id === r.company_id)?.code || "",
        bn_bmm: r.bn_bmm,
        notes: r.notes || "",
      }));
      await exportExcel({ schema, rows, fileName: "bonus-by-company.xlsx" });
      toast({ title: "Export thành công", description: `Đã xuất ${rows.length} dòng.` });
    } catch (err: any) {
      toast({ title: "Export thất bại", description: err.message, variant: "destructive" });
    }
  };

  const handleImport = useCallback(async (
    rows: Record<string, any>[],
    onProgress?: ImportProgress,
  ): Promise<ImportResult> => {
    let created = 0;
    let updated = 0;
    const errors: ImportError[] = [];
    const total = rows.length;
    onProgress?.(0, total);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber: number = row.__rowNumber || 0;
      const errCols: string[] = [];
      const reasons: string[] = [];

      const year = Number(row.year);
      if (!Number.isFinite(year) || year < 2000 || year > 2100) {
        errCols.push("Year"); reasons.push(`Năm không hợp lệ: "${row.year ?? ""}"`);
      }
      const companyCode = String(row.company_code || "").trim();
      const company = companies.find((c) => c.code.toLowerCase() === companyCode.toLowerCase());
      if (!company) {
        errCols.push("Company"); reasons.push(`Không tìm thấy Company: "${companyCode}"`);
      }
      const bn_bmm_raw = row.bn_bmm;
      const bn_bmm = bn_bmm_raw != null && bn_bmm_raw !== "" ? Number(bn_bmm_raw) : 0;
      if (bn_bmm_raw != null && bn_bmm_raw !== "" && !Number.isFinite(bn_bmm)) {
        errCols.push("BN_BMM"); reasons.push("BN_BMM phải là số");
      }
      const notes = String(row.notes || "").trim();

      if (errCols.length > 0) {
        errors.push({ rowIndex: rowNumber, columns: errCols, reason: reasons.join("; ") });
        reportRowProgress(i + 1, total, onProgress);
        continue;
      }

      const existing = data.find((item) => item.year === year && item.company_id === company!.id);
      try {
        if (existing) {
          const updatedItem = await bonusByCompanyService.update(existing.id, { bn_bmm, notes });
          setter((prev) => prev.map((item) => (item.id === existing.id ? { ...item, ...updatedItem } : item)));
          updated++;
        } else {
          const newItem = await bonusByCompanyService.add({ year, company_id: company!.id, bn_bmm, notes });
          setter((prev) => [newItem, ...prev]);
          created++;
        }
      } catch (error: any) {
        errors.push({ rowIndex: rowNumber, columns: [], reason: `${year}/${companyCode}: ${error.message || "Lỗi"}` });
      }
      reportRowProgress(i + 1, total, onProgress);
    }
    return { created, updated, errors };
  }, [data, companies, setter]);

  return (
    <Card className="bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Bonus by Company</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)} className="flex items-center gap-1">
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Button onClick={handleAddRow} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Bonus
            </Button>
          </div>
        </div>
      </CardHeader>
      <ExcelImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Bonus by Company"
        schema={schema}
        templateFileName="bonus-by-company-template.xlsx"
        errorFileName="bonus-by-company-errors.xlsx"
        onImport={handleImport}
      />
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="border border-gray-300 w-12 text-center">No.</TableHead>
                <TableHead
                  className="border border-gray-300 text-center"
                  showFilter={true}
                  filterData={filterData.year}
                  filterField="year"
                  onFilter={setFilter}
                  activeFilters={getActiveFilters("year")}
                >
                  Year
                </TableHead>
                <TableHead
                  className="border border-gray-300 text-center"
                  showFilter={true}
                  filterData={filterData.company_id}
                  filterField="company_id"
                  onFilter={setFilter}
                  activeFilters={getActiveFilters("company_id")}
                >
                  Company
                </TableHead>
                <TableHead
                  className="border border-gray-300 text-right"
                  showFilter={true}
                  filterData={filterData.bn_bmm}
                  filterField="bn_bmm"
                  onFilter={setFilter}
                  activeFilters={getActiveFilters("bn_bmm")}
                >
                  BN_BMM
                </TableHead>
                
                <TableHead
                  className="border border-gray-300"
                  showFilter={true}
                  filterData={filterData.notes}
                  filterField="notes"
                  onFilter={setFilter}
                  activeFilters={getActiveFilters("notes")}
                >
                  Notes
                </TableHead>
                <TableHead className="border border-gray-300 text-center w-28">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((row, idx) => (
                <BonusByCompanyRow
                  key={row.id}
                  row={row}
                  idx={idx}
                  companies={companies}
                  editingCell={editingCell}
                  onEditCell={handleEditCell}
                  onBlurCell={handleBlurCell}
                  saveCell={saveCell}
                  onDelete={handleDelete}
                  onAddRowAfter={handleAddRowAfter}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default BonusByCompanyTable;
