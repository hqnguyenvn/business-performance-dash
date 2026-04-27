import {
  Home,
  DollarSign,
  Receipt,
  Users,
  BarChart3,
  Settings,
  TrendingUp,
  Building,
  Target,
  Shield,
  LogOut,
  User as UserIcon,
} from "lucide-react";
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
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { type LucideIcon } from "lucide-react";

interface MenuItem {
  title: string;
  url: string;
  icon: LucideIcon;
  /** Permission key required to see this entry. Omit for "always visible". */
  permission?: string;
}

const menuItems: MenuItem[] = [
  { title: "Dashboard", url: "/", icon: Home },
  {
    title: "Plan vs Actual",
    url: "/plan-vs-actual",
    icon: TrendingUp,
    permission: "reports:read",
  },
  {
    title: "Business Report",
    url: "/business-report",
    icon: BarChart3,
    permission: "reports:read",
  },
  {
    title: "Customer Report",
    url: "/customer-report",
    icon: TrendingUp,
    permission: "reports:read",
  },
  {
    title: "Company Report",
    url: "/company-report",
    icon: Building,
    permission: "reports:read",
  },
  {
    title: "Annual Plan",
    url: "/plans",
    icon: Target,
    permission: "plans:read",
  },
  {
    title: "Revenue Management",
    url: "/revenues",
    icon: DollarSign,
    permission: "revenues:read",
  },
  {
    title: "Cost Management",
    url: "/costs",
    icon: Receipt,
    permission: "costs:read",
  },
  {
    title: "Customer Cost Management",
    url: "/salary-costs",
    icon: Users,
    permission: "salary_costs:read",
  },
  {
    title: "Employee Working Days",
    url: "/employees",
    icon: Users,
    permission: "employees:read",
  },
  {
    title: "User Management",
    url: "/user-management",
    icon: Shield,
    permission: "users:manage",
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    permission: "settings:manage",
  },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { can, user, signOut } = useAuth();

  // Filter menu items by permission so users don't see things they can't access.
  const visibleItems = menuItems.filter(
    (item) => !item.permission || can(item.permission),
  );

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-3 group-data-[collapsible=icon]:p-2">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          {/* Expanded: full SKG logo (hidden in icon mode — it's wider than 32px and would distort) */}
          <img
            src="/logo.png"
            alt="SKG"
            className="h-8 w-auto shrink-0 group-data-[collapsible=icon]:hidden"
          />
          {/* Collapsed: square fallback icon */}
          <Building
            className="hidden h-6 w-6 shrink-0 text-primary group-data-[collapsible=icon]:block"
          />
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <h1 className="text-lg font-bold text-gray-900 leading-tight truncate">
              SKG Technology JSC
            </h1>
            <p className="text-[11px] text-gray-500 truncate leading-tight">
              Enterprice Resource Managment
            </p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                  >
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
      <SidebarFooter className="p-2 border-t">
        {user && (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={location.pathname === "/profile"}
              >
                <Link to="/profile">
                  <UserIcon />
                  <span className="truncate">{user.email}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleSignOut}>
                <LogOut />
                <span>Sign out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
