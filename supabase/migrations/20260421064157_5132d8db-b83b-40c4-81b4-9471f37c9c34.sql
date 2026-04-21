-- 1. Extend profiles with health fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS blood_group text,
  ADD COLUMN IF NOT EXISTS height_cm numeric,
  ADD COLUMN IF NOT EXISTS weight_kg numeric,
  ADD COLUMN IF NOT EXISTS allergies text,
  ADD COLUMN IF NOT EXISTS chronic_conditions text,
  ADD COLUMN IF NOT EXISTS emergency_contact_name text,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone text;

-- 2. Medication reminders table
CREATE TABLE IF NOT EXISTS public.medication_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  medication_name text NOT NULL,
  dosage text,
  frequency text NOT NULL DEFAULT 'daily',
  times_of_day text[] NOT NULL DEFAULT ARRAY['09:00']::text[],
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.medication_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own reminders"
  ON public.medication_reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own reminders"
  ON public.medication_reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own reminders"
  ON public.medication_reminders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own reminders"
  ON public.medication_reminders FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_medication_reminders_updated_at
  BEFORE UPDATE ON public.medication_reminders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3. Reminder logs (which dose taken on which day)
CREATE TABLE IF NOT EXISTS public.reminder_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reminder_id uuid NOT NULL REFERENCES public.medication_reminders(id) ON DELETE CASCADE,
  taken_date date NOT NULL DEFAULT CURRENT_DATE,
  time_slot text NOT NULL,
  taken_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reminder_id, taken_date, time_slot)
);

ALTER TABLE public.reminder_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own reminder logs"
  ON public.reminder_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own reminder logs"
  ON public.reminder_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own reminder logs"
  ON public.reminder_logs FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_reminder_logs_user_date ON public.reminder_logs(user_id, taken_date);
CREATE INDEX IF NOT EXISTS idx_medication_reminders_user_active ON public.medication_reminders(user_id, is_active);