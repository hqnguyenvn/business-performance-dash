import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { UserMenu } from "./UserMenu";
import { Bell } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, icon: Icon, actions }: PageHeaderProps) {
  return (
    <div className="border-b bg-white">
      <div className="flex items-center justify-between p-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div className="flex items-center gap-3">
            {Icon && <Icon className="h-8 w-8 text-blue-600" />}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {description && <p className="text-gray-600">{description}</p>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {actions}
          <button
            type="button"
            className="relative rounded-full p-2 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-gray-700" />
            {/* Badge số lượng notification (có thể mở sau) */}
            {/* <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">3</span> */}
          </button>
          <UserMenu />
        </div>
      </div>
    </div>
  );
}
