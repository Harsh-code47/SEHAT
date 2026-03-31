import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Stethoscope } from "lucide-react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import authHeroImage from "@/assets/auth-hero.jpg";
import authHero2 from "@/assets/auth-hero-2.jpg";
import authHero3 from "@/assets/auth-hero-3.jpg";
import authHero4 from "@/assets/auth-hero-4.jpg";
import authHero5 from "@/assets/auth-hero-5.jpg";
import sehatLogo from "@/assets/sehat-logo.png";

const heroSlides = [
  { image: authHeroImage, title: "Store your Medical Records", subtitle: "Share with your doctor from anywhere, anytime" },
  { image: authHero2, title: "Expert Doctor Consultations", subtitle: "Connect with top healthcare professionals online" },
  { image: authHero3, title: "Stay Active, Stay Healthy", subtitle: "Track your fitness and wellness journey with us" },
  { image: authHero4, title: "Nutrition & Healthy Eating", subtitle: "Get personalized diet plans and food insights" },
  { image: authHero5, title: "Mental Wellness Matters", subtitle: "Mindfulness and meditation for a balanced life" },
];

const authSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Name must be at least 2 characters").optional(),
});

type UserRole = "user" | "doctor";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validated = authSchema.parse({ email, password, fullName });
      
      const { error } = await supabase.auth.signUp({
        email: validated.email,
        password: validated.password,
        options: {
          data: {
            full_name: validated.fullName,
            role: role,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Account created successfully. You can now log in.",
      });
      
      // Auto login after signup
      await handleLogin(e, validated.email, validated.password);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign up",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent, loginEmail?: string, loginPassword?: string) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validated = authSchema.parse({ 
        email: loginEmail || email, 
        password: loginPassword || password 
      });
      
      const { error } = await supabase.auth.signInWithPassword({
        email: validated.email,
        password: validated.password,
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Logged in successfully",
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to log in",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Hero Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img 
          src={authHeroImage} 
          alt="Healthy lifestyle" 
          className="absolute inset-0 w-full h-full object-cover animate-scale-in"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <h2 className="text-3xl font-bold mb-2 opacity-0 animate-fade-in-up animate-delay-300">Store your Medical Records</h2>
          <p className="text-white/90 opacity-0 animate-fade-in-up animate-delay-500">Share with your doctor from anywhere, anytime</p>
          <div className="flex gap-2 mt-6 opacity-0 animate-fade-in animate-delay-700">
            {[1, 2, 3, 4, 5].map((i) => (
              <div 
                key={i} 
                className={cn(
                  "h-1 rounded-full transition-all duration-300",
                  i === 5 ? "w-8 bg-white" : "w-4 bg-white/50 hover:bg-white/80"
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12">
        <Card className="w-full max-w-md border-0 shadow-none opacity-0 animate-fade-in-up">
          <CardContent className="p-0">
            {/* Logo */}
            <div className="flex justify-center items-center gap-3 mb-8">
              <img 
                src={sehatLogo} 
                alt="SEHAT Logo" 
                className="h-14 w-14 rounded-lg object-contain animate-bounce-soft"
              />
              <span className="text-2xl font-bold text-gradient">
                SEHAT
              </span>
            </div>

            {/* Role Toggle */}
            <div className="mb-6">
              <div className="flex bg-muted rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setRole("user")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md text-sm font-medium transition-all duration-300",
                    role === "user" 
                      ? "bg-background text-foreground shadow-sm scale-[1.02]" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <User className="h-4 w-4" />
                  Patient
                </button>
                <button
                  type="button"
                  onClick={() => setRole("doctor")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md text-sm font-medium transition-all duration-300",
                    role === "doctor" 
                      ? "bg-background text-foreground shadow-sm scale-[1.02]" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Stethoscope className="h-4 w-4" />
                  Doctor
                </button>
              </div>
            </div>

            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-primary hover:opacity-90 text-white font-semibold hover-scale btn-press transition-all duration-200"
                    disabled={isLoading}
                  >
                    {isLoading ? "Logging in..." : `Login as ${role === "doctor" ? "Doctor" : "Patient"}`}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-primary hover:opacity-90 text-white font-semibold hover-scale btn-press transition-all duration-200"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating account..." : `Sign Up as ${role === "doctor" ? "Doctor" : "Patient"}`}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <p className="text-center text-sm text-muted-foreground mt-6">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
