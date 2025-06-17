
import RoleBasedRoute from "@/components/RoleBasedRoute";
import { UserManagementTable } from "@/components/user-management/UserManagementTable";
import { Settings } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

export default function UserManagement() {
  return (
    <RoleBasedRoute allowedRoles={["Admin"]}>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <PageHeader
          title="User Management"
          description="Manage system users, assign roles and activate/deactivate accounts"
          icon={Settings}
        />
        <main className="flex-1 p-6">
          <UserManagementTable />
        </main>
      </div>
    </RoleBasedRoute>
  );
}
