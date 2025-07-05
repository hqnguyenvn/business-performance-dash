import { useCallback, useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTableFilter } from "@/hooks/useTableFilter";
import { MasterData } from "@/hooks/useMasterDataEdit";

export interface MasterDataService {
  create: (item: Omit<MasterData, 'id'>) => Promise<MasterData>;
  update: (id: string, item: Partial<MasterData>) => Promise<MasterData>;
  delete: (id: string) => Promise<void>;
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

// Hàm sort theo Customer (nếu có) và sau đó code
function sortByCustomerThenCode(data: MasterData[], customers: MasterData[]) {
  return [...data].sort((a, b) => {
    // Ưu tiên theo tên Customer (trường hợp cả 2 cùng có customer_id)
    const aCustomer = customers?.find(c => c.id === a.customer_id);
    const bCustomer = customers?.find(c => c.id === b.customer_id);

    const nameA = (aCustomer?.name || "").toLowerCase();
    const nameB = (bCustomer?.name || "").toLowerCase();

    if (nameA !== nameB) {
      return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
    }

    // Nếu trùng Customer, so sánh Code (không phân biệt hoa/thường)
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

  // State để track editing process
  const [isEditing, setIsEditing] = useState(false);

  // Tính toán sortedData - chỉ sort khi không có temp record và không đang edit
  const sortedData = useMemo(() => {
    const hasTempRecord = data.some(item => item.id.startsWith("tmp-"));

    // KHÔNG SORT nếu có temp record hoặc đang editing
    if (hasTempRecord || isEditing) {
      return [...data]; // Return new array reference to avoid mutation
    }

    // Chỉ sort khi có cột Customer và có dữ liệu customers
    if (showCustomerColumn && customers?.length > 0) {
      return sortByCustomerThenCode(data, customers);
    }

    return [...data]; // Return new array reference to avoid mutation
  }, [data, isEditing, showCustomerColumn, customers]);

  // Table filter
  const { filteredData, setFilter, getActiveFilters } = useTableFilter(sortedData);

  // Delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Hàm sửa ô, giữ nguyên thứ tự
  const handleCellEdit = useCallback(
    async (id: string, field: keyof MasterData, value: string) => {
      const oldItem: MasterData | undefined = data.find(item => item.id === id);
      if (!oldItem) return;
      // Update UI ngay lập tức
      setter(prev => prev.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      ));

      try {
        const isTemporaryId = id.startsWith("tmp-"); // id tạm
        if (!isTemporaryId) {
          await service.update(id, { [field]: value });
          toast({
            title: "Saved",
            description: "Data saved successfully.",
          });
        } else {
          // Nếu là row mới => tạo mới. BỎ trường id ra khỏi payload!
          const { id: _, ...toCreate } = { ...oldItem, [field]: value };
          const created = await service.create(toCreate);
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
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to save data.",
          variant: "destructive"
        });
        setter(prev => prev.map(item =>
          item.id === id ? { ...item, [field]: oldItem[field] } : item
        ));
      }
    },
    [data, service, setter, toast]
  );

  // Tạo row mới ở đầu danh sách
  const addNewItem = useCallback(() => {
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

  // Xóa
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

  // Thêm row dưới hàng hiện tại
  const addRowBelow = useCallback((index: number) => {
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

    const handleSave = useCallback(async (item: MasterData): Promise<boolean> => {
    try {
      // setLoading(true); // Assuming setLoading is defined elsewhere
      const isTemp = item.id.startsWith("tmp-");

      if (isTemp) {
        // Create new item
        const { id, ...itemData } = item;
        const newItem = await service.create(itemData);

        // Replace temp item with new item in the list
        setter(prevData =>
          prevData.map(prevItem =>
            prevItem.id === item.id ? newItem : prevItem
          )
        );

        toast({
          title: "Success",
          description: "Item created successfully",
        });

        return true;
      } else {
        // Update existing item
        const updatedItem = await service.update(item.id, item);

        // Update item in the list
        setter(prevData =>
          prevData.map(prevItem =>
            prevItem.id === item.id ? updatedItem : prevItem
          )
        );

        toast({
          title: "Success",
          description: "Item updated successfully",
        });

        return true;
      }
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save item",
        variant: "destructive"
      });
      return false;
    } finally {
      // setLoading(false); // Assuming setLoading is defined elsewhere
      setIsEditing(false);
    }
  }, [service, setter, toast, setIsEditing]);

    const handleCancel = useCallback((item: MasterData) => {
    if (item.id.startsWith("tmp-")) {
      // Remove temp item
      setter(prev => prev.filter(prevItem => prevItem.id !== item.id));
    }
    setIsEditing(false);
  }, [setter, setIsEditing]);

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