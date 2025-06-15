
-- 1. Tạo bảng profiles lưu thông tin user công khai
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  avatar_url text,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- 2. Trigger function: khi có user mới tạo (auth.users), tự động insert vào profiles (lấy email, full_name nếu có)
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    coalesce(NEW.raw_user_meta_data->>'full_name', ''),
    coalesce(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_profiles ON auth.users;

CREATE TRIGGER on_auth_user_created_profiles
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_profile();

-- 3. Trigger function: khi user update email hoặc profile trên auth.users, update lại profiles table
CREATE OR REPLACE FUNCTION public.sync_profile_on_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles SET
    email = NEW.email,
    full_name = coalesce(NEW.raw_user_meta_data->>'full_name', ''),
    avatar_url = coalesce(NEW.raw_user_meta_data->>'avatar_url', ''),
    updated_at = now()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_updated_profiles ON auth.users;

CREATE TRIGGER on_auth_user_updated_profiles
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_on_update();

-- 4. RLS cho bảng profiles: người dùng xem được thông tin mình, admin xem tất cả
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Cho phép người dùng xem và sửa thông tin chính mình
CREATE POLICY "User can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "User can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Cho phép admin xem tất cả profiles
CREATE POLICY "Admin can view all profiles"
  ON public.profiles FOR SELECT
  USING (check_user_role(auth.uid(), 'Admin'));
