
-- Đánh dấu đã xác thực email cho tất cả user trừ nguyenhq@skg.com.vn trong bảng auth.users
update auth.users
set email_confirmed_at = now()
where email is not null
  and email <> 'nguyenhq@skg.com.vn';
