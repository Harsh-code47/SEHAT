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
  // Use edge function for secure server-side booking with validation
  const { data: sessionData } = await supabase.auth.getSession();
  
  if (!sessionData?.session?.access_token) {
    throw new Error("Please log in to book an appointment");
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/book-appointment`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionData.session.access_token}`,
      },
      body: JSON.stringify({
        doctor_id: doctorId,
        appointment_date: date,
        appointment_time: time,
      }),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to book appointment');
  }

  // Return data in the format expected by the UI
  return {
    id: result.appointment.id,
    patient_id: patientId,
    doctor_id: doctorId,
    appointment_date: result.appointment.appointment_date,
    appointment_time: result.appointment.appointment_time,
    google_meet_link: result.appointment.meeting_link,
    status: result.appointment.status,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    google_calendar_event_id: null,
  };
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
