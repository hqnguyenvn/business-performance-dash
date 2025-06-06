
import React, { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from "@/components/ui/table";

interface MasterData {
  id: string;
  code: string;
  name: string;
  description?: string;
}

interface MasterDataTableProps {
  data: MasterData[];
  setter: React.Dispatch<React.SetStateAction<MasterData[]>>;
  title: string;
}

const MasterDataTable: React.FC<MasterDataTableProps> = ({ data, setter, title }) => {
  const { toast } = useToast();

  const addNewItem = useCallback(() => {
    const newItem: MasterData = {
      id: Date.now().toString(),
      code: "",
      name: "",
      description: "",
    };
    setter(prev => [...prev, newItem]);
  }, [setter]);

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
  }, [setter, toast]);

  const saveData = useCallback(() => {
    toast({
      title: "Saved",
      description: "Data saved successfully",
    });
  }, [toast]);

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
                <TableHead className="border border-gray-300">Code</TableHead>
                <TableHead className="border border-gray-300">Name</TableHead>
                <TableHead className="border border-gray-300">Description</TableHead>
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
              {data.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-50">
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteItem(item.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default MasterDataTable;
