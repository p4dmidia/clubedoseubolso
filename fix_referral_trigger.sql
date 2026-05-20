-- SQL TO FIX REFERRAL TRACKING
-- Copy and paste this into the Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.handle_new_affiliate_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_full_name text;
  v_sponsor_code text;
  v_sponsor_id uuid;
BEGIN
  -- Build full name safely
  v_full_name := TRIM(CONCAT_WS(' ', 
    new.raw_user_meta_data ->> 'nome', 
    new.raw_user_meta_data ->> 'sobrenome'
  ));
  
  IF v_full_name = '' THEN
    v_full_name := 'Novo Afiliado';
  END IF;

  -- Get sponsor_code from metadata
  v_sponsor_code := new.raw_user_meta_data ->> 'sponsor_code';
  
  -- Look up sponsor_id if code exists
  IF v_sponsor_code IS NOT NULL AND v_sponsor_code <> '' THEN
    SELECT id INTO v_sponsor_id FROM public.affiliates WHERE referral_code = v_sponsor_code LIMIT 1;
  END IF;

  -- 1. Create Profile
  INSERT INTO public.user_profiles (id, email, created_at, updated_at)
  VALUES (new.id, new.email, new.created_at, new.created_at);

  -- 2. Create Affiliate
  INSERT INTO public.affiliates (user_id, email, full_name, referral_code, sponsor_id, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    v_full_name,
    new.raw_user_meta_data ->> 'login',
    v_sponsor_id,
    new.created_at,
    new.updated_at
  );

  -- 3. Create Settings
  INSERT INTO public.user_settings (user_id, created_at, updated_at)
  VALUES (
    new.id,
    new.created_at,
    new.created_at
  );
  
  RETURN new;
END;
$function$;
