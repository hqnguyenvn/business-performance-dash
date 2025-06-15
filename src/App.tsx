import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Revenues from "./pages/Revenues";
import Costs from "./pages/Costs";
import SalaryCosts from "./pages/SalaryCosts";
import BusinessReport from "./pages/BusinessReport";
import CustomerReport from "./pages/CustomerReport";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleBasedRoute from "./components/RoleBasedRoute";
import UserManagement from "./pages/UserManagement";

// Create QueryClient with default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const AppRoutes = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/revenues" element={<RoleBasedRoute allowedRoles={['Admin', 'Manager']}><Revenues /></RoleBasedRoute>} />
            <Route path="/costs" element={<RoleBasedRoute allowedRoles={['Admin', 'Manager']}><Costs /></RoleBasedRoute>} />
            <Route path="/salary-costs" element={<RoleBasedRoute allowedRoles={['Admin', 'Manager']}><SalaryCosts /></RoleBasedRoute>} />
            <Route path="/business-report" element={<RoleBasedRoute allowedRoles={['Admin', 'Manager', 'User']}><BusinessReport /></RoleBasedRoute>} />
            <Route path="/customer-report" element={<RoleBasedRoute allowedRoles={['Admin', 'Manager', 'User']}><CustomerReport /></RoleBasedRoute>} />
            <Route path="/user-management" element={<RoleBasedRoute allowedRoles={['Admin']}><UserManagement /></RoleBasedRoute>} />
            <Route path="/settings" element={<RoleBasedRoute allowedRoles={['Admin']}><Settings /></RoleBasedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </SidebarProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route 
              path="/*"
              element={
                <ProtectedRoute>
                  <AppRoutes />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
