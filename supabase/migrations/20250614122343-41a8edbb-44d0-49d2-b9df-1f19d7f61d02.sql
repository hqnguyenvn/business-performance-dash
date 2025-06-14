
CREATE TABLE public.cost_types (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    code character varying NOT NULL,
    name character varying NOT NULL,
    description text NULL,
    created_at timestamp with time zone NULL DEFAULT now(),
    updated_at timestamp with time zone NULL DEFAULT now(),
    CONSTRAINT cost_types_pkey PRIMARY KEY (id)
);

-- Trigger to automatically update 'updated_at' column on row update
CREATE TRIGGER handle_cost_types_updated_at
BEFORE UPDATE ON public.cost_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
