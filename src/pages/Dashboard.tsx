import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DoctorProfileForm } from "@/components/DoctorProfileForm";
import { useDoctorProfile } from "@/hooks/useDoctorProfile";
import { useAppointments } from "@/hooks/useAppointments";
import { 
  FileText, 
  Calculator, 
  Users, 
  Activity, 
  ClipboardList,
  Stethoscope,
  TrendingUp,
  Calendar,
  Video,
  Clock,
  CheckCircle
} from "lucide-react";
import { format } from "date-fns";

type UserRole = "user" | "doctor";

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole>("user");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }
      
      setUser(session.user);
      
      // Get user role from metadata or user_roles table
      const metaRole = session.user.user_metadata?.role;
      if (metaRole === "doctor") {
        setUserRole("doctor");
      } else {
        setUserRole("user");
      }
      
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {user?.user_metadata?.full_name || "User"}!
          </h1>
          <p className="text-muted-foreground">
            {userRole === "doctor" 
              ? "Manage your profile and patient consultations" 
              : "Track your health metrics and analyze your reports"}
          </p>
        </div>

        {/* Role-based Dashboard Content */}
        {userRole === "doctor" ? (
          <DoctorDashboard user={user} />
        ) : (
          <PatientDashboard user={user} />
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 border-t mt-auto">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>All Rights Reserved - SEHAT</p>
        </div>
      </footer>
    </div>
  );
};

const PatientDashboard = ({ user }: { user: any }) => {
  const { appointments, loading: appointmentsLoading } = useAppointments(user?.id, "patient");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingAppointments = appointments.filter(a => {
    const appointmentDate = new Date(a.appointment_date);
    return a.status === "scheduled" && appointmentDate >= today;
  });

  return (
    <div className="space-y-8">
      {/* Quick Actions */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <Link to="/report-analyzer">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold">Analyze Report</h3>
                <p className="text-sm text-muted-foreground mt-1">Upload and analyze medical reports</p>
              </CardContent>
            </Link>
          </Card>
          
          <Card className="hover:border-secondary transition-colors cursor-pointer">
            <Link to="/bmi-calculator">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-lg bg-gradient-warm flex items-center justify-center mb-4">
                  <Calculator className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold">BMI Calculator</h3>
                <p className="text-sm text-muted-foreground mt-1">Calculate your Body Mass Index</p>
              </CardContent>
            </Link>
          </Card>
          
          <Card className="hover:border-accent transition-colors cursor-pointer">
            <Link to="/consultancy">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-lg bg-accent flex items-center justify-center mb-4">
                  <Stethoscope className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold">Consult Doctor</h3>
                <p className="text-sm text-muted-foreground mt-1">Book video consultations</p>
              </CardContent>
            </Link>
          </Card>
          
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <Link to="/prescription">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center mb-4">
                  <ClipboardList className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold">Prescriptions</h3>
                <p className="text-sm text-muted-foreground mt-1">View your prescriptions</p>
              </CardContent>
            </Link>
          </Card>
        </div>
      </section>

      {/* Upcoming Appointments */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Upcoming Appointments</h2>
        <Card>
          <CardContent className="p-6">
            {appointmentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Activity className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : upcomingAppointments.length > 0 ? (
              <div className="space-y-4">
                {upcomingAppointments.slice(0, 3).map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {format(new Date(appointment.appointment_date), "PPP")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {appointment.appointment_time}
                        </p>
                      </div>
                    </div>
                    {appointment.google_meet_link && (
                      <Button
                        size="sm"
                        className="bg-gradient-primary"
                        onClick={() => window.open(appointment.google_meet_link!, "_blank")}
                      >
                        <Video className="h-4 w-4 mr-2" />
                        Join Meet
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No upcoming appointments</p>
                <p className="text-sm mt-1">Book a consultation with a doctor</p>
                <Button asChild className="mt-4">
                  <Link to="/consultancy">Find a Doctor</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

const DoctorDashboard = ({ user }: { user: any }) => {
  const { profile, loading: profileLoading, refetch } = useDoctorProfile(user?.id);
  const { appointments, loading: appointmentsLoading } = useAppointments(user?.id, "doctor");
  
  const todayAppointments = appointments.filter(a => {
    const today = new Date().toISOString().split('T')[0];
    return a.appointment_date === today && a.status === "scheduled";
  });

  const pendingAppointments = appointments.filter(a => a.status === "scheduled");
  const completedAppointments = appointments.filter(a => a.status === "completed");

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Activity className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Doctor Profile Form */}
      <section>
        <DoctorProfileForm
          initialData={profile ? {
            id: profile.id,
            specialty: profile.specialty,
            experience_years: profile.experience_years,
            consultation_fee: profile.consultation_fee,
            bio: profile.bio || "",
            is_available: profile.is_available,
          } : undefined}
          userId={user?.id}
          onSave={refetch}
        />
      </section>

      {/* Stats Overview */}
      <section className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{todayAppointments.length}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Consultations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <span className="text-2xl font-bold">{pendingAppointments.length}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{completedAppointments.length}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Consultation Fee</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">₹{profile?.consultation_fee || 0}</span>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Today's Appointments */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Today's Appointments</h2>
        <Card>
          <CardContent className="p-6">
            {appointmentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Activity className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : todayAppointments.length > 0 ? (
              <div className="space-y-4">
                {todayAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Patient Consultation</p>
                        <p className="text-sm text-muted-foreground">
                          {appointment.appointment_time}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>{appointment.status}</Badge>
                      {appointment.google_meet_link && (
                        <Button
                          size="sm"
                          className="bg-gradient-primary"
                          onClick={() => window.open(appointment.google_meet_link!, "_blank")}
                        >
                          <Video className="h-4 w-4 mr-2" />
                          Join
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No appointments scheduled for today</p>
                <p className="text-sm mt-1">Your upcoming appointments will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* All Upcoming Appointments */}
      {pendingAppointments.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">All Upcoming Appointments</h2>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {pendingAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {format(new Date(appointment.appointment_date), "PPP")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {appointment.appointment_time}
                        </p>
                      </div>
                    </div>
                    {appointment.google_meet_link && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(appointment.google_meet_link!, "_blank")}
                      >
                        <Video className="h-4 w-4 mr-2" />
                        Join Meet
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
};

export default Dashboard;
