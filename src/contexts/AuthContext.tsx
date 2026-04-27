import {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { api, SESSION_EXPIRED_EVENT } from "@/lib/api";

export type AppRole = "Admin" | "Manager" | "User";

export interface AuthUser {
  id: string;
  email: string;
}

interface AuthContextType {
  /** Truthiness proxy for "is logged in" — kept for backward compat with consumers */
  session: AuthUser | null;
  user: AuthUser | null;
  role: AppRole | null;
  permissions: string[];
  mustChangePassword: boolean;
  loading: boolean;
  /** Check whether the current user has a given permission key. */
  can: (permission: string | string[]) => boolean;
  signIn: (email: string, password: string) => Promise<{ mustChangePassword: boolean }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface MeResponse {
  user: AuthUser;
  role: AppRole | null;
  permissions: string[];
  mustChangePassword: boolean;
  profile?: { fullName: string | null; avatarUrl: string | null } | null;
}

interface LoginResponse {
  user: AuthUser;
  role: AppRole | null;
  permissions: string[];
  mustChangePassword: boolean;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [mustChangePassword, setMustChangePassword] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const me = await api.get<MeResponse>("/auth/me");
      setUser(me.user);
      setRole(me.role);
      setPermissions(me.permissions ?? []);
      setMustChangePassword(!!me.mustChangePassword);
    } catch {
      setUser(null);
      setRole(null);
      setPermissions([]);
      setMustChangePassword(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Listen for refresh-failure signals from the api wrapper — when this fires,
  // the user must be re-prompted to log in. ProtectedRoute will redirect once
  // session becomes null.
  useEffect(() => {
    const handler = () => {
      setUser(null);
      setRole(null);
      setPermissions([]);
      setMustChangePassword(false);
      setLoading(false);
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, handler);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handler);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const res = await api.post<LoginResponse>("/auth/login", {
        email,
        password,
      });
      setUser(res.user);
      setRole(res.role);
      setPermissions(res.permissions ?? []);
      setMustChangePassword(!!res.mustChangePassword);
      setLoading(false);
      return { mustChangePassword: !!res.mustChangePassword };
    },
    [],
  );

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("SignOut error:", err);
    } finally {
      setUser(null);
      setRole(null);
      setPermissions([]);
      setMustChangePassword(false);
      setLoading(false);
    }
  }, []);

  const permissionSet = useMemo(() => new Set(permissions), [permissions]);

  const can = useCallback(
    (permission: string | string[]): boolean => {
      if (!role) return false;
      const required = Array.isArray(permission) ? permission : [permission];
      if (required.length === 0) return true;
      for (const p of required) {
        if (!permissionSet.has(p)) return false;
      }
      return true;
    },
    [role, permissionSet],
  );

  const value: AuthContextType = {
    session: user, // truthiness proxy
    user,
    role,
    permissions,
    mustChangePassword,
    loading,
    can,
    signIn,
    signOut,
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
