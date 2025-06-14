
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Receipt, Plus, Download, Save, Import } from "lucide-react";

interface CostsHeaderProps {
  importFromCSV: () => void;
  exportToCSV: () => void;
  saveAllData: () => void;
  addNewRow: () => void;
}

export const CostsHeader = ({ importFromCSV, exportToCSV, saveAllData, addNewRow }: CostsHeaderProps) => {
  return (
    <PageHeader
      title="Cost Management"
      description="Record costs by year and month"
      icon={Receipt}
      actions={
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={importFromCSV}>
              <Import className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={saveAllData}>
              <Save className="h-4 w-4 mr-2" />
              Save All
            </Button>
            <Button onClick={addNewRow}>
              <Plus className="h-4 w-4 mr-2" />
              Add Row
            </Button>
        </div>
      }
    />
  );
};
