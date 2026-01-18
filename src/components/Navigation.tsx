import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, User, Moon, Sun } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import sehatLogo from "@/assets/sehat-logo.png";

export const Navigation = () => {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
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
            <span className="text-gradient">
              SEHAT
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm font-medium text-foreground hover:text-primary transition-all duration-200 hover:-translate-y-0.5">
              Home
            </Link>
            <Link to="/bmi-calculator" className="text-sm font-medium text-foreground hover:text-primary transition-all duration-200 hover:-translate-y-0.5">
              BMI
            </Link>
            <Link to="/report-analyzer" className="text-sm font-medium text-foreground hover:text-primary transition-all duration-200 hover:-translate-y-0.5">
              Report Analyzer
            </Link>
            <Link to="/consultancy" className="text-sm font-medium text-foreground hover:text-primary transition-all duration-200 hover:-translate-y-0.5">
              Consultancy
            </Link>
            <Link to="/prescription" className="text-sm font-medium text-foreground hover:text-primary transition-all duration-200 hover:-translate-y-0.5">
              Prescription
            </Link>
          </div>

          <div className="flex items-center gap-3">
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
                    <Link to="/dashboard">
                      Dashboard
                    </Link>
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
      </div>
    </nav>
  );
};
