import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Pill, Plus, Trash2, Clock, Loader2 } from "lucide-react";

interface Reminder {
  id: string;
  medication_name: string;
  dosage: string | null;
  frequency: string;
  times_of_day: string[];
  start_date: string;
  end_date: string | null;
  notes: string | null;
  is_active: boolean;
}

interface LogRow { reminder_id: string; time_slot: string; }

const todayStr = () => new Date().toISOString().split("T")[0];

export const MedicationReminders = ({ userId }: { userId: string }) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [times, setTimes] = useState<string>("09:00");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");

  const load = async () => {
    setLoading(true);
    const today = todayStr();
    const [remRes, logRes] = await Promise.all([
      supabase.from("medication_reminders").select("*").eq("user_id", userId).eq("is_active", true).order("created_at", { ascending: false }),
      supabase.from("reminder_logs").select("reminder_id, time_slot").eq("user_id", userId).eq("taken_date", today),
    ]);
    if (remRes.data) setReminders(remRes.data as Reminder[]);
    if (logRes.data) setLogs(logRes.data as LogRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const isTaken = (reminderId: string, slot: string) =>
    logs.some((l) => l.reminder_id === reminderId && l.time_slot === slot);

  const toggleTaken = async (reminderId: string, slot: string) => {
    const taken = isTaken(reminderId, slot);
    if (taken) {
      const { error } = await supabase
        .from("reminder_logs")
        .delete()
        .eq("user_id", userId)
        .eq("reminder_id", reminderId)
        .eq("taken_date", todayStr())
        .eq("time_slot", slot);
      if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
      setLogs((p) => p.filter((l) => !(l.reminder_id === reminderId && l.time_slot === slot)));
    } else {
      const { error } = await supabase.from("reminder_logs").insert({
        user_id: userId, reminder_id: reminderId, time_slot: slot, taken_date: todayStr(),
      });
      if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
      setLogs((p) => [...p, { reminder_id: reminderId, time_slot: slot }]);
    }
  };

  const addReminder = async () => {
    if (!name.trim()) {
      toast({ title: "Required", description: "Medication name is required", variant: "destructive" });
      return;
    }
    const timeList = times.split(",").map((t) => t.trim()).filter(Boolean);
    if (timeList.length === 0) {
      toast({ title: "Required", description: "Add at least one time (HH:MM)", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("medication_reminders").insert({
      user_id: userId,
      medication_name: name.trim(),
      dosage: dosage.trim() || null,
      times_of_day: timeList,
      end_date: endDate || null,
      notes: notes.trim() || null,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }
    setName(""); setDosage(""); setTimes("09:00"); setEndDate(""); setNotes("");
    setOpen(false);
    toast({ title: "Reminder added" });
    load();
  };

  const removeReminder = async (id: string) => {
    const { error } = await supabase.from("medication_reminders").update({ is_active: false }).eq("id", id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    setReminders((p) => p.filter((r) => r.id !== id));
  };

  const totalDoses = reminders.reduce((s, r) => s + r.times_of_day.length, 0);
  const takenToday = logs.length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-primary" /> Medication Reminders
          </CardTitle>
          <CardDescription>
            {totalDoses > 0
              ? `${takenToday} of ${totalDoses} doses taken today`
              : "Track your daily medications"}
          </CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-gradient-primary"><Plus className="h-4 w-4 mr-1" /> Add</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New medication reminder</DialogTitle>
              <DialogDescription>You'll see a daily checklist on your dashboard.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="med_name">Medication name *</Label>
                <Input id="med_name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} placeholder="e.g. Metformin" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dosage">Dosage</Label>
                <Input id="dosage" value={dosage} onChange={(e) => setDosage(e.target.value)} maxLength={50} placeholder="e.g. 500mg, 1 tablet" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="times">Times (comma-separated, 24h)</Label>
                <Input id="times" value={times} onChange={(e) => setTimes(e.target.value)} placeholder="08:00, 14:00, 20:00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End date (optional)</Label>
                <Input id="end_date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="med_notes">Notes</Label>
                <Textarea id="med_notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={300} rows={2} placeholder="Take with food" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={addReminder} disabled={saving} className="bg-gradient-primary">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add reminder"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : reminders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Pill className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>No reminders set</p>
            <p className="text-sm mt-1">Add your first medication to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.map((r) => (
              <div key={r.id} className="p-3 rounded-lg border">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="font-semibold">{r.medication_name}</div>
                    {r.dosage && <div className="text-xs text-muted-foreground">{r.dosage}</div>}
                    {r.notes && <div className="text-xs text-muted-foreground mt-1 italic">{r.notes}</div>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeReminder(r.id)} aria-label="Remove">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.times_of_day.map((t) => {
                    const taken = isTaken(r.id, t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleTaken(r.id, t)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm transition-colors ${
                          taken ? "bg-green-500/15 border-green-500/40 text-green-700 dark:text-green-400" : "bg-muted/40 hover:bg-muted"
                        }`}
                      >
                        <Checkbox checked={taken} className="pointer-events-none" />
                        <Clock className="h-3.5 w-3.5" /> {t}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
