import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, User, Moon, Sun, Stethoscope, Menu, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import sehatLogo from "@/assets/sehat-logo.png";

type UserRole = "user" | "doctor" | null;

export const Navigation = () => {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setUserRole(session.user.user_metadata?.role === "doctor" ? "doctor" : "user");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setUserRole(session.user.user_metadata?.role === "doctor" ? "doctor" : "user");
      } else {
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      });
    } else {
      navigate("/auth");
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
    }
  };

  const patientLinks = [
    { to: "/", label: "Home" },
    { to: "/bmi-calculator", label: "BMI" },
    { to: "/report-analyzer", label: "Report Analyzer" },
    { to: "/consultancy", label: "Consultancy" },
    { to: "/prescription", label: "Prescription" },
  ];

  const doctorLinks = [
    { to: "/", label: "Home" },
    { to: "/dashboard", label: "Dashboard" },
    { to: "/doctor/appointments", label: "Appointments" },
    { to: "/doctor/patients", label: "My Patients" },
  ];

  const guestLinks = [
    { to: "/", label: "Home" },
    { to: "/bmi-calculator", label: "BMI" },
    { to: "/report-analyzer", label: "Report Analyzer" },
    { to: "/consultancy", label: "Consultancy" },
    { to: "/prescription", label: "Prescription" },
  ];

  const links = !user ? guestLinks : userRole === "doctor" ? doctorLinks : patientLinks;

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl group">
            <img 
              src={sehatLogo} 
              alt="SEHAT Logo" 
              className="h-14 w-14 rounded-lg object-contain transition-transform duration-300 group-hover:scale-110" 
            />
            <span className="text-gradient">SEHAT</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "text-sm font-medium transition-all duration-200 hover:-translate-y-0.5",
                  location.pathname === link.to
                    ? "text-primary"
                    : "text-foreground hover:text-primary"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Role badge for logged-in users */}
            {user && userRole && (
              <span className={cn(
                "hidden md:flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full",
                userRole === "doctor"
                  ? "bg-primary/10 text-primary"
                  : "bg-accent/10 text-accent"
              )}>
                {userRole === "doctor" ? <Stethoscope className="h-3 w-3" /> : <User className="h-3 w-3" />}
                {userRole === "doctor" ? "Doctor" : "Patient"}
              </span>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full transition-all duration-300 hover:rotate-12 hover:scale-110"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5 transition-transform duration-300" />
              ) : (
                <Moon className="h-5 w-5 transition-transform duration-300" />
              )}
            </Button>

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-full"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full border-2 transition-all duration-300 hover:scale-110 hover:border-primary">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="animate-scale-in bg-popover">
                  <DropdownMenuItem className="text-sm text-muted-foreground">
                    {user.email}
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer transition-colors duration-200">
                    <Link to="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive transition-colors duration-200">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="outline" className="rounded-full px-6 hover-scale btn-press transition-all duration-200">
                <Link to="/auth">Login / Signup</Link>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile nav */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2 animate-fade-in">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "block py-2 px-3 rounded-md text-sm font-medium transition-colors",
                  location.pathname === link.to
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-muted"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};
