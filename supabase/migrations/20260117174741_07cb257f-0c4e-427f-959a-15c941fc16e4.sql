-- Create doctor_profiles table to store doctor-specific information
CREATE TABLE public.doctor_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  specialty TEXT NOT NULL DEFAULT 'General Physician',
  experience_years INTEGER NOT NULL DEFAULT 0,
  consultation_fee NUMERIC NOT NULL DEFAULT 500,
  bio TEXT,
  avatar_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  rating NUMERIC DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on doctor_profiles
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;

-- Doctors can view all doctor profiles (for consultancy listing)
CREATE POLICY "Anyone can view doctor profiles"
ON public.doctor_profiles
FOR SELECT
USING (true);

-- Only doctors can insert their own profile
CREATE POLICY "Doctors can create own profile"
ON public.doctor_profiles
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND 
  public.has_role(auth.uid(), 'doctor')
);

-- Only doctors can update their own profile
CREATE POLICY "Doctors can update own profile"
ON public.doctor_profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- Create appointments table to track consultancy bookings
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  doctor_id UUID NOT NULL REFERENCES public.doctor_profiles(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TEXT NOT NULL,
  google_meet_link TEXT,
  google_calendar_event_id TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Patients can view their own appointments
CREATE POLICY "Patients can view own appointments"
ON public.appointments
FOR SELECT
USING (auth.uid() = patient_id);

-- Doctors can view appointments with them
CREATE POLICY "Doctors can view their appointments"
ON public.appointments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.doctor_profiles 
    WHERE doctor_profiles.id = appointments.doctor_id 
    AND doctor_profiles.user_id = auth.uid()
  )
);

-- Patients can create appointments
CREATE POLICY "Patients can create appointments"
ON public.appointments
FOR INSERT
WITH CHECK (auth.uid() = patient_id);

-- Patients can update their own appointments
CREATE POLICY "Patients can update own appointments"
ON public.appointments
FOR UPDATE
USING (auth.uid() = patient_id);

-- Doctors can update appointments with them
CREATE POLICY "Doctors can update their appointments"
ON public.appointments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.doctor_profiles 
    WHERE doctor_profiles.id = appointments.doctor_id 
    AND doctor_profiles.user_id = auth.uid()
  )
);

-- Create trigger for updated_at on doctor_profiles
CREATE TRIGGER update_doctor_profiles_updated_at
BEFORE UPDATE ON public.doctor_profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create trigger for updated_at on appointments
CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();