import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

interface RowActionsProps {
  onAddRowBelow: () => void;
  onDelete: () => void;
}

export const RowActions: React.FC<RowActionsProps> = ({ onAddRowBelow, onDelete }) => {
  return (
    <td className="border border-gray-300 p-1 text-center">
      <div className="flex items-center justify-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-6 w-6"
          title="Insert new row below"
          onClick={onAddRowBelow}
        >
          <Plus className="h-4 w-4" />
        </Button>
        <DeleteConfirmDialog onDelete={onDelete} />
      </div>
    </td>
  );
};