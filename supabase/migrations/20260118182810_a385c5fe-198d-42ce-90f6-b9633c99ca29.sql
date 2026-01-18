-- Add display_name column to doctor_profiles for public display
-- This allows dummy doctors without auth.users entries
ALTER TABLE public.doctor_profiles 
ADD COLUMN IF NOT EXISTS display_name text;

-- Update existing doctor profiles to use display_name from profiles if available
UPDATE public.doctor_profiles dp
SET display_name = p.full_name
FROM public.profiles p
WHERE dp.user_id = p.id AND dp.display_name IS NULL;