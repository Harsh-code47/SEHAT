-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create BMI records table
CREATE TABLE public.bmi_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  height DECIMAL NOT NULL,
  weight DECIMAL NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL,
  bmi DECIMAL NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for bmi_records
ALTER TABLE public.bmi_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for BMI records
CREATE POLICY "Users can view own BMI records"
  ON public.bmi_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own BMI records"
  ON public.bmi_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own BMI records"
  ON public.bmi_records FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own BMI records"
  ON public.bmi_records FOR DELETE
  USING (auth.uid() = user_id);

-- Create report analysis table
CREATE TABLE public.report_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  report_type TEXT NOT NULL,
  file_path TEXT,
  analysis_result JSONB NOT NULL,
  abnormal_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for report_analyses
ALTER TABLE public.report_analyses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for report analyses
CREATE POLICY "Users can view own report analyses"
  ON public.report_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own report analyses"
  ON public.report_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own report analyses"
  ON public.report_analyses FOR DELETE
  USING (auth.uid() = user_id);

-- Create storage bucket for report uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('medical-reports', 'medical-reports', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Users can upload own reports"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'medical-reports' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own reports"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'medical-reports' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own reports"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'medical-reports' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add updated_at trigger to profiles
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();