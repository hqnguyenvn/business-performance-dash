
import { Home, DollarSign, Receipt, Users, BarChart3, Settings, TrendingUp, Building, Shield } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router-dom";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Revenue Management",
    url: "/revenues",
    icon: DollarSign,
  },
  {
    title: "Cost Management",
    url: "/costs",
    icon: Receipt,
  },
  {
    title: "Salary Costs",
    url: "/salary-costs",
    icon: Users,
  },
  {
    title: "Business Report",
    url: "/business-report",
    icon: BarChart3,
  },
  {
    title: "Customer Report",
    url: "/customer-report",
    icon: TrendingUp,
  },
  {
    title: "Company Report",
    url: "/company-report",
    icon: Building,
  },
  {
    title: "Division Report",
    url: "/division-report",
    icon: BarChart3,
  },
  {
    title: "User Management",
    url: "/user-management",
    icon: Shield,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <Building className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-lg font-bold text-gray-900">Business Manager</h1>
            <p className="text-sm text-gray-500">Business Management System</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
