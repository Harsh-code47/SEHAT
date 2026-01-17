import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  google_meet_link: string | null;
  google_calendar_event_id: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  doctor?: {
    specialty: string;
    consultation_fee: number;
    full_name?: string;
  };
}

export const useAppointments = (userId: string | undefined, role: "patient" | "doctor") => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      let query;
      
      if (role === "patient") {
        query = supabase
          .from("appointments")
          .select(`
            *,
            doctor:doctor_profiles (
              specialty,
              consultation_fee,
              user_id
            )
          `)
          .eq("patient_id", userId)
          .order("appointment_date", { ascending: false });
      } else {
        // For doctors, first get their doctor_profile id
        const { data: doctorProfile } = await supabase
          .from("doctor_profiles")
          .select("id")
          .eq("user_id", userId)
          .single();

        if (!doctorProfile) {
          setAppointments([]);
          setLoading(false);
          return;
        }

        query = supabase
          .from("appointments")
          .select("*")
          .eq("doctor_id", doctorProfile.id)
          .order("appointment_date", { ascending: false });
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setAppointments(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [userId, role]);

  return { appointments, loading, error, refetch: fetchAppointments };
};

export const createAppointment = async (
  patientId: string,
  doctorId: string,
  date: string,
  time: string
) => {
  // Generate a Google Meet link
  const meetCode = `sehat-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
  const googleMeetLink = `https://meet.google.com/${meetCode}`;

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      patient_id: patientId,
      doctor_id: doctorId,
      appointment_date: date,
      appointment_time: time,
      google_meet_link: googleMeetLink,
      status: "scheduled",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateAppointmentStatus = async (
  appointmentId: string,
  status: "scheduled" | "completed" | "cancelled"
) => {
  const { error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", appointmentId);

  if (error) throw error;
};
