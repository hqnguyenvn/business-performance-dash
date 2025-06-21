
CREATE TABLE public.roles (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    code character varying NOT NULL,
    description text,
    created_at timestamp with time zone NULL DEFAULT now(),
    updated_at timestamp with time zone NULL DEFAULT now(),
    CONSTRAINT roles_pkey PRIMARY KEY (id),
    CONSTRAINT roles_code_unique UNIQUE (code)
);

-- Trigger to automatically update 'updated_at' column on row update
CREATE TRIGGER handle_roles_updated_at
BEFORE UPDATE ON public.roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default roles
INSERT INTO public.roles (code, description) VALUES
('ADMIN', 'Administrator with full access'),
('USER', 'Regular user with limited access'),
('MANAGER', 'Manager with moderate access');
