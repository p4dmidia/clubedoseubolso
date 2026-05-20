-- MIGRATION: ADD DETAILED ADDRESS FIELDS
-- PURPOSE: Split single address field into structured data for logistics.

-- 1. Add columns to public.user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS street TEXT,
ADD COLUMN IF NOT EXISTS "number" TEXT,
ADD COLUMN IF NOT EXISTS complement TEXT,
ADD COLUMN IF NOT EXISTS neighborhood TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS "state" TEXT;

-- 2. Add columns to public.affiliates
ALTER TABLE public.affiliates 
ADD COLUMN IF NOT EXISTS street TEXT,
ADD COLUMN IF NOT EXISTS "number" TEXT,
ADD COLUMN IF NOT EXISTS complement TEXT,
ADD COLUMN IF NOT EXISTS neighborhood TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS "state" TEXT;

-- 3. Update sync function to handle new fields
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
        street = COALESCE(NEW.street, street),
        "number" = COALESCE(NEW.number, "number"),
        complement = COALESCE(NEW.complement, complement),
        neighborhood = COALESCE(NEW.neighborhood, neighborhood),
        city = COALESCE(NEW.city, city),
        "state" = COALESCE(NEW.state, "state"),
        updated_at = NOW()
    WHERE user_id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
