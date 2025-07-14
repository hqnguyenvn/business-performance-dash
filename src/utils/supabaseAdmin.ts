import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = "https://atkbmtrrqydguikmvmvj.supabase.co";

// Sử dụng anon key thay vì service key trong client-side
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0a2JtdHJycXlkZ3Vpa212bXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NDA5MjMsImV4cCI6MjA2NTAxNjkyM30.3mWIKkhzEqB6lPULJItq1zI__U_g7q_WY1DFP-eLlBQ";

const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

export const supabaseAdmin = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      storage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {}
      }
    }
  }
);

// Function to create user using admin privileges
export async function createUserWithAdmin(userData: {
  email: string;
  password: string;
  full_name?: string;
  role: string;
}) {
  try {
    // Create user with admin client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: userData.full_name || null
      }
    });

    if (authError) {
      console.error("Auth error:", authError);
      throw authError;
    }

    const userId = authData.user?.id;
    if (!userId) {
      throw new Error("Failed to get user ID");
    }

    // Add role to user_roles table
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert({ 
        user_id: userId,
        role: userData.role as any,
        is_active: true 
      });

    if (roleError) {
      console.error("Role error:", roleError);
      throw roleError;
    }

    // Update profile if full_name provided
    if (userData.full_name?.trim()) {
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .upsert({ 
          id: userId,
          full_name: userData.full_name.trim() 
        });

      if (profileError) {
        console.error("Profile error:", profileError);
        throw profileError;
      }
    }

    return { user: authData.user, success: true };
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}