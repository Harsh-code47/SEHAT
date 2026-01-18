-- Allow anyone to view profiles of users who are doctors with available status
-- This enables the doctor listing page to show doctor names publicly
CREATE POLICY "Anyone can view available doctor profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.doctor_profiles
      WHERE doctor_profiles.user_id = profiles.id
      AND doctor_profiles.is_available = true
    )
  );