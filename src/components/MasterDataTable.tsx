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
  const {
    currentPage,
    totalPages,
    paginatedData,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    totalItems,
    startIndex,
    endIndex,
  } = usePagination({ data: filteredData });

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
          {/* Loại bỏ button Save/AddNew */}
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
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-50">
                  {showCompanyColumn && (
                    <TableCell className="border border-gray-300 p-1">
                      <select
                        className="border-0 p-1 h-8 w-full"
                        value={item.company_id || ""}
                        onChange={(e) => handleCellEdit(item.id, 'company_id', e.target.value)}
                      >
                        <option value="">Select company</option>
                        {companies.map((company) => (
                          <option key={company.id} value={company.id}>
                            {company.name}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                  )}
                  {showCustomerColumn && (
                    <TableCell className="border border-gray-300 p-1">
                      <select
                        className="border-0 p-1 h-8 w-full"
                        value={item.customer_id || ""}
                        onChange={(e) => handleCellEdit(item.id, 'customer_id', e.target.value)}
                      >
                        <option value="">Select customer</option>
                        {customers.map((customer) => (
                          <option key={customer.id} value={customer.id}>
                            {customer.name}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                  )}
                  <TableCell className="border border-gray-300 p-1">
                    <input
                      className="border-0 p-1 h-8 w-full"
                      value={item.code}
                      onChange={(e) => handleCellEdit(item.id, 'code', e.target.value)}
                      onBlur={(e) => {/* No-op, lưu luôn khi onChange */}}
                    />
                  </TableCell>
                  <TableCell className="border border-gray-300 p-1">
                    <input
                      className="border-0 p-1 h-8 w-full"
                      value={item.name}
                      onChange={(e) => handleCellEdit(item.id, 'name', e.target.value)}
                      onBlur={(e) => {/* No-op, lưu luôn khi onChange */}}
                    />
                  </TableCell>
                  <TableCell className="border border-gray-300 p-1">
                    <input
                      className="border-0 p-1 h-8 w-full"
                      value={item.description || ""}
                      onChange={(e) => handleCellEdit(item.id, 'description', e.target.value)}
                      onBlur={(e) => {/* No-op, lưu luôn khi onChange */}}
                    />
                  </TableCell>
                  <TableCell className="border border-gray-300 p-2 text-center">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this item? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteItem(item.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={goToPage}
          onNextPage={goToNextPage}
          onPreviousPage={goToPreviousPage}
          totalItems={totalItems}
          startIndex={startIndex}
          endIndex={endIndex}
        />
      </CardContent>
    </Card>
  );
};

export default MasterDataTable;
