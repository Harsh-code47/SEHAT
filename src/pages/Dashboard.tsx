import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Calculator, 
  Users, 
  Activity, 
  ClipboardList,
  Stethoscope,
  TrendingUp,
  Calendar
} from "lucide-react";

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
              ? "Manage your patients and review their health reports" 
              : "Track your health metrics and analyze your reports"}
          </p>
        </div>

        {/* Role-based Dashboard Content */}
        {userRole === "doctor" ? (
          <DoctorDashboard />
        ) : (
          <PatientDashboard />
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 border-t mt-auto">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 SEHAT. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
};

const PatientDashboard = () => {
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
          
          <Card className="hover:border-accent transition-colors">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-lg bg-accent flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold">Health Trends</h3>
              <p className="text-sm text-muted-foreground mt-1">View your health history</p>
            </CardContent>
          </Card>
          
          <Card className="hover:border-primary transition-colors">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold">Appointments</h3>
              <p className="text-sm text-muted-foreground mt-1">Schedule doctor visits</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground py-8">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent activity yet</p>
              <p className="text-sm mt-1">Start by analyzing a report or calculating your BMI</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

const DoctorDashboard = () => {
  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <section className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">0</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reports Reviewed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-secondary" />
              <span className="text-2xl font-bold">0</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-accent" />
              <span className="text-2xl font-bold">0</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">0</span>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold">View Patients</h3>
              <p className="text-sm text-muted-foreground mt-1">Manage your patient list</p>
            </CardContent>
          </Card>
          
          <Card className="hover:border-secondary transition-colors cursor-pointer">
            <Link to="/report-analyzer">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-lg bg-gradient-warm flex items-center justify-center mb-4">
                  <ClipboardList className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold">Review Reports</h3>
                <p className="text-sm text-muted-foreground mt-1">Analyze patient reports</p>
              </CardContent>
            </Link>
          </Card>
          
          <Card className="hover:border-accent transition-colors">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-lg bg-accent flex items-center justify-center mb-4">
                <Stethoscope className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold">Consultations</h3>
              <p className="text-sm text-muted-foreground mt-1">Manage appointments</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Recent Patients */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Recent Patients</h2>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground py-8">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No patients yet</p>
              <p className="text-sm mt-1">Patients will appear here when they share their reports with you</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default Dashboard;
