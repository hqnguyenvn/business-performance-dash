import { useCallback, useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTableFilter } from "@/hooks/useTableFilter";
import { MasterData } from "@/hooks/useMasterDataEdit";

export interface MasterDataService {
  create: (item: Omit<MasterData, 'id'>) => Promise<MasterData>;
  update: (id: string, item: Partial<MasterData>) => Promise<MasterData>;
  delete: (id: string) => Promise<void>;
  /** Optional bulk-reset — only implemented by ProjectsService for now. */
  deleteAll?: () => Promise<{ deleted: number }>;
}

interface MasterDataTableLogicProps {
  data: MasterData[];
  setter: React.Dispatch<React.SetStateAction<MasterData[]>>;
  companies?: MasterData[];
  customers?: MasterData[];
  showCompanyColumn?: boolean;
  showCustomerColumn?: boolean;
  service: MasterDataService;
}

function sortByCode(data: MasterData[]) {
  return [...data].sort((a, b) => {
    const codeA = (a.code || "").toLowerCase();
    const codeB = (b.code || "").toLowerCase();
    return codeA.localeCompare(codeB, undefined, { sensitivity: 'base' });
  });
}

function sortByCustomerThenCode(data: MasterData[], customers: MasterData[]) {
  return [...data].sort((a, b) => {
    const aCustomer = customers?.find(c => c.id === a.customer_id);
    const bCustomer = customers?.find(c => c.id === b.customer_id);

    const nameA = (aCustomer?.name || "").toLowerCase();
    const nameB = (bCustomer?.name || "").toLowerCase();

    if (nameA !== nameB) {
      return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
    }

    const codeA = (a.code || "").toLowerCase();
    const codeB = (b.code || "").toLowerCase();
    return codeA.localeCompare(codeB, undefined, { sensitivity: 'base' });
  });
}

export const useMasterDataTableLogic = ({
  data,
  setter,
  companies = [],
  customers = [],
  showCompanyColumn = false,
  showCustomerColumn = false,
  service
}: MasterDataTableLogicProps) => {
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [userModified, setUserModified] = useState(false);

  const sortedData = useMemo(() => {
    if (userModified) {
      return [...data];
    }

    if (showCustomerColumn && customers?.length > 0) {
      return sortByCustomerThenCode(data, customers);
    }
    return sortByCode(data);
  }, [data, userModified, showCustomerColumn, customers]);

  const { filteredData, setFilter, getActiveFilters } = useTableFilter(sortedData);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCellEdit = useCallback(
    async (id: string, field: keyof MasterData, value: string) => {
      const oldItem: MasterData | undefined = data.find(item => item.id === id);
      if (!oldItem) return;
      setter(prev => prev.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      ));

      try {
        const isTemporaryId = id.startsWith("tmp-");
        if (!isTemporaryId) {
          await service.update(id, { [field]: value });
          toast({
            title: "Saved",
            description: "Data saved successfully.",
          });
        } else {
          // For a new (tmp-) row we need BOTH `code` and `name` filled before
          // calling create — otherwise the server rejects (both are required)
          // and our catch below would revert the user's typed value, making it
          // impossible to ever add a row by editing fields one at a time.
          const merged = { ...oldItem, [field]: value };
          const codeOk = String(merged.code ?? "").trim().length > 0;
          const nameOk = String(merged.name ?? "").trim().length > 0;
          if (!codeOk || !nameOk) {
            // Local state has the new value already; API call deferred until
            // the other required field is also entered.
            return;
          }
          const { id: _, ...rest } = merged;
          // Drop empty-string FK fields — the server's optional-UUID validator
          // would otherwise reject "". Users that haven't picked a Company /
          // Customer yet can edit later via inline cell edit.
          const toCreate: Record<string, unknown> = {};
          for (const [k, v] of Object.entries(rest)) {
            if (v === "" && (k === "company_id" || k === "customer_id" || k === "group_code")) {
              continue;
            }
            toCreate[k] = v;
          }
          const created = await service.create(toCreate as Omit<MasterData, "id">);
          setter(prev =>
            prev.map(item =>
              item.id === id ? created : item
            )
          );
          toast({
            title: "Created",
            description: "New item added and saved.",
          });
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error?.message || "Failed to save data.",
          variant: "destructive"
        });
        setter(prev => prev.map(item =>
          item.id === id ? { ...item, [field]: oldItem[field] } : item
        ));
      }
    },
    [data, service, setter, toast]
  );

  const addNewItem = useCallback(() => {
    setUserModified(true);
    const newItem: MasterData = {
      id: "tmp-" + Date.now().toString() + Math.random().toString(36).slice(2, 6),
      code: "",
      name: "",
      description: "",
      ...(showCompanyColumn && { company_id: "" }),
      ...(showCustomerColumn && { customer_id: "" }),
    };
    setter(prev => [newItem, ...prev]);
  }, [setter, showCompanyColumn, showCustomerColumn]);

  const deleteItem = useCallback(async (id: string) => {
    try {
      const isTmp = id.startsWith("tmp-");
      if (!isTmp) {
        await service.delete(id);
      }
      setter(prev => prev.filter(item => item.id !== id));
      toast({
        title: "Deleted",
        description: "Item successfully deleted",
      });
      setDeleteId(null);
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive"
      });
    }
  }, [setter, toast, service]);

  const addRowBelow = useCallback((index: number) => {
    setUserModified(true);
    const newItem: MasterData = {
      id: "tmp-" + Date.now().toString() + Math.random().toString(36).slice(2, 6),
      code: "",
      name: "",
      description: "",
      ...(showCompanyColumn && { company_id: "" }),
      ...(showCustomerColumn && { customer_id: "" }),
    };
    setter(prev => {
      const next = [...prev];
      next.splice(index + 1, 0, newItem);
      return next;
    });
  }, [setter, showCompanyColumn, showCustomerColumn]);

  return {
    filteredData,
    setFilter,
    getActiveFilters,
    deleteId,
    setDeleteId,
    handleCellEdit,
    addNewItem,
    deleteItem,
    addRowBelow,
    setIsEditing,
  };
};
