
import { useToast } from "@/hooks/use-toast";
import { importDataFromLocalStorage } from "@/utils/importData";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useSettingsData } from "@/hooks/useSettingsData";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { SettingsTabs } from "@/components/settings/SettingsTabs";

const Settings = () => {
  const { toast } = useToast();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { data, setters, loading, setLoading, loadAllData } = useSettingsData();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleImportData = async () => {
    try {
      setLoading(true);
      toast({
        title: "Import Starting",
        description: "Importing data from localStorage...",
      });

      const result = await importDataFromLocalStorage();
      
      if (result.success) {
        toast({
          title: "Import Successful",
          description: result.message,
        });
        await loadAllData();
      } else {
        toast({
          title: "Import Failed",
          description: result.message,
          variant: "destructive"
        });
        console.error('Import error details:', result.details);
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: "An unexpected error occurred during import",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SettingsHeader 
        onImport={handleImportData}
        onSignOut={handleSignOut}
        isLoading={loading}
      />
      <div className="p-6">
        <SettingsTabs data={data} setters={setters} />
      </div>
    </div>
  );
};

export default Settings;
