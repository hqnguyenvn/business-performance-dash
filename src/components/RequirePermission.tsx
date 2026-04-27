import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "./PageHeader";
import { AlertTriangle } from "lucide-react";

interface RequirePermissionProps {
  children: ReactNode;
  /** A single permission key or an array. All are required (AND). */
  permission: string | string[];
}

/**
 * Gate a route / region by permission. Use this instead of RoleBasedRoute:
 *
 *   <RequirePermission permission="costs:read">
 *     <CostsPage />
 *   </RequirePermission>
 *
 *   <RequirePermission permission={["costs:read", "costs:write"]}>
 *     <CostsEditor />
 *   </RequirePermission>
 */
const RequirePermission = ({ children, permission }: RequirePermissionProps) => {
  const { can, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!can(permission)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader
          title="Access Denied"
          description="You do not have permission to view this page."
          icon={AlertTriangle}
        />
      </div>
    );
  }

  return <>{children}</>;
};

export default RequirePermission;
