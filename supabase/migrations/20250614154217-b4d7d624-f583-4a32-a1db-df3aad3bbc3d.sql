
-- 1. Create an enum type for user roles
CREATE TYPE public.app_role AS ENUM ('Admin', 'Manager', 'User');

-- 2. Create a table to store user roles. A user can only have one role.
CREATE TABLE public.user_roles (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    role public.app_role NOT NULL
);

-- 3. Create a helper function to check if a user has a specific role.
-- This function is SECURITY DEFINER to bypass RLS policies when checking roles.
CREATE OR REPLACE FUNCTION public.check_user_role(p_user_id uuid, p_role app_role)
RETURNS BOOLEAN AS $$
DECLARE
  v_role_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = p_user_id AND role = p_role
  ) INTO v_role_exists;
  RETURN v_role_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Set up RLS for the user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admins to manage all user roles"
    ON public.user_roles FOR ALL
    USING (check_user_role(auth.uid(), 'Admin'))
    WITH CHECK (check_user_role(auth.uid(), 'Admin'));

CREATE POLICY "Allow users to view their own role"
    ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id);

-- 5. Create a trigger to automatically assign the 'User' role to new sign-ups.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'User');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Apply RLS policies to data tables based on roles

-- For 'costs' table
ALTER TABLE public.costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins have full access to costs"
    ON public.costs FOR ALL
    USING (check_user_role(auth.uid(), 'Admin'))
    WITH CHECK (check_user_role(auth.uid(), 'Admin'));
CREATE POLICY "Managers and Users can read costs"
    ON public.costs FOR SELECT
    USING (check_user_role(auth.uid(), 'Manager') OR check_user_role(auth.uid(), 'User'));

-- For 'salary_costs' table
ALTER TABLE public.salary_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins have full access to salary costs"
    ON public.salary_costs FOR ALL
    USING (check_user_role(auth.uid(), 'Admin'))
    WITH CHECK (check_user_role(auth.uid(), 'Admin'));
CREATE POLICY "Managers and Users can read salary costs"
    ON public.salary_costs FOR SELECT
    USING (check_user_role(auth.uid(), 'Manager') OR check_user_role(auth.uid(), 'User'));

-- For 'revenues' table
ALTER TABLE public.revenues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins and Managers have full access to revenues"
    ON public.revenues FOR ALL
    USING (check_user_role(auth.uid(), 'Admin') OR check_user_role(auth.uid(), 'Manager'))
    WITH CHECK (check_user_role(auth.uid(), 'Admin') OR check_user_role(auth.uid(), 'Manager'));
CREATE POLICY "Users can read revenues"
    ON public.revenues FOR SELECT
    USING (check_user_role(auth.uid(), 'User'));

-- 7. Apply RLS for master data tables (read for all authenticated, write for admin)
CREATE OR REPLACE PROCEDURE public.secure_master_data_table(table_name TEXT)
LANGUAGE plpgsql
AS $$
BEGIN
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', table_name);
    EXECUTE format('
        CREATE POLICY "Allow admins full access to %1$I"
        ON public.%1$I FOR ALL
        USING (check_user_role(auth.uid(), ''Admin''))
        WITH CHECK (check_user_role(auth.uid(), ''Admin''));', table_name);
    EXECUTE format('
        CREATE POLICY "Allow authenticated users to read %1$I"
        ON public.%1$I FOR SELECT
        USING (auth.role() = ''authenticated'');', table_name);
END;
$$;

CALL public.secure_master_data_table('companies');
CALL public.secure_master_data_table('cost_types');
CALL public.secure_master_data_table('currencies');
CALL public.secure_master_data_table('customers');
CALL public.secure_master_data_table('divisions');
CALL public.secure_master_data_table('exchange_rates');
CALL public.secure_master_data_table('project_types');
CALL public.secure_master_data_table('projects');
CALL public.secure_master_data_table('resources');
