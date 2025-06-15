
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Copy, Eye, Edit, Trash2 } from "lucide-react";
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
import { Revenue } from "@/types/revenue";

interface RevenueRowActionsProps {
  revenue: Revenue;
  index: number; // This is pageSpecificIndex
  onInsertRowBelow: (index: number) => void; // Expects pageSpecificIndex
  onCloneRevenue: (revenue: Revenue, index: number) => void; // Expects pageSpecificIndex
  onOpenDialog: (revenue: Revenue, mode: 'view' | 'edit') => void;
  onDeleteRevenue: (id: string) => void;
}

const RevenueRowActions: React.FC<RevenueRowActionsProps> = ({
  revenue,
  index,
  onInsertRowBelow,
  onCloneRevenue,
  onOpenDialog,
  onDeleteRevenue,
}) => {
  return (
    <div className="flex justify-center gap-1">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onInsertRowBelow(index)}
        title="Add"
        className="h-8 w-8"
      >
        <Plus className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onCloneRevenue(revenue, index)}
        title="Clone"
        className="h-8 w-8"
      >
        <Copy className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onOpenDialog(revenue, 'view')}
        title="View"
        className="h-8 w-8"
      >
        <Eye className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onOpenDialog(revenue, 'edit')}
        title="Edit"
        className="h-8 w-8"
      >
        <Edit className="h-4 w-4" />
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="destructive"
            size="icon"
            title="Delete"
            className="h-8 w-8"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this revenue record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDeleteRevenue(revenue.id)}
              className="!bg-destructive !text-destructive-foreground !hover:bg-destructive/90 px-4 py-2 rounded-md font-semibold"
              style={{ minWidth: 80 }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RevenueRowActions;

