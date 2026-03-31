import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppointments } from "@/hooks/useAppointments";
import { Activity, Calendar, Video, Clock, CheckCircle, XCircle, Users } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const DoctorAppointments = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

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

  const { appointments, loading: appointmentsLoading } = useAppointments(user?.id, "doctor");

  const todayStr = new Date().toISOString().split("T")[0];
  const todayAppointments = appointments.filter(a => a.appointment_date === todayStr);
  const upcomingAppointments = appointments.filter(a => a.appointment_date > todayStr && a.status === "scheduled");
  const pastAppointments = appointments.filter(a => a.appointment_date < todayStr || a.status === "completed");

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to update appointment", variant: "destructive" });
    } else {
      toast({ title: "Updated", description: `Appointment marked as ${status}` });
      window.location.reload();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Activity className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const AppointmentCard = ({ appointment, showActions = false }: { appointment: any; showActions?: boolean }) => (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-medium">{format(new Date(appointment.appointment_date), "PPP")}</p>
          <p className="text-sm text-muted-foreground">{appointment.appointment_time}</p>
          {appointment.notes && (
            <p className="text-xs text-muted-foreground mt-1">Note: {appointment.notes}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={
          appointment.status === "completed" ? "default" :
          appointment.status === "cancelled" ? "destructive" : "secondary"
        }>
          {appointment.status}
        </Badge>
        {showActions && appointment.status === "scheduled" && (
          <>
            <Button size="sm" variant="outline" onClick={() => updateStatus(appointment.id, "completed")}>
              <CheckCircle className="h-4 w-4 mr-1" /> Done
            </Button>
            <Button size="sm" variant="destructive" onClick={() => updateStatus(appointment.id, "cancelled")}>
              <XCircle className="h-4 w-4 mr-1" /> Cancel
            </Button>
          </>
        )}
        {appointment.google_meet_link && appointment.status === "scheduled" && (
          <Button size="sm" className="bg-gradient-primary" onClick={() => window.open(appointment.google_meet_link, "_blank")}>
            <Video className="h-4 w-4 mr-1" /> Join
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">My Appointments</h1>
        <p className="text-muted-foreground mb-8">Manage your patient consultations</p>

        {appointmentsLoading ? (
          <div className="flex justify-center py-12">
            <Activity className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Today */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" /> Today's Appointments ({todayAppointments.length})
              </h2>
              {todayAppointments.length > 0 ? (
                <div className="space-y-3">
                  {todayAppointments.map(a => <AppointmentCard key={a.id} appointment={a} showActions />)}
                </div>
              ) : (
                <Card><CardContent className="p-6 text-center text-muted-foreground">No appointments today</CardContent></Card>
              )}
            </section>

            {/* Upcoming */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" /> Upcoming ({upcomingAppointments.length})
              </h2>
              {upcomingAppointments.length > 0 ? (
                <div className="space-y-3">
                  {upcomingAppointments.map(a => <AppointmentCard key={a.id} appointment={a} showActions />)}
                </div>
              ) : (
                <Card><CardContent className="p-6 text-center text-muted-foreground">No upcoming appointments</CardContent></Card>
              )}
            </section>

            {/* Past */}
            {pastAppointments.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-muted-foreground" /> Past ({pastAppointments.length})
                </h2>
                <div className="space-y-3">
                  {pastAppointments.map(a => <AppointmentCard key={a.id} appointment={a} />)}
                </div>
              </section>
            )}
          </div>
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

export default DoctorAppointments;
