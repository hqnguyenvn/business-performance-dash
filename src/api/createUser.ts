
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = "https://atkbmtrrqydguikmvmvj.supabase.co";
// Bạn cần thêm service role key vào Secrets trong Replit
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function createUserWithAdmin(userData: {
  email: string;
  password: string;
  full_name?: string;
  role: string;
}) {
  try {
    // Tạo user với admin client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Bỏ qua xác thực email
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

    // Cập nhật role trong user_roles table
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .update({ role: userData.role as any })
      .eq('user_id', authData.user.id);

    if (roleError) {
      console.error('Failed to update user role:', roleError);
      // Không throw error ở đây vì user đã được tạo thành công
    }

    return authData.user;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}
