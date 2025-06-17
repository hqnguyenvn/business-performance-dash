
import { PageHeader } from "@/components/PageHeader";
import { Settings as SettingsIcon } from "lucide-react";

interface SettingsHeaderProps {
  onImport: () => void;
  onSignOut: () => void;
  isLoading: boolean;
}

// Đã loại bỏ prop actions để bỏ 2 nút Import & Sign out
export const SettingsHeader = (_props: SettingsHeaderProps) => {
  return (
    <PageHeader
      title="Settings"
      description="Manage system master data"
      icon={SettingsIcon}
    />
  );
};
