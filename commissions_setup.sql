-- COMMISSION CONFIGURATION SETUP

-- 1. Create Commission Configs Table
CREATE TABLE IF NOT EXISTS public.commission_configs (
    key text PRIMARY KEY, -- 'geral', 'mattress'
    type text NOT NULL DEFAULT 'percent', -- 'percent', 'money'
    active_generations integer NOT NULL DEFAULT 7,
    levels jsonb NOT NULL, -- [{ "level": 1, "value": 10 }, ...]
    updated_at timestamp with time zone DEFAULT now()
);

-- 2. RLS Policies
ALTER TABLE public.commission_configs ENABLE ROW LEVEL SECURITY;

-- Allow public (or at least authenticated) read
CREATE POLICY "Everyone can view commission configs" ON public.commission_configs FOR SELECT USING (true);

-- Allow admins full access
CREATE POLICY "Admins can manage commission configs" 
ON public.commission_configs 
FOR ALL 
TO authenticated 
USING (public.is_admin());

-- 3. Initial Seed Data (from AdminCommissions.tsx mock data)
INSERT INTO public.commission_configs (key, type, active_generations, levels)
VALUES 
(
    'geral', 
    'percent', 
    7, 
    '[
        {"level": 1, "value": 10},
        {"level": 2, "value": 4},
        {"level": 3, "value": 2},
        {"level": 4, "value": 2},
        {"level": 5, "value": 2},
        {"level": 6, "value": 2},
        {"level": 7, "value": 1}
    ]'::jsonb
),
(
    'mattress', 
    'percent', 
    6, 
    '[
        {"level": 1, "value": 20},
        {"level": 2, "value": 4},
        {"level": 3, "value": 4},
        {"level": 4, "value": 4},
        {"level": 5, "value": 4},
        {"level": 6, "value": 4}
    ]'::jsonb
)
ON CONFLICT (key) DO NOTHING;
