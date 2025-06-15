
-- Thêm 2 bản ghi vào profiles từ user_roles nếu chưa tồn tại
INSERT INTO public.profiles (id, email, full_name, avatar_url)
SELECT ur.user_id, au.email, '', ''
FROM user_roles ur
JOIN auth.users au ON ur.user_id = au.id
LEFT JOIN profiles p ON ur.user_id = p.id
WHERE p.id IS NULL
LIMIT 2;

-- Cập nhật email của profile theo dữ liệu mới nhất từ auth.users
UPDATE public.profiles p
SET email = au.email
FROM auth.users au
WHERE p.id = au.id;
