
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { rolesService } from "@/services/masterDataService";
import { useTableFilter } from "@/hooks/useTableFilter";
import { useState, useCallback } from "react";

interface Role {
  id: string;
  code: string;
  description: string;
}

interface RolesTableProps {
  data: Role[];
  setter: React.Dispatch<React.SetStateAction<Role[]>>;
}

const RolesTable: React.FC<RolesTableProps> = ({ data, setter }) => {
  const { toast } = useToast();
  const { filteredData, setFilter, getActiveFilters } = useTableFilter(data);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Handle cell edit
  const handleCellEdit = useCallback(async (id: string, field: keyof Role, value: string) => {
    try {
      // Check for duplicate code
      if (field === 'code' && value) {
        const existingRole = data.find(role => role.id !== id && role.code.toLowerCase() === value.toLowerCase());
        if (existingRole) {
          toast({
            title: "Error",
            description: "Code already exists. Please use a different code.",
            variant: "destructive"
          });
          return;
        }
      }

      // Update in database
      const updatedRole = await rolesService.update(id, { [field]: value });
      
      // Update local state
      setter(prev => prev.map(role => 
        role.id === id ? { ...role, [field]: value } : role
      ));

      toast({
        title: "Success",
        description: "Role updated successfully"
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive"
      });
    }
  }, [data, setter, toast]);

  // Delete role
  const deleteRole = useCallback(async (id: string) => {
    try {
      await rolesService.delete(id);
      setter(prev => prev.filter(role => role.id !== id));
      setDeleteId(null);
      toast({
        title: "Success",
        description: "Role deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting role:', error);
      toast({
        title: "Error",
        description: "Failed to delete role",
        variant: "destructive"
      });
    }
  }, [setter, toast]);

  // Add new role
  const addNewRole = useCallback(() => {
    const newRole: Role = {
      id: "tmp-" + Date.now().toString() + Math.random().toString(36).slice(2, 6),
      code: "",
      description: ""
    };
    setter(prev => [...prev, newRole]);
  }, [setter]);

  // Save new role
  const saveNewRole = useCallback(async (role: Role) => {
    try {
      // Check for duplicate code
      if (role.code) {
        const existingRole = data.find(r => r.id !== role.id && r.code.toLowerCase() === role.code.toLowerCase());
        if (existingRole) {
          toast({
            title: "Error",
            description: "Code already exists. Please use a different code.",
            variant: "destructive"
          });
          return;
        }
      }

      const savedRole = await rolesService.create({
        code: role.code,
        description: role.description
      });

      setter(prev => prev.map(r => 
        r.id === role.id ? savedRole : r
      ));

      toast({
        title: "Success",
        description: "Role created successfully"
      });
    } catch (error) {
      console.error('Error creating role:', error);
      toast({
        title: "Error",
        description: "Failed to save role",
        variant: "destructive"
      });
    }
  }, [data, setter, toast]);

  return (
    <Card className="bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Roles</CardTitle>
          <Button onClick={addNewRole} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Role
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="border border-gray-300 w-12 text-center">
                  No.
                </TableHead>
                <TableHead className="border border-gray-300">
                  Code
                </TableHead>
                <TableHead className="border border-gray-300">
                  Description
                </TableHead>
                <TableHead className="border border-gray-300 text-center w-20">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((role, index) => (
                <TableRow key={role.id} className="hover:bg-gray-50">
                  <TableCell className="border border-gray-300 text-center text-sm">
                    {index + 1}
                  </TableCell>
                  <TableCell className="border border-gray-300">
                    <Input
                      value={role.code}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setter(prev => prev.map(r => 
                          r.id === role.id ? { ...r, code: newValue } : r
                        ));
                      }}
                      onBlur={(e) => {
                        const value = e.target.value.trim();
                        if (role.id.startsWith('tmp-')) {
                          if (value && role.description) {
                            saveNewRole({ ...role, code: value });
                          }
                        } else {
                          handleCellEdit(role.id, 'code', value);
                        }
                      }}
                      className="border-0 p-1 h-8"
                      placeholder="Enter code"
                    />
                  </TableCell>
                  <TableCell className="border border-gray-300">
                    <Input
                      value={role.description}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setter(prev => prev.map(r => 
                          r.id === role.id ? { ...r, description: newValue } : r
                        ));
                      }}
                      onBlur={(e) => {
                        const value = e.target.value.trim();
                        if (role.id.startsWith('tmp-')) {
                          if (value && role.code) {
                            saveNewRole({ ...role, description: value });
                          }
                        } else {
                          handleCellEdit(role.id, 'description', value);
                        }
                      }}
                      className="border-0 p-1 h-8"
                      placeholder="Enter description"
                    />
                  </TableCell>
                  <TableCell className="border border-gray-300 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(role.id)}
                      className="h-8 w-8 p-0 hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Delete Confirmation Dialog */}
        {deleteId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this role? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDeleteId(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteRole(deleteId)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RolesTable;
