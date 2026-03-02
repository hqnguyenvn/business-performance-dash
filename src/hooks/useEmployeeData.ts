import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Employee } from "@/types/employee";
import { employeeService } from "@/services/employeeService";
import { MasterData } from "@/hooks/useMasterDataEdit";
import { divisionsService } from "@/services/masterDataService";
import { roleService } from "@/services/roleService";
import { Role } from "@/types/role";

export function useEmployeeData() {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [divisions, setDivisions] = useState<MasterData[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [empData, divData, roleData] = await Promise.all([
        employeeService.getAll(),
        divisionsService.getAll(),
        roleService.getAll(),
      ]);
      setEmployees(empData);
      setDivisions(divData);
      setRoles(roleData);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCellEdit = useCallback(
    async (id: string, field: keyof Employee, value: string) => {
      const oldItem = employees.find((e) => e.id === id);
      if (!oldItem) return;

      setEmployees((prev) =>
        prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
      );

      try {
        const isTmp = id.startsWith("tmp-");
        if (!isTmp) {
          await employeeService.update(id, { [field]: value });
          toast({ title: "Saved", description: "Data saved successfully." });
        } else {
          const { id: _, created_at, updated_at, ...toCreate } = { ...oldItem, [field]: value };
          const created = await employeeService.create(toCreate);
          setEmployees((prev) => prev.map((e) => (e.id === id ? created : e)));
          toast({ title: "Created", description: "New employee added." });
        }
      } catch (error) {
        toast({ title: "Error", description: "Failed to save.", variant: "destructive" });
        setEmployees((prev) =>
          prev.map((e) => (e.id === id ? { ...e, [field]: oldItem[field as keyof Employee] } : e))
        );
      }
    },
    [employees, toast]
  );

  const addNewItem = useCallback((year?: number, month?: number) => {
    const now = new Date();
    const newItem: Employee = {
      id: "tmp-" + Date.now() + Math.random().toString(36).slice(2, 6),
      username: "",
      name: "",
      type: "",
      division_id: null,
      role_id: null,
      category: "",
      status: "Working",
      year: year ?? now.getFullYear(),
      month: month ?? (now.getMonth() + 1),
      working_day: 0,
    };
    setEmployees((prev) => [newItem, ...prev]);
  }, []);

  const addRowBelow = useCallback((index: number) => {
    const now = new Date();
    const newItem: Employee = {
      id: "tmp-" + Date.now() + Math.random().toString(36).slice(2, 6),
      username: "",
      name: "",
      type: "",
      division_id: null,
      role_id: null,
      category: "",
      status: "Working",
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      working_day: 0,
    };
    setEmployees((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, newItem);
      return next;
    });
  }, []);

  const deleteItem = useCallback(
    async (id: string) => {
      try {
        if (!id.startsWith("tmp-")) {
          await employeeService.delete(id);
        }
        setEmployees((prev) => prev.filter((e) => e.id !== id));
        toast({ title: "Deleted", description: "Employee deleted." });
      } catch (error) {
        toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
      }
    },
    [toast]
  );

  return {
    employees,
    divisions,
    roles,
    loading,
    handleCellEdit,
    addNewItem,
    addRowBelow,
    deleteItem,
    reload: loadData,
  };
}
