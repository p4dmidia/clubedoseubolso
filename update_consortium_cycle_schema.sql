-- 1. Updates for consortium_groups to track cycles and multitenancy
ALTER TABLE public.consortium_groups 
ADD COLUMN IF NOT EXISTS current_month integer DEFAULT 0;

ALTER TABLE public.consortium_groups 
ADD COLUMN IF NOT EXISTS next_draw_date timestamp with time zone;

ALTER TABLE public.consortium_groups 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

-- 2. Updates for consortium_draws to track metadata and months
ALTER TABLE public.consortium_draws 
ADD COLUMN IF NOT EXISTS month_number integer;

ALTER TABLE public.consortium_draws 
ADD COLUMN IF NOT EXISTS video_url text;

ALTER TABLE public.consortium_draws 
ADD COLUMN IF NOT EXISTS official_result_url text;

-- 3. Update existing groups to have a starting next_draw_date if they are open
-- Defaulting to the 11th of the current or next month
UPDATE public.consortium_groups
SET next_draw_date = 
    CASE 
        WHEN EXTRACT(DAY FROM now()) < 11 
        THEN (DATE_TRUNC('month', now()) + interval '10 days') -- This month's 11th
        ELSE (DATE_TRUNC('month', now()) + interval '1 month' + interval '10 days') -- Next month's 11th
    END
WHERE status != 'finished' AND next_draw_date IS NULL;

-- 4. Comment on table for documentation
COMMENT ON COLUMN public.consortium_groups.current_month IS 'Current month of the consortium cycle (0 to max_participants)';
COMMENT ON COLUMN public.consortium_groups.next_draw_date IS 'Scheduled date for the next draw (Default Day 11)';
COMMENT ON COLUMN public.consortium_draws.month_number IS 'The cycle month this draw represents';
