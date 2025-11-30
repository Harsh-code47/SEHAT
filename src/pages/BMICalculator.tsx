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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from "recharts";
import { Activity, TrendingDown, TrendingUp, Minus } from "lucide-react";

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

  const bmiChartData = [
    { category: "Underweight", range: 17, fill: "hsl(var(--health-warning))" },
    { category: "Normal", range: 21.75, fill: "hsl(var(--health-normal))" },
    { category: "Overweight", range: 27.5, fill: "hsl(var(--health-warning))" },
    { category: "Obese", range: 35, fill: "hsl(var(--health-danger))" },
  ];

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
                  <div className="text-center p-6 rounded-lg bg-gradient-primary/10">
                    <div className="text-5xl font-bold text-primary mb-2">
                      {bmiResult.bmi}
                    </div>
                    <div className="text-xl font-semibold">{bmiResult.category}</div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground">
                      BMI RANGES COMPARISON
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={bmiChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 40]} />
                        <YAxis dataKey="category" type="category" width={100} />
                        <Tooltip />
                        <ReferenceLine
                          x={parseFloat(bmiResult.bmi)}
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          label={{ value: "You", position: "top" }}
                        />
                        <Bar dataKey="range" radius={[0, 8, 8, 0]}>
                          {bmiChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Underweight:</span>
                      <span className="font-medium">&lt; 18.5</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Normal:</span>
                      <span className="font-medium">18.5 - 24.9</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Overweight:</span>
                      <span className="font-medium">25 - 29.9</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Obese:</span>
                      <span className="font-medium">&ge; 30</span>
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
