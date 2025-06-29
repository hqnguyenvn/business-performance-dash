
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { LogIn, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import React from "react";

export const UserMenu = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  const handleLogin = () => {
    navigate("/auth");
  };

  const handleProfile = () => {
    navigate("/profile");
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      // Sử dụng React Router navigation thay vì window.location.href
      navigate("/auth", { replace: true });
    } catch (error) {
      console.error("Sign out error:", error);
      // Fallback nếu có lỗi
      navigate("/auth", { replace: true });
    } finally {
      setIsSigningOut(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center px-3 text-sm text-gray-500 animate-pulse">
        Loading...
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="User menu">
          <User className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {user ? (
          <>
            <DropdownMenuLabel>
              {user.email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleProfile}>
              <User className="mr-2 w-4 h-4" /> My Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut} disabled={isSigningOut}>
              <LogOut className="mr-2 w-4 h-4" /> 
              {isSigningOut ? "Đang đăng xuất..." : "Đăng xuất"}
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem onClick={handleLogin}>
            <LogIn className="mr-2 w-4 h-4" /> Đăng nhập
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
