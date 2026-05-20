-- MIGRATION: ADD ADDRESS FIELDS TO AFFILIATES AND PROFILES
-- PURPOSE: Allow users to save their address for auto-fill during checkout.

-- 1. Add columns to public.user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS cep TEXT,
ADD COLUMN IF NOT EXISTS address TEXT;

-- 2. Add columns to public.affiliates (for direct access and sync)
ALTER TABLE public.affiliates 
ADD COLUMN IF NOT EXISTS cep TEXT,
ADD COLUMN IF NOT EXISTS address TEXT;

-- 3. Update RLS policies (if not already covered by existing policies)
-- The existing policies for 'affiliates' should already cover UPDATE based on auth.uid() = user_id.

-- 4. Create or Update sync function if necessary
-- Note: If there's a trigger syncing profiles and affiliates, make sure it handles these new columns.
-- Looking at handle_new_affiliate_user(), it only runs on INSERT. 
-- We should probably add a trigger to sync updates between user_profiles and affiliates.

CREATE OR REPLACE FUNCTION public.sync_profile_to_affiliate()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.affiliates
    SET 
        full_name = COALESCE(NEW.full_name, full_name),
        cpf = COALESCE(NEW.cpf, cpf),
        whatsapp = COALESCE(NEW.whatsapp, whatsapp),
        address = COALESCE(NEW.address, address),
        cep = COALESCE(NEW.cep, cep),
        updated_at = NOW()
    WHERE user_id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_update ON public.user_profiles;
CREATE TRIGGER on_profile_update
    AFTER UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.sync_profile_to_affiliate();
