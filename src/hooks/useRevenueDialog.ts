
import { useState } from 'react';
import { Revenue } from '@/services/revenueService';

export const useRevenueDialog = () => {
  const [revenueInDialog, setRevenueInDialog] = useState<Revenue | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit'>('view');

  const handleOpenDialog = (revenue: Revenue, mode: 'view' | 'edit') => {
    setRevenueInDialog(revenue);
    setDialogMode(mode);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    // The RevenueDialog component itself handles onOpenChange which calls setIsDialogOpen.
    // Resetting revenueInDialog can also be done here if preferred,
    // but often it's fine to let it be overwritten on next open.
  };

  return {
    revenueInDialog,
    isDialogOpen,
    dialogMode,
    handleOpenDialog,
    handleCloseDialog,
    setIsDialogOpen, // Exposing for direct control if needed, e.g., by RevenueDialog
  };
};
