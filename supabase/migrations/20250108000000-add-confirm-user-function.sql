
-- Function để xác nhận email của user
CREATE OR REPLACE FUNCTION confirm_user_email(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE auth.users 
  SET 
    email_confirmed_at = NOW(),
    confirmation_sent_at = NOW()
  WHERE id = user_id;
END;
$$;

-- Cấp quyền thực thi cho authenticated users
GRANT EXECUTE ON FUNCTION confirm_user_email(uuid) TO authenticated;
