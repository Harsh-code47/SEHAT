import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, Users, Calendar, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface PatientInfo {
  patient_id: string;
  full_name: string;
  email: string;
  appointment_count: number;
  last_appointment: string;
}

const DoctorPatients = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<PatientInfo[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || session.user.user_metadata?.role !== "doctor") {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      setLoading(false);
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchPatients = async () => {
      // Get doctor profile id
      const { data: doctorProfile } = await supabase
        .from("doctor_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!doctorProfile) return;

      // Get all appointments for this doctor
      const { data: appointments } = await supabase
        .from("appointments")
        .select("patient_id, appointment_date")
        .eq("doctor_id", doctorProfile.id)
        .order("appointment_date", { ascending: false });

      if (!appointments || appointments.length === 0) return;

      // Group by patient
      const patientMap = new Map<string, { count: number; lastDate: string }>();
      appointments.forEach((a) => {
        const existing = patientMap.get(a.patient_id);
        if (existing) {
          existing.count++;
        } else {
          patientMap.set(a.patient_id, { count: 1, lastDate: a.appointment_date });
        }
      });

      // Get patient profiles
      const patientIds = Array.from(patientMap.keys());
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", patientIds);

      const patientList: PatientInfo[] = (profiles || []).map((p) => ({
        patient_id: p.id,
        full_name: p.full_name || "Unknown",
        email: p.email || "",
        appointment_count: patientMap.get(p.id)?.count || 0,
        last_appointment: patientMap.get(p.id)?.lastDate || "",
      }));

      setPatients(patientList);
    };

    fetchPatients();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Activity className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">My Patients</h1>
        <p className="text-muted-foreground mb-8">Patients who have booked consultations with you</p>

        {patients.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {patients.map((patient) => (
              <Card key={patient.patient_id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-lg truncate">{patient.full_name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Mail className="h-3 w-3" /> {patient.email}
                      </p>
                      <div className="flex items-center gap-3 mt-3">
                        <Badge variant="secondary" className="text-xs">
                          <Calendar className="h-3 w-3 mr-1" />
                          {patient.appointment_count} visit{patient.appointment_count !== 1 ? "s" : ""}
                        </Badge>
                        {patient.last_appointment && (
                          <span className="text-xs text-muted-foreground">
                            Last: {format(new Date(patient.last_appointment), "PP")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No patients yet</p>
              <p className="text-sm mt-1">Patients will appear here once they book appointments with you</p>
            </CardContent>
          </Card>
        )}
      </main>
      <footer className="py-8 border-t mt-auto">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>All Rights Reserved - SEHAT</p>
        </div>
      </footer>
    </div>
  );
};

export default DoctorPatients;
