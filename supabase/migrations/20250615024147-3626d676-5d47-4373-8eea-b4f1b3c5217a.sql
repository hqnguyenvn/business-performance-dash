
INSERT INTO public.user_roles (user_id, role, is_active)
VALUES ('9bcc13f9-48bb-41b1-b4f9-7c843850cbdb', 'Admin', true)
ON CONFLICT (user_id) DO NOTHING;
