import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Loader2, AlertCircle, CheckCircle, AlertTriangle, Languages } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";

const ReportAnalyzer = () => {
  const [user, setUser] = useState<any>(null);
  const [reportText, setReportText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [extractionStatus, setExtractionStatus] = useState<string>("");
  const [language, setLanguage] = useState<"english" | "hindi">("english");
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (selectedFile.size > maxSize) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
      setReportText(""); // Clear text input when file is selected
    }
  };

  // Extract text from PDF/image using AI vision
  const extractTextFromFile = async (file: File): Promise<string> => {
    setExtractionStatus("Converting file to base64...");
    
    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    
    const mimeType = file.type || 'application/pdf';
    const dataUrl = `data:${mimeType};base64,${base64}`;
    
    setExtractionStatus("Extracting text using AI...");
    
    // Use Supabase edge function to extract text using AI vision
    const { data, error } = await supabase.functions.invoke('analyze-report', {
      body: { 
        extractTextFromImage: true,
        imageData: dataUrl,
        fileName: file.name
      },
    });
    
    if (error) {
      if (error.context?.body) {
        try {
          const reader = error.context.body.getReader();
          const { value } = await reader.read();
          const errorBody = JSON.parse(new TextDecoder().decode(value));
          if (errorBody.error) throw new Error(errorBody.error);
        } catch (parseErr: any) {
          if (parseErr.message && parseErr.message !== error.message) throw parseErr;
        }
      }
      throw error;
    }
    
    if (data.extractedText) {
      return data.extractedText;
    }
    
    throw new Error('Failed to extract text from file');
  };

  const analyzeReport = async () => {
    if (!reportText.trim() && !file) {
      toast({
        title: "Error",
        description: "Please enter report text or upload a file",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setExtractionStatus("");
    setAnalysisResult(null); // Clear previous results

    try {
      let textToAnalyze = reportText;

      // If file is selected, extract text from it first
      if (file) {
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        
        // Upload file to storage
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('medical-reports')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // For text files, read directly
        if (fileExt === 'txt') {
          textToAnalyze = await file.text();
        } else {
          // For PDF and images, use AI to extract text
          try {
            textToAnalyze = await extractTextFromFile(file);
            setExtractionStatus("Text extracted successfully!");
          } catch (extractError: any) {
            console.error("Text extraction error:", extractError);
            toast({
              title: "Extraction Warning",
              description: "Could not extract text from file. Please paste the report text manually.",
              variant: "destructive",
            });
            setIsAnalyzing(false);
            return;
          }
        }
      }

      setExtractionStatus("Analyzing report...");

      // Call edge function for analysis
      const { data, error } = await supabase.functions.invoke('analyze-report', {
        body: { reportText: textToAnalyze, language },
      });

      if (error) {
        // Try to extract the actual error message from the response
        if (error.context?.body) {
          try {
            const reader = error.context.body.getReader();
            const { value } = await reader.read();
            const errorBody = JSON.parse(new TextDecoder().decode(value));
            if (errorBody.error) throw new Error(errorBody.error);
          } catch (parseErr: any) {
            if (parseErr.message && parseErr.message !== error.message) throw parseErr;
          }
        }
        throw error;
      }

      setAnalysisResult(data);

      // Save to database
      await supabase.from("report_analyses").insert({
        user_id: user.id,
        report_type: "lab_test",
        file_path: file ? `${user.id}/${file.name}` : null,
        analysis_result: data.analysis,
        abnormal_values: data.abnormalValues,
      });

      toast({
        title: "Analysis Complete",
        description: "Your report has been analyzed successfully",
      });
    } catch (error: any) {
      console.error("Analysis error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to analyze report",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
      setExtractionStatus("");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "normal":
        return "hsl(var(--health-normal))";
      case "low":
      case "high":
        return "hsl(var(--health-warning))";
      case "critical":
        return "hsl(var(--health-danger))";
      default:
        return "hsl(var(--health-normal))";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "normal":
        return <CheckCircle className="h-5 w-5 text-health-normal" />;
      case "low":
      case "high":
        return <AlertTriangle className="h-5 w-5 text-health-warning" />;
      case "critical":
        return <AlertCircle className="h-5 w-5 text-health-danger" />;
      default:
        return <CheckCircle className="h-5 w-5 text-health-normal" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              Medical Report Analyzer
            </h1>
            <p className="text-muted-foreground text-lg">
              Upload or paste your lab report for AI-powered analysis
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Enter Report Text</CardTitle>
                <CardDescription>Copy and paste your lab report text</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Paste your medical report text here...&#10;&#10;Example:&#10;Hemoglobin: 11.2 g/dL&#10;WBC: 8500 cells/μL&#10;Glucose: 145 mg/dL"
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                  disabled={!!file}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Or Upload File</CardTitle>
                <CardDescription>Upload PDF or image file (JPG, PNG)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.txt"
                    onChange={handleFileChange}
                  />
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-12 w-12 text-muted-foreground" />
                      <div className="text-sm text-muted-foreground">
                        {file ? (
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span className="font-medium">{file.name}</span>
                          </div>
                        ) : (
                          "Click to upload or drag and drop"
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        PDF, JPG, PNG, TXT (Max 10MB)
                      </div>
                    </div>
                  </Label>
                </div>
                {file && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4"
                    onClick={() => setFile(null)}
                  >
                    Remove File
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Languages className="h-5 w-5 text-muted-foreground" />
              <Select value={language} onValueChange={(val: "english" | "hindi") => setLanguage(val)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="hindi">हिन्दी (Hindi)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={analyzeReport}
              disabled={isAnalyzing || (!reportText.trim() && !file)}
              size="lg"
              className="bg-gradient-primary hover:opacity-90"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {extractionStatus || "Analyzing Report..."}
                </>
              ) : (
                language === "hindi" ? "रिपोर्ट का विश्लेषण करें" : "Analyze Report"
              )}
            </Button>
            {isAnalyzing && extractionStatus && (
              <p className="text-sm text-muted-foreground mt-2 animate-pulse">
                {extractionStatus}
              </p>
            )}
          </div>

          {analysisResult && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Analysis Summary</CardTitle>
                  <CardDescription>{analysisResult.summary}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {analysisResult.tests?.map((test: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 rounded-lg border-2"
                        style={{
                          borderColor: getStatusColor(test.status),
                          backgroundColor: `${getStatusColor(test.status)}10`,
                        }}
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(test.status)}
                          <div>
                            <div className="font-semibold">{test.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {test.value} {test.unit}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{test.status}</div>
                          <div className="text-xs text-muted-foreground">
                            Normal: {test.referenceRange}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {analysisResult.chartData && analysisResult.chartData.length > 0 && (
                <Card key={`chart-${Date.now()}-${analysisResult.chartData.length}`}>
                  <CardHeader>
                    <CardTitle>Visual Comparison with Standard Ranges</CardTitle>
                    <CardDescription>Your values compared to reference ranges</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={[...analysisResult.chartData]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="yourValue" name="Your Value" fill="hsl(var(--primary))">
                          {analysisResult.chartData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
                          ))}
                        </Bar>
                        <Bar dataKey="minNormal" name="Min Normal" fill="hsl(var(--health-optimal))" opacity={0.6} />
                        <Bar dataKey="maxNormal" name="Max Normal" fill="hsl(var(--health-optimal))" opacity={0.6} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {analysisResult.explanation && (
                <Card>
                  <CardHeader>
                    <CardTitle>AI Explanation</CardTitle>
                    <CardDescription>Understanding your results</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-foreground">{analysisResult.explanation}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> This analysis is for informational purposes only and should not replace 
                  professional medical advice. Please consult with a healthcare provider for proper interpretation 
                  and treatment recommendations.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportAnalyzer;
