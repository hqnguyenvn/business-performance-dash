import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = "https://atkbmtrrqydguikmvmvj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0a2JtdHJycXlkZ3Vpa212bXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NDA5MjMsImV4cCI6MjA2NTAxNjkyM30.3mWIKkhzEqB6lPULJItq1zI__U_g7q_WY1DFP-eLlBQ";

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

// Function to create user - simplified version using client-side capabilities
export async function createUserWithAdmin(userData: {
  email: string;
  password: string;
  full_name?: string;
  role: string;
}) {
  try {
    // Note: This will use signup instead of admin createUser
    // The actual user creation should be handled server-side
    throw new Error("User creation requires server-side implementation with proper admin privileges");
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}