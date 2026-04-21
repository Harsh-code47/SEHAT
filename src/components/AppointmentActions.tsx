import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { CalendarClock, Pencil, Loader2, X } from "lucide-react";

interface Props {
  appointment: { id: string; appointment_date: string; appointment_time: string; notes: string | null };
  onChanged: () => void;
}

const TIME_SLOTS = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

export const AppointmentActions = ({ appointment, onChanged }: Props) => {
  const { toast } = useToast();
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [newDate, setNewDate] = useState(appointment.appointment_date);
  const [newTime, setNewTime] = useState(appointment.appointment_time);
  const [notes, setNotes] = useState(appointment.notes ?? "");
  const [busy, setBusy] = useState(false);

  const cancelAppointment = async () => {
    setBusy(true);
    const { error } = await supabase.from("appointments").update({ status: "cancelled" }).eq("id", appointment.id);
    setBusy(false);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Appointment cancelled" });
    onChanged();
  };

  const reschedule = async () => {
    if (!newDate || !newTime) {
      toast({ title: "Invalid", description: "Pick a date and time", variant: "destructive" });
      return;
    }
    if (new Date(newDate) < new Date(new Date().toDateString())) {
      toast({ title: "Invalid date", description: "Pick today or a future date", variant: "destructive" });
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("appointments")
      .update({ appointment_date: newDate, appointment_time: newTime })
      .eq("id", appointment.id);
    setBusy(false);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    setRescheduleOpen(false);
    toast({ title: "Appointment rescheduled" });
    onChanged();
  };

  const saveNotes = async () => {
    setBusy(true);
    const { error } = await supabase
      .from("appointments")
      .update({ notes: notes.trim() || null })
      .eq("id", appointment.id);
    setBusy(false);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    setNotesOpen(false);
    toast({ title: "Notes saved" });
    onChanged();
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <Button size="sm" variant="outline" onClick={() => setRescheduleOpen(true)}>
          <CalendarClock className="h-4 w-4 mr-1" /> Reschedule
        </Button>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule appointment</DialogTitle>
            <DialogDescription>Pick a new date and time slot.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="r_date">Date</Label>
              <Input id="r_date" type="date" value={newDate} min={new Date().toISOString().split("T")[0]} onChange={(e) => setNewDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="r_time">Time</Label>
              <select
                id="r_time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleOpen(false)}>Cancel</Button>
            <Button onClick={reschedule} disabled={busy} className="bg-gradient-primary">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={notesOpen} onOpenChange={setNotesOpen}>
        <Button size="sm" variant="outline" onClick={() => setNotesOpen(true)}>
          <Pencil className="h-4 w-4 mr-1" /> Notes
        </Button>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Note for the doctor</DialogTitle>
            <DialogDescription>Share symptoms or concerns before your visit.</DialogDescription>
          </DialogHeader>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} rows={5} placeholder="e.g. Mild fever for 3 days, occasional headache..." />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesOpen(false)}>Cancel</Button>
            <Button onClick={saveNotes} disabled={busy} className="bg-gradient-primary">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="sm" variant="outline" className="text-destructive hover:text-destructive">
            <X className="h-4 w-4 mr-1" /> Cancel
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The doctor will be notified that the slot is free.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={cancelAppointment} disabled={busy}>
              {busy ? "Cancelling..." : "Cancel appointment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
