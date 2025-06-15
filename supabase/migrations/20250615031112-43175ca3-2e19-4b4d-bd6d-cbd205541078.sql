
-- Bật RLS cho bảng profiles (nếu chưa bật)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Cho phép Admin thực hiện mọi thao tác trên profiles
DROP POLICY IF EXISTS "Admin full access to profiles" ON public.profiles;
CREATE POLICY "Admin full access to profiles"
    ON public.profiles FOR ALL
    USING (check_user_role(auth.uid(), 'Admin'))
    WITH CHECK (check_user_role(auth.uid(), 'Admin'));

-- User chỉ có thể xem profile của chính mình
DROP POLICY IF EXISTS "User can read own profile" ON public.profiles;
CREATE POLICY "User can read own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- User chỉ có thể cập nhật profile của chính mình
DROP POLICY IF EXISTS "User can update own profile" ON public.profiles;
CREATE POLICY "User can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
