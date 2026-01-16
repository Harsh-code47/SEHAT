import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Activity, TrendingDown, TrendingUp } from "lucide-react";
import { BMIMeter } from "@/components/BMIMeter";

const BMICalculator = () => {
  const [user, setUser] = useState<any>(null);
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [bmiResult, setBmiResult] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });
  }, [navigate]);

  const calculateBMI = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCalculating(true);

    try {
      const heightM = parseFloat(height) / 100;
      const weightKg = parseFloat(weight);
      const bmi = weightKg / (heightM * heightM);
      
      let category = "";
      let statusIcon = null;
      
      if (bmi < 18.5) {
        category = "Underweight";
        statusIcon = <TrendingDown className="h-5 w-5 text-health-warning" />;
      } else if (bmi >= 18.5 && bmi < 25) {
        category = "Normal";
        statusIcon = <Activity className="h-5 w-5 text-health-normal" />;
      } else if (bmi >= 25 && bmi < 30) {
        category = "Overweight";
        statusIcon = <TrendingUp className="h-5 w-5 text-health-warning" />;
      } else {
        category = "Obese";
        statusIcon = <TrendingUp className="h-5 w-5 text-health-danger" />;
      }

      const result = {
        bmi: bmi.toFixed(1),
        category,
        statusIcon,
        height: parseFloat(height),
        weight: weightKg,
        age: parseInt(age),
        gender,
      };

      // Save to database
      const { error } = await supabase.from("bmi_records").insert({
        user_id: user.id,
        height: result.height,
        weight: result.weight,
        age: result.age,
        gender: result.gender,
        bmi: parseFloat(result.bmi),
        category: result.category,
      });

      if (error) throw error;

      setBmiResult(result);
      toast({
        title: "BMI Calculated",
        description: `Your BMI is ${result.bmi} (${category})`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to calculate BMI",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };


  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              BMI Calculator
            </h1>
            <p className="text-muted-foreground text-lg">
              Calculate your Body Mass Index and compare with standard health ranges
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Enter Your Details</CardTitle>
                <CardDescription>Fill in the form to calculate your BMI</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={calculateBMI} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      placeholder="170"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      placeholder="70"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="25"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={gender} onValueChange={setGender} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full bg-gradient-primary hover:opacity-90"
                    disabled={isCalculating}
                  >
                    {isCalculating ? "Calculating..." : "Calculate BMI"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {bmiResult && (
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Your BMI Result
                    {bmiResult.statusIcon}
                  </CardTitle>
                  <CardDescription>Based on your inputs</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex justify-center p-4">
                    <BMIMeter bmi={parseFloat(bmiResult.bmi)} category={bmiResult.category} />
                  </div>

                  <div className="space-y-2 text-sm border-t pt-4">
                    <h3 className="font-semibold text-muted-foreground mb-3">BMI RANGES</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-amber-500" />
                        <span className="text-muted-foreground">Underweight:</span>
                        <span className="font-medium">&lt; 18.5</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="text-muted-foreground">Normal:</span>
                        <span className="font-medium">18.5 - 24.9</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-amber-500" />
                        <span className="text-muted-foreground">Overweight:</span>
                        <span className="font-medium">25 - 29.9</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-muted-foreground">Obese:</span>
                        <span className="font-medium">&ge; 30</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BMICalculator;
