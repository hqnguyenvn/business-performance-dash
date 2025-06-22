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
import { Trash2, Plus, Edit, Eye, Copy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { roleService } from "@/services/roleService";
import { Role } from "@/types/role";
import { useTableFilter } from "@/hooks/useTableFilter";
import { useState, useCallback, useRef } from "react";

interface RolesTableProps {
  data: Role[];
  setter: React.Dispatch<React.SetStateAction<Role[]>>;
}

const RolesTable: React.FC<RolesTableProps> = ({ data, setter }) => {
  const { toast } = useToast();
  const { filteredData, setFilter, getActiveFilters } = useTableFilter(data);
  const [deleteId, setDeleteId] = useState<string | null>(null);
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
    
    // Focus the first cell of the new row after a short delay
    setTimeout(() => {
      focusCell(filteredData.length, 'code');
    }, 100);
  }, [setter, filteredData.length]);

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

  // Clone row
  const cloneRow = useCallback((id: string) => {
    const roleToClone = data.find(role => role.id === id);
    if (roleToClone) {
      const clonedRole: Role = {
        id: "tmp-" + Date.now().toString() + Math.random().toString(36).slice(2, 6),
        code: "",
        description: roleToClone.description
      };
      
      const index = data.findIndex(role => role.id === id);
      setter(prev => {
        const newData = [...prev];
        newData.splice(index + 1, 0, clonedRole);
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
          <Table ref={tableRef}>
            <TableHeader>
              <TableRow className="bg-red-50">
                <TableHead className="border border-gray-300 w-16 text-center">
                  No.
                </TableHead>
                <TableHead className="border border-gray-300">
                  Code
                </TableHead>
                <TableHead className="border border-gray-300">
                  Description
                </TableHead>
                <TableHead className="border border-gray-300 text-center">
                  Actions
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={addNewRole}
                    className="h-6 w-6 p-0 ml-1"
                    title="Add New Row"
                  >
                    <Plus className="h-4 w-4 text-blue-600" />
                  </Button>
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
                  <TableRow key={role.id} className="hover:bg-gray-50">
                    <TableCell className="border border-gray-300 p-2 text-center">
                      {index + 1}
                    </TableCell>
                    <TableCell className="border border-gray-300 p-1">
                      <Input
                        value={getInputValue(role, 'code')}
                        onChange={(e) => handleInputChange(role.id, 'code', e.target.value)}
                        onBlur={() => handleCellBlur(role.id, 'code')}
                        onKeyDown={(e) => handleKeyDown(e, role.id, 'code', index)}
                        className="border-0 p-1 h-8"
                        placeholder="Enter code"
                      />
                    </TableCell>
                    <TableCell className="border border-gray-300 p-1">
                      <Input
                        value={getInputValue(role, 'description')}
                        onChange={(e) => handleInputChange(role.id, 'description', e.target.value)}
                        onBlur={() => handleCellBlur(role.id, 'description')}
                        onKeyDown={(e) => handleKeyDown(e, role.id, 'description', index)}
                        className="border-0 p-1 h-8"
                        placeholder="Enter description"
                      />
                    </TableCell>
                    <TableCell className="border border-gray-300 p-1">
                      <div className="flex gap-1 justify-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => insertRowBelow(role.id)}
                          className="h-6 w-6 p-0"
                          title="Add Row Below"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => cloneRow(role.id)}
                          className="h-6 w-6 p-0"
                          title="Clone Row"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {/* View action */}}
                          className="h-6 w-6 p-0"
                          title="View"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {/* Edit action */}}
                          className="h-6 w-6 p-0"
                          title="Edit"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeleteId(role.id)}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                          title="Delete"
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
