
import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['app_role'] | null;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: UserRole;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  // Lấy session ban đầu và lắng nghe thay đổi
  useEffect(() => {
    let unsub: (() => void) | null = null;

    const getInitialSessionAndListen = async () => {
      try {
        setLoading(true);
        // LẤY SESSION HIỆN TẠI TRƯỚC
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        // Lấy quyền role nếu có user
        if (currentSession?.user) {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', currentSession.user.id)
            .single();
          setRole(roleData?.role as UserRole ?? null);
        } else {
          setRole(null);
        }
      } catch (error) {
        setSession(null);
        setUser(null);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSessionAndListen();

    // ĐĂNG KÝ LẮNG NGHE các sự kiện auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, gotSession) => {
      setSession(gotSession);
      setUser(gotSession?.user ?? null);

      if (gotSession?.user) {
        // Lấy lại role mỗi lần auth change, defer để tránh deadlock
        setTimeout(async () => {
          try {
            const { data: roleData } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', gotSession.user.id)
              .single();
            setRole(roleData?.role as UserRole ?? null);
          } catch {
            setRole(null);
          } finally {
            setLoading(false);
          }
        }, 0);
      } else {
        setRole(null);
        setLoading(false);
      }
    });

    unsub = () => {
      subscription?.unsubscribe();
    };

    return () => {
      if (unsub) unsub();
    };
  }, []);

  const signOut = async () => {
    // Clear state immediately để tránh delay
    setLoading(true);
    setSession(null);
    setUser(null);
    setRole(null);
    
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("SignOut error:", error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    session,
    user,
    role,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
