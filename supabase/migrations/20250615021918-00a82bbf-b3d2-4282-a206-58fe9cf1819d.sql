
-- Thêm trường active/inactive vào user_roles
ALTER TABLE public.user_roles ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- Policy: chỉ Admin được UPDATE/DELETE/INSERT user_roles
DROP POLICY IF EXISTS "Allow admins to manage all user roles" ON public.user_roles;
CREATE POLICY "Allow admins to manage all user roles"
    ON public.user_roles FOR ALL
    USING (check_user_role(auth.uid(), 'Admin'))
    WITH CHECK (check_user_role(auth.uid(), 'Admin'));

-- Policy: User xem được vai trò và trạng thái của mình
DROP POLICY IF EXISTS "Allow users to view their own role" ON public.user_roles;
CREATE POLICY "Allow users to view their own role"
    ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id);

-- Admin cập nhật được active/inactive, role qua UI quản trị (CRUD user)
