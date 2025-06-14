
import { PageHeader } from "@/components/PageHeader";
import { Settings as SettingsIcon, Upload, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SettingsHeaderProps {
  onImport: () => void;
  onSignOut: () => void;
  isLoading: boolean;
}

export const SettingsHeader = ({ onImport, onSignOut, isLoading }: SettingsHeaderProps) => {
  return (
    <PageHeader
      title="Settings"
      description="Manage system master data"
      icon={SettingsIcon}
      actions={
        <div className="flex items-center gap-2">
          <Button onClick={onImport} variant="outline" disabled={isLoading}>
            <Upload className="h-4 w-4 mr-2" />
            Import from LocalStorage
          </Button>
          <Button onClick={onSignOut} variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      }
    />
  );
};
