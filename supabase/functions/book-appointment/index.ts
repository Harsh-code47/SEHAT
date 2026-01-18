import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BookingRequest {
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Please log in to book an appointment' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Validate user authentication
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const patientId = user.id;
    console.log('Authenticated patient:', patientId);

    // Parse and validate request body
    const body: BookingRequest = await req.json();
    const { doctor_id, appointment_date, appointment_time } = body;

    // Input validation
    if (!doctor_id || typeof doctor_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid doctor ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!appointment_date || !/^\d{4}-\d{2}-\d{2}$/.test(appointment_date)) {
      return new Response(
        JSON.stringify({ error: 'Invalid date format. Use YYYY-MM-DD' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validTimeSlots = [
      "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
      "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM"
    ];
    if (!appointment_time || !validTimeSlots.includes(appointment_time)) {
      return new Response(
        JSON.stringify({ error: 'Invalid time slot' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate date is in the future and within 30 days
    const appointmentDateObj = new Date(appointment_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 30);

    if (appointmentDateObj < today) {
      return new Response(
        JSON.stringify({ error: 'Cannot book appointments in the past' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (appointmentDateObj > maxDate) {
      return new Response(
        JSON.stringify({ error: 'Cannot book appointments more than 30 days in advance' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify doctor exists and is available
    const { data: doctor, error: doctorError } = await supabaseClient
      .from('doctor_profiles')
      .select('id, is_available, user_id')
      .eq('id', doctor_id)
      .single();

    if (doctorError || !doctor) {
      return new Response(
        JSON.stringify({ error: 'Doctor not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!doctor.is_available) {
      return new Response(
        JSON.stringify({ error: 'This doctor is currently not available for consultations' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting: Check if patient has booked too many appointments today
    const todayStr = new Date().toISOString().split('T')[0];
    const { count: todayBookings, error: countError } = await supabaseClient
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', patientId)
      .gte('created_at', todayStr);

    if (!countError && todayBookings !== null && todayBookings >= 5) {
      return new Response(
        JSON.stringify({ error: 'You have reached the maximum number of appointment bookings for today (5). Please try again tomorrow.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for duplicate booking (same doctor, date, time)
    const { data: existingAppointments, error: duplicateError } = await supabaseClient
      .from('appointments')
      .select('id')
      .eq('doctor_id', doctor_id)
      .eq('appointment_date', appointment_date)
      .eq('appointment_time', appointment_time)
      .neq('status', 'cancelled');

    if (!duplicateError && existingAppointments && existingAppointments.length > 0) {
      return new Response(
        JSON.stringify({ error: 'This time slot is already booked. Please select a different time.' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if patient already has an appointment at this time
    const { data: patientConflict, error: patientConflictError } = await supabaseClient
      .from('appointments')
      .select('id')
      .eq('patient_id', patientId)
      .eq('appointment_date', appointment_date)
      .eq('appointment_time', appointment_time)
      .neq('status', 'cancelled');

    if (!patientConflictError && patientConflict && patientConflict.length > 0) {
      return new Response(
        JSON.stringify({ error: 'You already have an appointment at this time. Please select a different time slot.' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate a placeholder meeting link (real Google Meet integration would require OAuth)
    // This creates a unique room ID that can be used with Jitsi Meet as a free alternative
    const roomId = `sehat-${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`;
    const meetingLink = `https://meet.jit.si/${roomId}`;

    // Create the appointment
    const { data: appointment, error: insertError } = await supabaseClient
      .from('appointments')
      .insert({
        patient_id: patientId,
        doctor_id: doctor_id,
        appointment_date: appointment_date,
        appointment_time: appointment_time,
        google_meet_link: meetingLink,
        status: 'scheduled',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create appointment:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create appointment. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Appointment created successfully:', appointment.id);

    return new Response(
      JSON.stringify({
        success: true,
        appointment: {
          id: appointment.id,
          appointment_date: appointment.appointment_date,
          appointment_time: appointment.appointment_time,
          meeting_link: meetingLink,
          status: appointment.status,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error booking appointment:', error);
    return new Response(
      JSON.stringify({ error: 'Unable to process your booking request. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
