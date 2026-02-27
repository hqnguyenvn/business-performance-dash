
import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Plus, Upload } from "lucide-react";
import MasterDataTableHead from "./MasterDataTableHead";
import MasterDataTableBody from "./MasterDataTableBody";
import { useMasterDataTableLogic, MasterDataService } from "./useMasterDataTableLogic";
import { MasterData } from "@/hooks/useMasterDataEdit";
import { exportToCsv } from "@/utils/exportCsv";
import ImportCsvDialog from "./ImportCsvDialog";

interface MasterDataTableProps {
  data: MasterData[];
  setter: React.Dispatch<React.SetStateAction<MasterData[]>>;
  title: string;
  showCompanyColumn?: boolean;
  showCustomerColumn?: boolean;
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

  const [importOpen, setImportOpen] = useState(false);

  const handleExport = () => {
    const columns: { key: string; header: string }[] = [
      { key: "code", header: "Code" },
      { key: "name", header: "Name" },
      { key: "description", header: "Description" },
    ];
    if (showCompanyColumn) {
      columns.push({ key: "company_name", header: "Company" });
    }
    if (showCustomerColumn) {
      columns.push({ key: "customer_name", header: "Customer" });
    }
    const exportData = data.map((item) => ({
      ...item,
      company_name: showCompanyColumn
        ? companies.find((c) => c.id === item.company_id)?.name || ""
        : undefined,
      customer_name: showCustomerColumn
        ? customers.find((c) => c.id === item.customer_id)?.name || ""
        : undefined,
    }));
    const filename = title.replace(/\s+/g, "_");
    exportToCsv(exportData, filename, columns);
  };

  const importColumns = ["Code", "Name", "Description"];

  const handleImport = useCallback(async (rows: Record<string, string>[]) => {
    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const row of rows) {
      const code = (row["Code"] || "").trim();
      if (!code) {
        errors.push("Skipped row with empty Code.");
        continue;
      }
      const name = (row["Name"] || "").trim();
      const description = (row["Description"] || "").trim();

      const existing = data.find(
        (item) => item.code.toLowerCase() === code.toLowerCase()
      );

      try {
        if (existing) {
          const updatedItem = await service.update(existing.id, { name, description });
          setter((prev) =>
            prev.map((item) => (item.id === existing.id ? { ...item, ...updatedItem } : item))
          );
          updated++;
        } else {
          const newItem = await service.create({ code, name, description });
          setter((prev) => [newItem, ...prev]);
          created++;
        }
      } catch (error: any) {
        errors.push(`Code "${code}": ${error.message || "Unknown error"}`);
      }
    }

    return { created, updated, errors };
  }, [data, service, setter]);

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
            <Button onClick={addNewItem} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add {title.replace(" List", "")}
            </Button>
          </div>
        </div>
      </CardHeader>
      <ImportCsvDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title={title}
        expectedColumns={importColumns}
        onImport={handleImport}
      />
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <MasterDataTableHead
              showCompanyColumn={showCompanyColumn}
              showCustomerColumn={showCustomerColumn}
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
