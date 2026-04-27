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
import Plans from "./pages/Plans";
import PlanVsActual from "./pages/PlanVsActual";
import Costs from "./pages/Costs";
import SalaryCosts from "./pages/SalaryCosts";
import BusinessReport from "./pages/BusinessReport";
import CustomerReport from "./pages/CustomerReport";
import CompanyReport from "./pages/CompanyReport";
import DivisionReport from "./pages/DivisionReport";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import ChangePassword from "./pages/ChangePassword";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import RequirePermission from "./components/RequirePermission";
import UserManagement from "./pages/UserManagement";
import Employees from "./pages/Employees";

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
    <SidebarProvider
      style={
        {
          "--sidebar-width": "18rem",
        } as React.CSSProperties
      }
    >
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 min-w-0">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route
              path="/plan-vs-actual"
              element={
                <RequirePermission permission="reports:read">
                  <PlanVsActual />
                </RequirePermission>
              }
            />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route
              path="/revenues"
              element={
                <RequirePermission permission="revenues:read">
                  <Revenues />
                </RequirePermission>
              }
            />
            <Route
              path="/plans"
              element={
                <RequirePermission permission="plans:read">
                  <Plans />
                </RequirePermission>
              }
            />
            <Route
              path="/costs"
              element={
                <RequirePermission permission="costs:read">
                  <Costs />
                </RequirePermission>
              }
            />
            <Route
              path="/salary-costs"
              element={
                <RequirePermission permission="salary_costs:read">
                  <SalaryCosts />
                </RequirePermission>
              }
            />
            <Route
              path="/business-report"
              element={
                <RequirePermission permission="reports:read">
                  <BusinessReport />
                </RequirePermission>
              }
            />
            <Route
              path="/customer-report"
              element={
                <RequirePermission permission="reports:read">
                  <CustomerReport />
                </RequirePermission>
              }
            />
            <Route
              path="/company-report"
              element={
                <RequirePermission permission="reports:read">
                  <CompanyReport />
                </RequirePermission>
              }
            />
            <Route
              path="/division-report"
              element={
                <RequirePermission permission="reports:read">
                  <DivisionReport />
                </RequirePermission>
              }
            />
            <Route
              path="/employees"
              element={
                <RequirePermission permission="employees:read">
                  <Employees />
                </RequirePermission>
              }
            />
            <Route
              path="/user-management"
              element={
                <RequirePermission permission="users:manage">
                  <UserManagement />
                </RequirePermission>
              }
            />
            <Route
              path="/settings"
              element={
                <RequirePermission permission="settings:manage">
                  <Settings />
                </RequirePermission>
              }
            />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </SidebarProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
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
