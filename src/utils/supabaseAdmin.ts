
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = "https://atkbmtrrqydguikmvmvj.supabase.co";

// Sử dụng anon key thay vì service key trong client-side
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0a2JtdHJycXlkZ3Vpa212bXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NDA5MjMsImV4cCI6MjA2NTAxNjkyM30.3mWIKkhzEqB6lPULJItq1zI__U_g7q_WY1DFP-eLlBQ";

export const supabaseAdmin = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      storage: localStorage
    }
  }
);
