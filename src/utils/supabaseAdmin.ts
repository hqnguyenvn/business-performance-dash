import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = "https://atkbmtrrqydguikmvmvj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0a2JtdHJycXlkZ3Vpa212bXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NDA5MjMsImV4cCI6MjA2NTAxNjkyM30.3mWIKkhzEqB6lPULJItq1zI__U_g7q_WY1DFP-eLlBQ";

// Service role key for admin operations
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

export const supabaseAdmin = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
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

// Admin client with service role
export const supabaseAdminClient = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Function to create user using admin client
export async function createUserWithAdmin(userData: {
  email: string;
  password: string;
  full_name?: string;
  role: string;
}) {
  try {
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Service role key not configured. Please add VITE_SUPABASE_SERVICE_ROLE_KEY to your environment variables.");
    }

    // Create user with admin client
    const { data: authData, error: authError } = await supabaseAdminClient.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Skip email confirmation
      user_metadata: {
        full_name: userData.full_name || ''
      }
    });

    if (authError) {
      throw authError;
    }

    if (!authData.user) {
      throw new Error('Failed to create user');
    }

    // Update role in user_roles table
    const { error: roleError } = await supabaseAdminClient
      .from('user_roles')
      .update({ role: userData.role as any })
      .eq('user_id', authData.user.id);

    if (roleError) {
      console.error('Failed to update user role:', roleError);
      // Don't throw error here since user was created successfully
    }

    return authData.user;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}