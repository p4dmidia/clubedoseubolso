-- CONSORTIUM SYSTEM SETUP

-- 1. Consortium Groups Table
CREATE TABLE public.consortium_groups (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('livre_escolha', 'colchao')),
    max_participants integer NOT NULL,
    current_participants integer DEFAULT 0,
    status text DEFAULT 'open' CHECK (status IN ('open', 'full', 'finished')),
    created_at timestamp with time zone DEFAULT now()
);

-- 2. Consortium Participants Table
CREATE TABLE public.consortium_participants (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id uuid REFERENCES public.consortium_groups(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    lucky_number integer NOT NULL,
    status text DEFAULT 'active' CHECK (status IN ('active', 'contemplated')),
    joined_at timestamp with time zone DEFAULT now(),
    UNIQUE(group_id, user_id),
    UNIQUE(group_id, lucky_number)
);

-- 3. Consortium Draws Table
CREATE TABLE public.consortium_draws (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id uuid REFERENCES public.consortium_groups(id) ON DELETE CASCADE,
    winner_id uuid REFERENCES public.consortium_participants(id),
    draw_date timestamp with time zone DEFAULT now(),
    lottery_number text NOT NULL, -- The Federal Lottery number used as seed
    details text,
    created_at timestamp with time zone DEFAULT now()
);

-- 4. RLS Policies
ALTER TABLE public.consortium_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consortium_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consortium_draws ENABLE ROW LEVEL SECURITY;

-- Public/Authenticated Read Access
CREATE POLICY "Anyone can view groups" ON public.consortium_groups FOR SELECT USING (true);
CREATE POLICY "Members can view their own participation" ON public.consortium_participants FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Public can view draw history" ON public.consortium_draws FOR SELECT USING (true);

-- Admin Full Access
CREATE POLICY "Admin full access for groups" ON public.consortium_groups FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access for participants" ON public.consortium_participants FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access for draws" ON public.consortium_draws FOR ALL USING (public.is_admin());

-- 5. Helper function to check if a user is in a consortium (for menu visibility)
CREATE OR REPLACE FUNCTION public.is_consortium_member(user_uuid uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.consortium_participants WHERE user_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
