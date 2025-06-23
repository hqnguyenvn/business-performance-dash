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
import { roleService } from "@/services/roleService";
import { Role } from "@/types/role";
import { useTableFilter } from "@/hooks/useTableFilter";
import { useState, useCallback, useRef } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface RolesTableProps {
  data: Role[];
  setter: React.Dispatch<React.SetStateAction<Role[]>>;
}

const RolesTable: React.FC<RolesTableProps> = ({ data, setter }) => {
  const { toast } = useToast();
  const { filteredData, setFilter, getActiveFilters } = useTableFilter(data);
  const [editingCell, setEditingCell] = useState<{ id: string; field: keyof Role } | null>(null);
  const [editingValues, setEditingValues] = useState<Record<string, any>>({});
  const tableRef = useRef<HTMLTableElement>(null);

  // Handle input change
  const handleInputChange = (id: string, field: keyof Role, value: string) => {
    const key = `${id}-${field}`;
    setEditingValues(prev => ({ ...prev, [key]: value }));
    
    // Update local state immediately for UI responsiveness
    setter(prev => prev.map(role => 
      role.id === id ? { ...role, [field]: value } : role
    ));
  };

  // Handle cell blur/save
  const handleCellBlur = useCallback(async (id: string, field: keyof Role) => {
    const key = `${id}-${field}`;
    const value = editingValues[key];
    
    if (value !== undefined) {
      try {
        // Check for duplicate code
        if (field === 'code' && value.trim()) {
          const existingRole = data.find(role => role.id !== id && role.code.toLowerCase() === value.trim().toLowerCase());
          if (existingRole) {
            toast({
              title: "Error",
              description: "Code already exists. Please use a different code.",
              variant: "destructive"
            });
            // Revert the change
            const originalRole = data.find(r => r.id === id);
            if (originalRole) {
              setter(prev => prev.map(role => 
                role.id === id ? { ...role, [field]: originalRole[field] } : role
              ));
            }
            return;
          }
        }

        if (id.startsWith('tmp-')) {
          // For new roles, save only if both code and description are filled
          const currentRole = data.find(r => r.id === id);
          if (currentRole && currentRole.code.trim() && currentRole.description.trim()) {
            await saveNewRole(currentRole);
          }
        } else {
          // Update existing role
          await roleService.update(id, { [field]: value.trim() });
          toast({
            title: "Success",
            description: "Role updated successfully"
          });
        }
      } catch (error) {
        console.error('Error updating role:', error);
        toast({
          title: "Error",
          description: "Failed to update role",
          variant: "destructive"
        });
      }
      
      // Clear editing value
      setEditingValues(prev => {
        const newValues = { ...prev };
        delete newValues[key];
        return newValues;
      });
    }
    setEditingCell(null);
  }, [data, setter, toast, editingValues]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, id: string, field: keyof Role, index: number) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      handleCellBlur(id, field);
      
      // Navigate to next cell
      const fields: (keyof Role)[] = ['code', 'description'];
      const currentFieldIndex = fields.indexOf(field);
      
      if (e.shiftKey && e.key === 'Tab') {
        // Navigate backwards
        if (currentFieldIndex > 0) {
          // Move to previous field in same row
          const prevField = fields[currentFieldIndex - 1];
          setTimeout(() => focusCell(index, prevField), 50);
        } else if (index > 0) {
          // Move to last field of previous row
          const prevField = fields[fields.length - 1];
          setTimeout(() => focusCell(index - 1, prevField), 50);
        }
      } else {
        // Navigate forwards
        if (currentFieldIndex < fields.length - 1) {
          // Move to next field in same row
          const nextField = fields[currentFieldIndex + 1];
          setTimeout(() => focusCell(index, nextField), 50);
        } else if (index < filteredData.length - 1) {
          // Move to first field of next row
          const nextField = fields[0];
          setTimeout(() => focusCell(index + 1, nextField), 50);
        }
      }
    }
    
    if (e.key === 'Escape') {
      // Revert changes and blur
      const key = `${id}-${field}`;
      const originalRole = data.find(r => r.id === id);
      if (originalRole) {
        setter(prev => prev.map(role => 
          role.id === id ? { ...role, [field]: originalRole[field] } : role
        ));
        setEditingValues(prev => {
          const newValues = { ...prev };
          delete newValues[key];
          return newValues;
        });
      }
      setEditingCell(null);
      (e.target as HTMLInputElement).blur();
    }
  };

  // Focus specific cell
  const focusCell = (rowIndex: number, field: keyof Role) => {
    if (tableRef.current) {
      const fieldIndex = field === 'code' ? 1 : 2; // Skip the No. column
      const row = tableRef.current.querySelectorAll('tbody tr')[rowIndex];
      if (row) {
        const cell = row.children[fieldIndex];
        const input = cell?.querySelector('input') as HTMLInputElement;
        if (input) {
          input.focus();
          input.select();
        }
      }
    }
  };

  // Get input value
  const getInputValue = (role: Role, field: keyof Role) => {
    const key = `${role.id}-${field}`;
    return editingValues[key] !== undefined ? editingValues[key] : (role[field] || "");
  };

  // Delete role
  const deleteRole = useCallback(async (id: string) => {
    try {
      if (!id.startsWith('tmp-')) {
        await roleService.delete(id);
      }
      setter(prev => prev.filter(role => role.id !== id));
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
    setter(prev => [newRole, ...prev]);
    
    // Focus the first cell of the new row after a short delay
    setTimeout(() => {
      focusCell(0, 'code');
    }, 100);
  }, [setter]);

  // Insert row below
  const insertRowBelow = useCallback((id: string) => {
    const index = data.findIndex(role => role.id === id);
    if (index !== -1) {
      const newRole: Role = {
        id: "tmp-" + Date.now().toString() + Math.random().toString(36).slice(2, 6),
        code: "",
        description: ""
      };
      setter(prev => {
        const newData = [...prev];
        newData.splice(index + 1, 0, newRole);
        return newData;
      });
    }
  }, [data, setter]);

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

      const savedRole = await roleService.create({
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

  const handleCellClick = (id: string, field: keyof Role) => {
    setEditingCell({ id, field });
  };

  const isEditing = (id: string, field: keyof Role) => {
    return editingCell?.id === id && editingCell.field === field;
  };

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle>Roles</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table ref={tableRef}>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="border border-gray-300 w-12 text-center">No.</TableHead>
                <TableHead className="border border-gray-300 text-center">Code</TableHead>
                <TableHead className="border border-gray-300">Description</TableHead>
                <TableHead className="border border-gray-300 text-center w-28">
                  <div className="flex items-center justify-center gap-1">
                    <span>Actions</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="ml-1 h-6 w-6 p-0"
                      onClick={addNewRole}
                      title="Add new row"
                    >
                      <Plus size={16} />
                    </Button>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="border border-gray-300 p-8 text-center text-gray-500">
                    {data.length === 0
                      ? "No data available. Click \"Add Role\" to start entering data."
                      : "No data matches the current filters."
                    }
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((role, index) => (
                  <TableRow key={role.id} className="group hover:bg-gray-50 h-[40px]">
                    <TableCell className="text-center font-medium border border-gray-300 p-1">{index + 1}</TableCell>
                    
                    <TableCell className="text-center p-1 border border-gray-300">
                      {isEditing(role.id, 'code') ? (
                        <Input
                          value={getInputValue(role, 'code')}
                          onChange={(e) => handleInputChange(role.id, 'code', e.target.value)}
                          onBlur={() => handleCellBlur(role.id, 'code')}
                          onKeyDown={(e) => handleKeyDown(e, role.id, 'code', index)}
                          className="border-0 p-1 h-8 text-center"
                          placeholder="Enter code"
                          autoFocus
                        />
                      ) : (
                        <div 
                          className="cursor-pointer h-8 flex items-center justify-center" 
                          onClick={() => handleCellClick(role.id, 'code')}
                        >
                          {role.code}
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="p-1 border border-gray-300">
                      {isEditing(role.id, 'description') ? (
                        <Input
                          value={getInputValue(role, 'description')}
                          onChange={(e) => handleInputChange(role.id, 'description', e.target.value)}
                          onBlur={() => handleCellBlur(role.id, 'description')}
                          onKeyDown={(e) => handleKeyDown(e, role.id, 'description', index)}
                          className="border-0 p-1 h-8"
                          placeholder="Enter description"
                          autoFocus
                        />
                      ) : (
                        <div 
                          className="cursor-pointer h-8 flex items-center px-2" 
                          onClick={() => handleCellClick(role.id, 'description')}
                        >
                          {role.description}
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="p-1 text-center border border-gray-300">
                      <div className="flex items-center justify-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-6 w-6"
                          title="Add row after"
                          onClick={() => insertRowBelow(role.id)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="destructive"
                              className="h-6 w-6"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this role? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteRole(role.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default RolesTable;
