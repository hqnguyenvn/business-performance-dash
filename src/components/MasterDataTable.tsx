
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Edit, Eye, Trash2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from "@/components/ui/table";
import { useTableFilter } from "@/hooks/useTableFilter";

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MasterData | null>(null);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit' | 'add'>('view');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Add table filtering
  const { filteredData: filteredItems, setFilter, getActiveFilters } = useTableFilter(data);

  const addNewItem = () => {
    const newItem: MasterData = {
      id: Date.now().toString(),
      code: "",
      name: "",
      description: "",
      ...(showCompanyColumn && { companyID: "" })
    };
    setSelectedItem(newItem);
    setDialogMode('add');
    setIsDialogOpen(true);
  };

  const updateItem = (id: string, field: keyof MasterData, value: any) => {
    setter(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const openDialog = (item: MasterData, mode: 'view' | 'edit') => {
    setSelectedItem(item);
    setDialogMode(mode);
    setIsDialogOpen(true);
  };

  const deleteItem = (id: string) => {
    setItemToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      setter(prev => prev.filter(item => item.id !== itemToDelete));
      toast({
        title: "Deleted",
        description: "Item successfully deleted",
      });
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const saveItem = () => {
    if (selectedItem) {
      if (dialogMode === 'add') {
        setter(prev => [...prev, selectedItem]);
        toast({
          title: "Added",
          description: "New item has been added",
        });
      } else {
        setter(prev => prev.map(item => 
          item.id === selectedItem.id ? selectedItem : item
        ));
        toast({
          title: "Updated",
          description: "Item has been updated",
        });
      }
      setIsDialogOpen(false);
    }
  };

  return (
    <Card className="bg-white">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{title} ({filteredItems.length} records)</CardTitle>
          <Button onClick={addNewItem}>
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-blue-50">
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
                <TableHead className="border border-gray-300 text-center">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={showCompanyColumn ? 5 : 4} className="border border-gray-300 p-8 text-center text-gray-500">
                    {data.length === 0 
                      ? "No data available. Click \"Add New\" to start entering data."
                      : "No data matches the selected filters."
                    }
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id} className="hover:bg-gray-50">
                    <TableCell className="border border-gray-300 p-1">
                      <Input
                        value={item.code}
                        onChange={(e) => updateItem(item.id, 'code', e.target.value)}
                        className="border-0 p-1 h-8"
                      />
                    </TableCell>
                    <TableCell className="border border-gray-300 p-1">
                      <Input
                        value={item.name}
                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                        className="border-0 p-1 h-8"
                      />
                    </TableCell>
                    <TableCell className="border border-gray-300 p-1">
                      <Input
                        value={item.description || ""}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        className="border-0 p-1 h-8"
                      />
                    </TableCell>
                    {showCompanyColumn && (
                      <TableCell className="border border-gray-300 p-1">
                        <Input
                          value={item.companyID || ""}
                          onChange={(e) => updateItem(item.id, 'companyID', e.target.value)}
                          className="border-0 p-1 h-8"
                        />
                      </TableCell>
                    )}
                    <TableCell className="border border-gray-300 p-1">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDialog(item, 'view')}
                          className="h-6 w-6 p-0"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDialog(item, 'edit')}
                          className="h-6 w-6 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteItem(item.id)}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'view' ? 'View Item' : dialogMode === 'edit' ? 'Edit Item' : 'Add New Item'}
            </DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Code</label>
                {dialogMode === 'view' ? (
                  <div className="p-2 bg-gray-50 rounded">{selectedItem.code}</div>
                ) : (
                  <Input
                    value={selectedItem.code}
                    onChange={(e) => setSelectedItem({...selectedItem, code: e.target.value})}
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                {dialogMode === 'view' ? (
                  <div className="p-2 bg-gray-50 rounded">{selectedItem.name}</div>
                ) : (
                  <Input
                    value={selectedItem.name}
                    onChange={(e) => setSelectedItem({...selectedItem, name: e.target.value})}
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                {dialogMode === 'view' ? (
                  <div className="p-2 bg-gray-50 rounded">{selectedItem.description}</div>
                ) : (
                  <Input
                    value={selectedItem.description || ""}
                    onChange={(e) => setSelectedItem({...selectedItem, description: e.target.value})}
                  />
                )}
              </div>

              {showCompanyColumn && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Company</label>
                  {dialogMode === 'view' ? (
                    <div className="p-2 bg-gray-50 rounded">{selectedItem.companyID}</div>
                  ) : (
                    <Input
                      value={selectedItem.companyID || ""}
                      onChange={(e) => setSelectedItem({...selectedItem, companyID: e.target.value})}
                    />
                  )}
                </div>
              )}

              {dialogMode !== 'view' && (
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveItem}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default MasterDataTable;
