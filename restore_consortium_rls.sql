-- RESTAURAÇÃO DE POLÍTICAS DE RLS - CONSÓRCIO
-- Este script restaura as políticas que foram removidas pelo script de segurança multitenant.

-- 1. consortium_groups (Transparência pública/por organização)
DROP POLICY IF EXISTS "Anyone can view groups" ON public.consortium_groups;
CREATE POLICY "Anyone can view groups" ON public.consortium_groups 
FOR SELECT USING (true);

-- 2. consortium_participants (Acesso privado ao participante)
DROP POLICY IF EXISTS "Members can view their own participation" ON public.consortium_participants;
CREATE POLICY "Members can view their own participation" ON public.consortium_participants 
FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

-- 3. consortium_draws (Histórico público para transparência)
DROP POLICY IF EXISTS "Public can view draw history" ON public.consortium_draws;
CREATE POLICY "Public can view draw history" ON public.consortium_draws 
FOR SELECT USING (true);

-- 4. Acesso total para Admins (Garantia de gestão)
DROP POLICY IF EXISTS "Admin full access for groups" ON public.consortium_groups;
CREATE POLICY "Admin full access for groups" ON public.consortium_groups 
FOR ALL USING (
  (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR 
  (auth.jwt() ->> 'email' IN ('admin@classeafaria.com.br', 'fiel016@gmail.com'))
);

DROP POLICY IF EXISTS "Admin full access for participants" ON public.consortium_participants;
CREATE POLICY "Admin full access for participants" ON public.consortium_participants 
FOR ALL USING (
  (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR 
  (auth.jwt() ->> 'email' IN ('admin@classeafaria.com.br', 'fiel016@gmail.com'))
);

DROP POLICY IF EXISTS "Admin full access for draws" ON public.consortium_draws;
CREATE POLICY "Admin full access for draws" ON public.consortium_draws 
FOR ALL USING (
  (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') OR 
  (auth.jwt() ->> 'email' IN ('admin@classeafaria.com.br', 'fiel016@gmail.com'))
);
