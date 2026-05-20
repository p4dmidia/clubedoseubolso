-- FIX WITHDRAWALS AND AFFILIATES RELATIONSHIP

-- 1. Ensure affiliates.user_id is unique so it can be referenced
-- First check if there's already a constraint or if we need to add one
ALTER TABLE public.affiliates ADD CONSTRAINT affiliates_user_id_unique UNIQUE (user_id);

-- 2. Update withdrawals to reference affiliates(user_id) explicitly
-- This allows PostgREST to understand the relationship
ALTER TABLE public.withdrawals 
DROP CONSTRAINT IF EXISTS withdrawals_user_id_fkey,
ADD CONSTRAINT withdrawals_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.affiliates(user_id);

-- 3. Also allow joining via user_profiles if needed by adding a similar FK
-- (Optional but helpful for PostgREST)
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_id_unique UNIQUE (id); -- id is already PK, so it's unique
-- withdrawals already references user_profiles(id) implicitly via auth.users(id), but PostgREST often needs explicit public schema FKs.
