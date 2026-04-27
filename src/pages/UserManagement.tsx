import { UserManagementTable } from "@/components/user-management/UserManagementTable";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

export default function UserManagement() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <PageHeader
        title="User Management"
        description="Manage system users, assign roles, reset passwords, and revoke sessions"
        icon={Users}
      />
      <main className="flex-1 p-6">
        <UserManagementTable />
      </main>
    </div>
  );
}
