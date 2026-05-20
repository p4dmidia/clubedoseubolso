-- ADMIN RLS SETUP
-- This script enables RLS on key tables and adds policies for admin access.

-- 1. UTILITY FUNCTION: Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT role = 'admin'
    FROM public.user_profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. AFFILIATES Table Policies
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

-- Allow admins to see/do everything
DROP POLICY IF EXISTS "Admins can manage all affiliates" ON public.affiliates;
CREATE POLICY "Admins can manage all affiliates" 
ON public.affiliates 
FOR ALL 
TO authenticated 
USING (public.is_admin());

-- 3. USER_SETTINGS Table Policies
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Existing policy for users to see their own settings
DROP POLICY IF EXISTS "Users can view own settings" ON public.user_settings;
CREATE POLICY "Users can view own settings" 
ON public.user_settings 
FOR SELECT 
USING (auth.uid() = user_id);

-- Admin policy for user_settings
DROP POLICY IF EXISTS "Admins can view all settings" ON public.user_settings;
CREATE POLICY "Admins can view all settings" 
ON public.user_settings 
FOR SELECT 
TO authenticated 
USING (public.is_admin());

-- 4. USER_PROFILES Table Policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" 
ON public.user_profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Admin policy for user_profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
CREATE POLICY "Admins can view all profiles" 
ON public.user_profiles 
FOR SELECT 
TO authenticated 
USING (public.is_admin());

-- 5. WITHDRAWALS Table Policies
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own withdrawals
DROP POLICY IF EXISTS "Users can view own withdrawals" ON public.withdrawals;
CREATE POLICY "Users can view own withdrawals" 
ON public.withdrawals 
FOR SELECT 
USING (auth.uid() = user_id);

-- Admin policy for withdrawals
DROP POLICY IF EXISTS "Admins can manage all withdrawals" ON public.withdrawals;
CREATE POLICY "Admins can manage all withdrawals" 
ON public.withdrawals 
FOR ALL 
TO authenticated 
USING (public.is_admin());
