-- 1. Garante que a tabela existe com a estrutura correta
CREATE TABLE IF NOT EXISTS public.commission_configs (
    key text PRIMARY KEY,
    type text NOT NULL DEFAULT 'percent',
    active_generations integer NOT NULL DEFAULT 1,
    levels jsonb NOT NULL DEFAULT '[]'::jsonb,
    updated_at timestamp with time zone DEFAULT now()
);

-- 2. Ativa RLS (caso não esteja)
ALTER TABLE public.commission_configs ENABLE ROW LEVEL SECURITY;

-- 3. Limpa políticas antigas para evitar conflito
DROP POLICY IF EXISTS "Allow select for all authenticated" ON public.commission_configs;
DROP POLICY IF EXISTS "Allow all for admins" ON public.commission_configs;

-- 4. Cria novas políticas
-- Permite que qualquer usuário logado veja as configurações
CREATE POLICY "Allow select for all authenticated" 
ON public.commission_configs FOR SELECT 
TO authenticated 
USING (true);

-- Permite que apenas administradores alterem as configurações
CREATE POLICY "Allow all for admins" 
ON public.commission_configs FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 5. Insere dados iniciais caso a tabela esteja vazia
INSERT INTO public.commission_configs (key, type, active_generations, levels)
VALUES 
('geral', 'percent', 7, '[{"level": 1, "value": 0}, {"level": 2, "value": 0}, {"level": 3, "value": 0}, {"level": 4, "value": 0}, {"level": 5, "value": 0}, {"level": 6, "value": 0}, {"level": 7, "value": 0}]'::jsonb),
('mattress', 'percent', 6, '[{"level": 1, "value": 0}, {"level": 2, "value": 0}, {"level": 3, "value": 0}, {"level": 4, "value": 0}, {"level": 5, "value": 0}, {"level": 6, "value": 0}]'::jsonb),
('sales', 'percent', 1, '[{"level": 0, "value": 20}, {"level": 1, "value": 3}]'::jsonb)
ON CONFLICT (key) DO NOTHING;
