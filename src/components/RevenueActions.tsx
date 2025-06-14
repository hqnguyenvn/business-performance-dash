
import React from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import CloneDataDialog from "@/components/CloneDataDialog";

interface RevenueActionsProps {
  onImportCSV: () => void;
  onExportCSV: () => void;
  onCloneData: () => void;
  onAddNewRow: () => void;
}

const RevenueActions: React.FC<RevenueActionsProps> = ({
  onImportCSV,
  onExportCSV,
  onCloneData,
  onAddNewRow,
}) => {
  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={onImportCSV}>
        <Upload className="h-4 w-4 mr-2" />
        Import CSV
      </Button>
      <Button variant="outline" onClick={onExportCSV}>
        <Upload className="h-4 w-4 mr-2" />
        Export CSV
      </Button>
      <CloneDataDialog onClone={onCloneData} />
      <Button variant="outline">
        Save
      </Button>
      <Button onClick={onAddNewRow}>
        Add New
      </Button>
    </div>
  );
};

export default RevenueActions;
