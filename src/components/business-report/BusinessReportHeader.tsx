
import { PageHeader } from "@/components/PageHeader";
import { BarChart3, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const BusinessReportHeader = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <PageHeader
      title="Business Performance Report"
      description="Comprehensive report by year and month"
      icon={BarChart3}
      actions={
        <Button onClick={handleSignOut} variant="outline">
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      }
    />
  );
};
