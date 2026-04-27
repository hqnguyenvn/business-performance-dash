import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useSettingsData } from "@/hooks/useSettingsData";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { SettingsTabs } from "@/components/settings/SettingsTabs";

const Settings = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { data, setters, loading } = useSettingsData();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
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
        onImport={() => {}}
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
