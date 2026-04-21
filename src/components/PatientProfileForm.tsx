import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserCircle } from "lucide-react";
import { z } from "zod";

const profileSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required").max(100),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  date_of_birth: z.string().optional().or(z.literal("")),
  gender: z.string().optional().or(z.literal("")),
  blood_group: z.string().optional().or(z.literal("")),
  height_cm: z.string().optional().or(z.literal("")),
  weight_kg: z.string().optional().or(z.literal("")),
  allergies: z.string().max(500).optional().or(z.literal("")),
  chronic_conditions: z.string().max(500).optional().or(z.literal("")),
  emergency_contact_name: z.string().max(100).optional().or(z.literal("")),
  emergency_contact_phone: z.string().max(20).optional().or(z.literal("")),
});

type ProfileForm = z.infer<typeof profileSchema>;

const empty: ProfileForm = {
  full_name: "",
  phone: "",
  date_of_birth: "",
  gender: "",
  blood_group: "",
  height_cm: "",
  weight_kg: "",
  allergies: "",
  chronic_conditions: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
};

export const PatientProfileForm = ({ userId }: { userId: string }) => {
  const [form, setForm] = useState<ProfileForm>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else if (data) {
        setForm({
          full_name: data.full_name ?? "",
          phone: (data as any).phone ?? "",
          date_of_birth: (data as any).date_of_birth ?? "",
          gender: (data as any).gender ?? "",
          blood_group: (data as any).blood_group ?? "",
          height_cm: (data as any).height_cm?.toString() ?? "",
          weight_kg: (data as any).weight_kg?.toString() ?? "",
          allergies: (data as any).allergies ?? "",
          chronic_conditions: (data as any).chronic_conditions ?? "",
          emergency_contact_name: (data as any).emergency_contact_name ?? "",
          emergency_contact_phone: (data as any).emergency_contact_phone ?? "",
        });
      }
      setLoading(false);
    };
    load();
  }, [userId, toast]);

  const update = (k: keyof ProfileForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = profileSchema.safeParse(form);
    if (!parsed.success) {
      toast({
        title: "Invalid input",
        description: parsed.error.issues[0]?.message ?? "Please check your inputs",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    const payload: any = {
      id: userId,
      full_name: form.full_name.trim(),
      phone: form.phone || null,
      date_of_birth: form.date_of_birth || null,
      gender: form.gender || null,
      blood_group: form.blood_group || null,
      height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
      weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
      allergies: form.allergies || null,
      chronic_conditions: form.chronic_conditions || null,
      emergency_contact_name: form.emergency_contact_name || null,
      emergency_contact_phone: form.emergency_contact_phone || null,
    };
    const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile saved", description: "Your information has been updated." });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCircle className="h-5 w-5 text-primary" /> My Profile
        </CardTitle>
        <CardDescription>Keep your personal and health info up to date — doctors use it during consultations.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Basic information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full name *</Label>
                <Input id="full_name" value={form.full_name} onChange={update("full_name")} maxLength={100} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={form.phone} onChange={update("phone")} maxLength={20} placeholder="+91 98765 43210" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of birth</Label>
                <Input id="date_of_birth" type="date" value={form.date_of_birth} onChange={update("date_of_birth")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={form.gender || undefined} onValueChange={(v) => setForm((p) => ({ ...p, gender: v }))}>
                  <SelectTrigger id="gender"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Health info</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="blood_group">Blood group</Label>
                <Select value={form.blood_group || undefined} onValueChange={(v) => setForm((p) => ({ ...p, blood_group: v }))}>
                  <SelectTrigger id="blood_group"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="height_cm">Height (cm)</Label>
                <Input id="height_cm" type="number" inputMode="decimal" min="1" value={form.height_cm} onChange={update("height_cm")} placeholder="170" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight_kg">Weight (kg)</Label>
                <Input id="weight_kg" type="number" inputMode="decimal" step="0.1" min="1" value={form.weight_kg} onChange={update("weight_kg")} placeholder="65" />
              </div>
              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="allergies">Allergies</Label>
                <Textarea id="allergies" value={form.allergies} onChange={update("allergies")} maxLength={500} placeholder="e.g. Penicillin, peanuts" rows={2} />
              </div>
              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="chronic_conditions">Chronic conditions</Label>
                <Textarea id="chronic_conditions" value={form.chronic_conditions} onChange={update("chronic_conditions")} maxLength={500} placeholder="e.g. Hypertension, Type 2 diabetes" rows={2} />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Emergency contact</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_name">Name</Label>
                <Input id="emergency_contact_name" value={form.emergency_contact_name} onChange={update("emergency_contact_name")} maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_phone">Phone</Label>
                <Input id="emergency_contact_phone" value={form.emergency_contact_phone} onChange={update("emergency_contact_phone")} maxLength={20} />
              </div>
            </div>
          </div>

          <Button type="submit" className="bg-gradient-primary hover:opacity-90" disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : "Save profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
