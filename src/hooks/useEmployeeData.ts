import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Employee, getBusinessDays } from "@/types/employee";
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
    const useYear = year ?? now.getFullYear();
    const useMonth = month ?? (now.getMonth() + 1);
    const newItem: Employee = {
      id: "tmp-" + Date.now() + Math.random().toString(36).slice(2, 6),
      username: "",
      name: "",
      type: "",
      division_id: null,
      role_id: null,
      category: "",
      status: "Working",
      year: useYear,
      month: useMonth,
      working_day: getBusinessDays(useYear, useMonth),
    };
    setEmployees((prev) => [newItem, ...prev]);
  }, []);

  const addRowBelow = useCallback((index: number) => {
    const now = new Date();
    const useYear = now.getFullYear();
    const useMonth = now.getMonth() + 1;
    const newItem: Employee = {
      id: "tmp-" + Date.now() + Math.random().toString(36).slice(2, 6),
      username: "",
      name: "",
      type: "",
      division_id: null,
      role_id: null,
      category: "",
      status: "Working",
      year: useYear,
      month: useMonth,
      working_day: getBusinessDays(useYear, useMonth),
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

  const cloneData = useCallback(
    async (sourceYear: number, sourceMonth: number, targetYear: number, targetMonth: number) => {
      try {
        const sourceEmployees = employees.filter(
          (e) => e.year === sourceYear && e.month === sourceMonth && !e.id.startsWith("tmp-")
        );
        if (sourceEmployees.length === 0) {
          toast({ title: "No data", description: "No employees found for the source month.", variant: "destructive" });
          return;
        }

        const sourceBD = getBusinessDays(sourceYear, sourceMonth);
        const targetBD = getBusinessDays(targetYear, targetMonth);

        // Parallel create — previously this ran sequentially in a for…await
        // loop so cloning a 50-employee roster took 50× the round-trip time.
        const results = await Promise.allSettled(
          sourceEmployees.map((emp) => {
            const adjustedWorkingDay =
              sourceBD > 0
                ? Math.round((emp.working_day / sourceBD) * targetBD * 100) / 100
                : targetBD;
            const { id, created_at, updated_at, ...rest } = emp;
            return employeeService.create({
              ...rest,
              year: targetYear,
              month: targetMonth,
              working_day: adjustedWorkingDay,
            });
          }),
        );
        const created = results.filter((r) => r.status === "fulfilled").length;
        const failed = results.length - created;
        if (failed > 0) {
          console.warn(`[clone] ${failed} employee creates failed`);
        }

        toast({ title: "Cloned", description: `${created} employees cloned successfully.` });
        loadData();
      } catch (error) {
        toast({ title: "Error", description: "Failed to clone employees.", variant: "destructive" });
      }
    },
    [employees, toast, loadData]
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
    cloneData,
    reload: loadData,
  };
}
