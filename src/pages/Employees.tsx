import { PageHeader } from "@/components/PageHeader";
import { Users } from "lucide-react";
import { EmployeeTable } from "@/components/employees/EmployeeTable";

export default function Employees() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <PageHeader
        title="Employee Working Days Management"
        description="Manage employee working days data"
        icon={Users}
      />
      <main className="flex-1 p-6">
        <EmployeeTable />
      </main>
    </div>
  );
}
