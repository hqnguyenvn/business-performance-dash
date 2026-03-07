
-- 1. Fix confirm_user_email: add Admin-only check
CREATE OR REPLACE FUNCTION confirm_user_email(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT check_user_role(auth.uid(), 'Admin') THEN
    RAISE EXCEPTION 'Access denied: Admin only';
  END IF;
  UPDATE auth.users
  SET email_confirmed_at = NOW(),
      confirmation_sent_at = NOW()
  WHERE id = user_id;
END;
$$;

-- 2. Enable RLS on roles table and add proper policies
-- First drop the existing overly-permissive policies
DROP POLICY IF EXISTS "Allow authenticated users to delete roles" ON public.roles;
DROP POLICY IF EXISTS "Allow authenticated users to insert roles" ON public.roles;
DROP POLICY IF EXISTS "Allow authenticated users to update roles" ON public.roles;
DROP POLICY IF EXISTS "Allow authenticated users to read roles" ON public.roles;

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_full_access_roles"
  ON public.roles FOR ALL
  USING (check_user_role(auth.uid(), 'Admin'))
  WITH CHECK (check_user_role(auth.uid(), 'Admin'));

CREATE POLICY "authenticated_read_roles"
  ON public.roles FOR SELECT
  USING (auth.role() = 'authenticated');

-- 3. Fix salary_costs: restrict SELECT to Admin and Manager only
DROP POLICY IF EXISTS "Managers and Users can read salary costs" ON public.salary_costs;

CREATE POLICY "Admins and Managers can read salary costs"
  ON public.salary_costs FOR SELECT
  USING (
    check_user_role(auth.uid(), 'Admin')
    OR check_user_role(auth.uid(), 'Manager')
  );
