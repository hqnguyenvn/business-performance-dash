
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
  companies?: MasterData[];
  service: MasterDataService;
}

const MasterDataTable: React.FC<MasterDataTableProps> = ({ 
  data, 
  setter, 
  title, 
  showCompanyColumn = false,
  companies = [],
  service
}) => {
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

  const addNewItem = useCallback(() => {
    const newItem: MasterData = {
      id: Date.now().toString(),
      code: "",
      name: "",
      description: "",
      ...(showCompanyColumn && { company_id: "" }),
    };
    setter(prev => [...prev, newItem]);
  }, [setter, showCompanyColumn]);

  const updateItem = useCallback((id: string, field: keyof MasterData, value: string) => {
    setter(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  }, [setter]);

  const deleteItem = useCallback(async (id: string) => {
    try {
      // Only delete from database if it's not a temporary ID (new items have timestamp IDs)
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

  const saveData = useCallback(async () => {
    try {
      setSaving(true);
      const promises = data.map(async (item) => {
        // Check if it's a new item (has timestamp ID) or existing item
        const isNewItem = !isNaN(Number(item.id));
        
        if (isNewItem && (item.code || item.name)) {
          // Create new item
          const { id, ...itemData } = item;
          return await service.create(itemData);
        } else if (!isNewItem && (item.code || item.name)) {
          // Update existing item
          return await service.update(item.id, item);
        }
        return item;
      });

      const results = await Promise.all(promises);
      
      // Update the state with the returned data from database
      setter(results.filter(Boolean));
      
      toast({
        title: "Saved",
        description: "Data saved successfully",
      });
    } catch (error) {
      console.error('Error saving data:', error);
      toast({
        title: "Error",
        description: "Failed to save data",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  }, [data, service, setter, toast]);

  const getCompanyName = (companyID: string) => {
    const company = companies.find(c => c.id === companyID);
    return company ? company.name : "";
  };

  return (
    <Card className="bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={saveData} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button onClick={addNewItem}>
              <Plus className="h-4 w-4 mr-2" />
              Add New
            </Button>
          </div>
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
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={addNewItem}
                    className="h-6 w-6 p-0 ml-1"
                    title="Add New Item"
                  >
                    <Plus className="h-4 w-4 text-blue-600" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-50">
                  {showCompanyColumn && (
                    <TableCell className="border border-gray-300 p-1">
                      <Select
                        value={item.company_id || ""}
                        onValueChange={(value) => updateItem(item.id, 'company_id', value)}
                      >
                        <SelectTrigger className="border-0 p-1 h-8">
                          <SelectValue placeholder="Select company" />
                        </SelectTrigger>
                        <SelectContent>
                          {companies.map((company) => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  )}
                  <TableCell className="border border-gray-300 p-1">
                    <Input
                      value={item.code}
                      onChange={(e) => updateItem(item.id, 'code', e.target.value)}
                      className="border-0 p-1 h-8"
                      onFocus={(e) => e.target.select()}
                    />
                  </TableCell>
                  <TableCell className="border border-gray-300 p-1">
                    <Input
                      value={item.name}
                      onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                      className="border-0 p-1 h-8"
                      onFocus={(e) => e.target.select()}
                    />
                  </TableCell>
                  <TableCell className="border border-gray-300 p-1">
                    <Input
                      value={item.description || ""}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      className="border-0 p-1 h-8"
                      onFocus={(e) => e.target.select()}
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
