import React, { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from "@/components/ui/table";
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
import { useTableFilter } from "@/hooks/useTableFilter";
import { usePagination } from "@/hooks/usePagination";
import PaginationControls from "@/components/PaginationControls";
import MasterDataTableBody from "./MasterDataTableBody";

interface MasterData {
  id: string;
  code: string;
  name: string;
  description?: string;
  company_id?: string;
  customer_id?: string;
}

interface MasterDataService {
  create: (item: Omit<MasterData, 'id'>) => Promise<MasterData>;
  update: (id: string, item: Partial<MasterData>) => Promise<MasterData>;
  delete: (id: string) => Promise<void>;
}

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
  service
}) => {
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Add table filtering
  const { filteredData, setFilter, getActiveFilters } = useTableFilter(data);

  // Add pagination
  // const {
  //   currentPage,
  //   totalPages,
  //   paginatedData,
  //   goToPage,
  //   goToNextPage,
  //   goToPreviousPage,
  //   totalItems,
  //   startIndex,
  //   endIndex,
  // } = usePagination({ data: filteredData });

  // Tạo state để giữ giá trị đang được chỉnh sửa tạm thời
  const [editingCell, setEditingCell] = useState<{ id: string; field: keyof MasterData } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

  // Khi user thay đổi trường dữ liệu => tự động lưu
  const handleCellEdit = useCallback(
    async (id: string, field: keyof MasterData, value: string) => {
      const oldItem: MasterData | undefined = data.find(item => item.id === id);
      if (!oldItem) return;
      // Update UI ngay lập tức
      setter(prev => prev.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      ));

      try {
        const isNewItem = !isNaN(Number(id)); // row mới chưa lưu DB
        if (!isNewItem) {
          const payload: Partial<MasterData> = { ...oldItem, [field]: value };
          await service.update(id, { [field]: value });
          toast({
            title: "Saved",
            description: "Data saved successfully.",
          });
        } else {
          // Nếu là row mới => tạo mới
          const { id: _, ...toCreate } = { ...oldItem, [field]: value };
          const created = await service.create(toCreate);
          // Cập nhật lại id vừa được DB trả về
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
        // Rollback UI nếu lỗi:
        setter(prev => prev.map(item =>
          item.id === id ? { ...item, [field]: oldItem[field] } : item
        ));
      }
    },
    [data, service, setter, toast]
  );

  // Hàm thêm row mới (giữ lại logic nếu user cần dùng ở đâu đó khác)
  const addNewItem = useCallback(() => {
    const newItem: MasterData = {
      id: Date.now().toString(),
      code: "",
      name: "",
      description: "",
      ...(showCompanyColumn && { company_id: "" }),
      ...(showCustomerColumn && { customer_id: "" }),
    };
    setter(prev => [...prev, newItem]);
  }, [setter, showCompanyColumn, showCustomerColumn]);

  const deleteItem = useCallback(async (id: string) => {
    try {
      const isNewItem = !isNaN(Number(id));
      if (!isNewItem) {
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

  const getCompanyName = (companyID: string) => {
    const company = companies.find(c => c.id === companyID);
    return company ? company.name : "";
  };

  const getCustomerName = (customerID: string) => {
    const customer = customers.find(c => c.id === customerID);
    return customer ? customer.name : "";
  };

  return (
    <Card className="bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {/* Nút Save/AddNew đã bỏ, chỉ giữ lại header */}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                {showCompanyColumn && (
                  <TableHead 
                    className="border border-gray-300"
                    showFilter={true}
                    filterData={data}
                    filterField="company_id"
                    onFilter={setFilter}
                    activeFilters={getActiveFilters("company_id")}
                  >
                    Company
                  </TableHead>
                )}
                {showCustomerColumn && (
                  <TableHead 
                    className="border border-gray-300"
                    showFilter={true}
                    filterData={data}
                    filterField="customer_id"
                    onFilter={setFilter}
                    activeFilters={getActiveFilters("customer_id")}
                  >
                    Customer
                  </TableHead>
                )}
                <TableHead 
                  className="border border-gray-300"
                  showFilter={true}
                  filterData={data}
                  filterField="code"
                  onFilter={setFilter}
                  activeFilters={getActiveFilters("code")}
                >
                  Code
                </TableHead>
                <TableHead 
                  className="border border-gray-300"
                  showFilter={true}
                  filterData={data}
                  filterField="name"
                  onFilter={setFilter}
                  activeFilters={getActiveFilters("name")}
                >
                  Name
                </TableHead>
                <TableHead 
                  className="border border-gray-300"
                  showFilter={true}
                  filterData={data}
                  filterField="description"
                  onFilter={setFilter}
                  activeFilters={getActiveFilters("description")}
                >
                  Description
                </TableHead>
                <TableHead className="border border-gray-300 text-center">
                  <div className="flex items-center justify-center gap-1">
                    Actions
                    <Button
                      variant="outline"
                      size="icon"
                      className="ml-1"
                      onClick={addNewItem}
                      title="Add new"
                      type="button"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <MasterDataTableBody
                data={filteredData}
                companies={companies}
                customers={customers}
                showCompanyColumn={showCompanyColumn}
                showCustomerColumn={showCustomerColumn}
                handleCellEdit={handleCellEdit}
                deleteItem={deleteItem}
              />
            </TableBody>
          </Table>
        </div>
        {/* Bỏ PaginationControls */}
      </CardContent>
    </Card>
  );
};

export default MasterDataTable;
