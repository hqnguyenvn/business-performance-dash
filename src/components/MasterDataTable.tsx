
import React, { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Plus, Upload, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import MasterDataTableHead from "./MasterDataTableHead";
import MasterDataTableBody from "./MasterDataTableBody";
import { useMasterDataTableLogic, MasterDataService } from "./useMasterDataTableLogic";
import { MasterData } from "@/hooks/useMasterDataEdit";
import { exportExcel, type ImportError, type ExcelSchema } from "@/utils/excelIO";
import ExcelImportDialog, { type ImportResult, type ImportProgress } from "@/components/ExcelImportDialog";
import { reportRowProgress } from "@/utils/importProgress";
import { useToast } from "@/hooks/use-toast";

interface MasterDataTableProps {
  data: MasterData[];
  setter: React.Dispatch<React.SetStateAction<MasterData[]>>;
  title: string;
  showCompanyColumn?: boolean;
  showCustomerColumn?: boolean;
  showGroupCodeColumn?: boolean;
  /** Show a "Delete All" button (calls service.deleteAll). Used by Projects. */
  showDeleteAllButton?: boolean;
  companies?: MasterData[];
  customers?: MasterData[];
  service: MasterDataService;
}

const MasterDataTable: React.FC<MasterDataTableProps> = ({
  data,
  setter,
  title,
  showCompanyColumn = false,
  showCustomerColumn = false,
  showGroupCodeColumn = false,
  showDeleteAllButton = false,
  companies = [],
  customers = [],
  service,
}) => {
  const {
    filteredData,
    setFilter,
    getActiveFilters,
    handleCellEdit,
    deleteItem,
    addRowBelow,
    addNewItem,
    deleteId,
    setDeleteId,
    setIsEditing,
  } = useMasterDataTableLogic({
    data,
    setter,
    companies,
    customers,
    showCompanyColumn,
    showCustomerColumn,
    service,
  });

  const { toast } = useToast();
  const [importOpen, setImportOpen] = useState(false);

  const fileSlug = title.replace(/\s+/g, "-").toLowerCase();
  const entityName = title.replace(/ List$/, "");

  const schema = useMemo<ExcelSchema>(() => {
    const columns: ExcelSchema["columns"] = [
      { key: "code", header: "Code", required: true, width: 18 },
      { key: "name", header: "Name", required: true, width: 28 },
    ];
    if (showGroupCodeColumn) {
      columns.push({ key: "group_code", header: "Project Group", width: 20 });
    }
    columns.push({ key: "description", header: "Description", width: 40 });
    const lookups: ExcelSchema["lookups"] = {};
    if (showCompanyColumn) {
      columns.push({ key: "company_code", header: "Company", lookup: "companies", width: 20 });
      lookups.companies = companies.map((c) => ({ code: c.code, name: c.name }));
    }
    if (showCustomerColumn) {
      columns.push({ key: "customer_code", header: "Customer", lookup: "customers", width: 28 });
      lookups.customers = customers.map((c) => ({ code: c.code, name: c.name }));
    }
    return { sheetName: entityName, columns, lookups };
  }, [entityName, showCompanyColumn, showCustomerColumn, showGroupCodeColumn, companies, customers]);

  const handleExport = async () => {
    try {
      const rows = data.map((item) => ({
        code: item.code,
        name: item.name || "",
        description: item.description || "",
        group_code: showGroupCodeColumn ? (item.group_code || "") : undefined,
        company_code: showCompanyColumn ? (companies.find((c) => c.id === item.company_id)?.code || "") : undefined,
        customer_code: showCustomerColumn ? (customers.find((c) => c.id === item.customer_id)?.code || "") : undefined,
      }));
      await exportExcel({ schema, rows, fileName: `${fileSlug}.xlsx` });
      toast({ title: "Export thành công", description: `Đã xuất ${rows.length} dòng.` });
    } catch (err: any) {
      toast({ title: "Export thất bại", description: err.message, variant: "destructive" });
    }
  };

  const handleImport = useCallback(async (
    rows: Record<string, any>[],
    onProgress?: ImportProgress,
  ): Promise<ImportResult> => {
    const errors: ImportError[] = [];
    type Task = { rowNumber: number; code: string; payload: any; existing?: MasterData };
    const tasks: Task[] = [];

    // Phase 1: validate all rows synchronously
    for (const row of rows) {
      const rowNumber: number = row.__rowNumber || 0;
      const errCols: string[] = [];
      const reasons: string[] = [];

      const code = String(row.code || "").trim();
      if (!code) { errCols.push("Code"); reasons.push("Code không được để trống"); }

      const name = String(row.name || "").trim();
      if (!name) { errCols.push("Name"); reasons.push("Name không được để trống"); }

      const description = String(row.description || "").trim();
      const payload: any = { name, description };

      if (showGroupCodeColumn) {
        const gc = String(row.group_code || "").trim();
        payload.group_code = gc || null;
      }

      if (showCompanyColumn) {
        const companyCode = String(row.company_code || "").trim();
        if (companyCode) {
          const found = companies.find((c) => c.code.toLowerCase() === companyCode.toLowerCase());
          if (!found) { errCols.push("Company"); reasons.push(`Không tìm thấy Company: "${companyCode}"`); }
          else payload.company_id = found.id;
        }
      }
      if (showCustomerColumn) {
        const customerCode = String(row.customer_code || "").trim();
        if (customerCode) {
          const found = customers.find((c) => c.code.toLowerCase() === customerCode.toLowerCase());
          if (!found) { errCols.push("Customer"); reasons.push(`Không tìm thấy Customer: "${customerCode}"`); }
          else payload.customer_id = found.id;
        }
      }

      if (errCols.length > 0) {
        errors.push({ rowIndex: rowNumber, columns: errCols, reason: reasons.join("; ") });
        continue;
      }

      const existing = data.find((item) => item.code.toLowerCase() === code.toLowerCase());
      tasks.push({ rowNumber, code, payload, existing });
    }

    // Phase 2: execute API calls in parallel (pooled concurrency)
    const CONCURRENCY = 8;
    let created = 0, updated = 0;
    const createdItems: MasterData[] = [];
    const updatedItems: MasterData[] = [];

    let idx = 0;
    let done = 0;
    const total = tasks.length;
    onProgress?.(0, total);
    const worker = async () => {
      while (idx < tasks.length) {
        const i = idx++;
        const t = tasks[i];
        try {
          if (t.existing) {
            const res = await service.update(t.existing.id, { code: t.code, ...t.payload });
            updatedItems.push({ ...t.existing, ...res });
            updated++;
          } else {
            const res = await service.create({ code: t.code, ...t.payload });
            createdItems.push(res);
            created++;
          }
        } catch (error: any) {
          errors.push({ rowIndex: t.rowNumber, columns: [], reason: `Code "${t.code}": ${error.message || "Lỗi không xác định"}` });
        }
        done++;
        reportRowProgress(done, total, onProgress);
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, tasks.length) }, worker));

    // Phase 3: batch state update
    if (createdItems.length > 0 || updatedItems.length > 0) {
      setter((prev) => {
        const updatedMap = new Map(updatedItems.map((u) => [u.id, u]));
        const merged = prev.map((p) => updatedMap.get(p.id) || p);
        return [...createdItems, ...merged];
      });
    }

    return { created, updated, errors };
  }, [data, service, setter, companies, customers, showCompanyColumn, showCustomerColumn, showGroupCodeColumn]);

  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const handleDeleteAll = useCallback(async () => {
    if (!service.deleteAll) return;
    try {
      const res = await service.deleteAll();
      setter([]);
      toast({
        title: "Đã xoá",
        description: `Đã xoá ${res.deleted} dòng. Bạn có thể import lại danh mục.`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Xoá thất bại",
        description: err?.message || "Có dữ liệu khác đang tham chiếu — xoá dữ liệu phụ thuộc trước.",
      });
    } finally {
      setDeleteAllOpen(false);
    }
  }, [service, setter, toast]);

  return (
    <Card className="bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)} className="flex items-center gap-1">
              <Upload className="h-4 w-4" />
              Import
            </Button>
            {showDeleteAllButton && service.deleteAll && (
              <AlertDialog open={deleteAllOpen} onOpenChange={setDeleteAllOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="flex items-center gap-1">
                    <Trash2 className="h-4 w-4" />
                    Delete All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Xoá toàn bộ {entityName}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Toàn bộ <strong>{data.length}</strong> dòng trong danh mục {entityName} sẽ bị xoá vĩnh viễn.
                      Hành động này không thể hoàn tác. Nếu có Revenue/Plan/Cost đang
                      tham chiếu các project này thì lệnh xoá sẽ bị từ chối.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Huỷ</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAll}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Xoá tất cả
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button onClick={addNewItem} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add {title.replace(" List", "")}
            </Button>
          </div>
        </div>
      </CardHeader>
      <ExcelImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title={entityName}
        schema={schema}
        templateFileName={`${fileSlug}-template.xlsx`}
        errorFileName={`${fileSlug}-errors.xlsx`}
        onImport={handleImport}
      />
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <MasterDataTableHead
              showCompanyColumn={showCompanyColumn}
              showCustomerColumn={showCustomerColumn}
              showGroupCodeColumn={showGroupCodeColumn}
              data={data}
              setFilter={setFilter}
              getActiveFilters={getActiveFilters}
              title={title}
            />
            <TableBody>
              <MasterDataTableBody
                data={filteredData}
                companies={companies}
                customers={customers}
                showCompanyColumn={showCompanyColumn}
                showCustomerColumn={showCustomerColumn}
                showGroupCodeColumn={showGroupCodeColumn}
                handleCellEdit={handleCellEdit}
                deleteItem={deleteItem}
                addRowBelow={addRowBelow}
                setIsEditing={setIsEditing}
              />
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default MasterDataTable;
