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
  companyID?: string;
}

interface MasterDataTableProps {
  data: MasterData[];
  setter: React.Dispatch<React.SetStateAction<MasterData[]>>;
  title: string;
  showCompanyColumn?: boolean;
  companies?: MasterData[];
}

const MasterDataTable: React.FC<MasterDataTableProps> = ({ 
  data, 
  setter, 
  title, 
  showCompanyColumn = false,
  companies = [] 
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

  const addNewItem = useCallback(() => {
    const newItem: MasterData = {
      id: Date.now().toString(),
      code: "",
      name: "",
      description: "",
      ...(showCompanyColumn && { companyID: "" }),
    };
    setter(prev => [...prev, newItem]);
  }, [setter, showCompanyColumn]);

  const updateItem = useCallback((id: string, field: keyof MasterData, value: string) => {
    setter(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  }, [setter]);

  const deleteItem = useCallback((id: string) => {
    setter(prev => prev.filter(item => item.id !== id));
    toast({
      title: "Deleted",
      description: "Item successfully deleted",
    });
    setDeleteId(null);
  }, [setter, toast]);

  const saveData = useCallback(() => {
    toast({
      title: "Saved",
      description: "Data saved successfully",
    });
  }, [toast]);

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
            <Button variant="outline" onClick={saveData}>
              <Save className="h-4 w-4 mr-2" />
              Save
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
                    filterField="companyID"
                    onFilter={setFilter}
                    activeFilters={getActiveFilters("companyID")}
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
                        value={item.companyID || ""}
                        onValueChange={(value) => updateItem(item.id, 'companyID', value)}
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
