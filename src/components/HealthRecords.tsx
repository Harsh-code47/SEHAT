import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Activity, FileText, Loader2 } from "lucide-react";

interface BMIRecord {
  id: string;
  bmi: number;
  category: string;
  height: number;
  weight: number;
  age: number;
  created_at: string;
}

interface ReportAnalysis {
  id: string;
  report_type: string;
  abnormal_values: any;
  analysis_result: any;
  created_at: string;
}

const categoryColor = (cat: string) => {
  switch (cat.toLowerCase()) {
    case "normal": return "bg-green-500/15 text-green-700 dark:text-green-400";
    case "underweight":
    case "overweight": return "bg-amber-500/15 text-amber-700 dark:text-amber-400";
    case "obese": return "bg-red-500/15 text-red-700 dark:text-red-400";
    default: return "bg-muted text-muted-foreground";
  }
};

export const HealthRecords = ({ userId }: { userId: string }) => {
  const [bmiRecords, setBmiRecords] = useState<BMIRecord[]>([]);
  const [reports, setReports] = useState<ReportAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [bmiRes, repRes] = await Promise.all([
        supabase.from("bmi_records").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
        supabase.from("report_analyses").select("id, report_type, abnormal_values, analysis_result, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
      ]);
      if (bmiRes.data) setBmiRecords(bmiRes.data as BMIRecord[]);
      if (repRes.data) setReports(repRes.data as ReportAnalysis[]);
      setLoading(false);
    };
    load();
  }, [userId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Health Records</CardTitle>
        <CardDescription>Your past BMI calculations and analysed medical reports</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <Tabs defaultValue="bmi">
            <TabsList>
              <TabsTrigger value="bmi">BMI History ({bmiRecords.length})</TabsTrigger>
              <TabsTrigger value="reports">Reports ({reports.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="bmi" className="mt-4">
              {bmiRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>No BMI records yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {bmiRecords.map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <div className="font-semibold">BMI {Number(r.bmi).toFixed(1)}</div>
                        <div className="text-xs text-muted-foreground">
                          {r.height} cm · {r.weight} kg · {r.age}y · {format(new Date(r.created_at), "PPP")}
                        </div>
                      </div>
                      <Badge variant="outline" className={categoryColor(r.category)}>{r.category}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="reports" className="mt-4">
              {reports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>No analysed reports yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {reports.map((r) => {
                    const abnormalCount = Array.isArray(r.abnormal_values) ? r.abnormal_values.length : 0;
                    const total = (r.analysis_result as any)?.totalTests ?? null;
                    return (
                      <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <div className="font-semibold capitalize">{r.report_type.replace(/_/g, " ")}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(r.created_at), "PPP p")}{total !== null && ` · ${total} tests`}
                          </div>
                        </div>
                        {abnormalCount > 0 ? (
                          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20">
                            {abnormalCount} abnormal
                          </Badge>
                        ) : (
                          <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 hover:bg-green-500/20">All normal</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};
