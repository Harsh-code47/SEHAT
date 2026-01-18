import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DoctorProfile {
  id: string;
  user_id: string;
  specialty: string;
  experience_years: number;
  consultation_fee: number;
  bio: string | null;
  avatar_url: string | null;
  is_available: boolean;
  rating: number | null;
  total_reviews: number | null;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export const useDoctorProfile = (userId: string | undefined) => {
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from("doctor_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      setProfile(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  return { profile, loading, error, refetch: fetchProfile };
};

export const useAllDoctors = () => {
  const [doctors, setDoctors] = useState<(DoctorProfile & { full_name?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDoctors = async () => {
    try {
      // Fetch doctor profiles with display_name
      const { data: doctorProfiles, error: profileError } = await supabase
        .from("doctor_profiles")
        .select("*")
        .eq("is_available", true);

      if (profileError) throw profileError;

      if (doctorProfiles && doctorProfiles.length > 0) {
        // Use display_name from doctor_profiles directly
        const mergedDoctors = doctorProfiles.map((doctor) => ({
          ...doctor,
          full_name: doctor.display_name || "Doctor",
        }));

        setDoctors(mergedDoctors);
      } else {
        setDoctors([]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  return { doctors, loading, error, refetch: fetchDoctors };
};
