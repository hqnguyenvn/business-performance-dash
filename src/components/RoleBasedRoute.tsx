
import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from './PageHeader';
import { AlertTriangle } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

interface RoleBasedRouteProps {
  children: ReactNode;
  allowedRoles: Array<Database['public']['Enums']['app_role']>;
}

const RoleBasedRoute = ({ children, allowedRoles }: RoleBasedRouteProps) => {
  const { role, loading } = useAuth();

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

  if (!role || !allowedRoles.includes(role)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader title="Access Denied" description="You do not have permission to view this page." icon={AlertTriangle} />
      </div>
    );
  }

  return <>{children}</>;
};

export default RoleBasedRoute;
