import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save, Stethoscope } from "lucide-react";

interface DoctorProfile {
  id?: string;
  display_name: string;
  specialty: string;
  experience_years: number;
  consultation_fee: number;
  bio: string;
  is_available: boolean;
}

interface DoctorProfileFormProps {
  initialData?: DoctorProfile;
  userId: string;
  onSave?: () => void;
}

const specialties = [
  "General Physician",
  "Cardiologist",
  "Neurologist",
  "Orthopedic",
  "Ophthalmologist",
  "Pediatrician",
  "Dermatologist",
  "Psychiatrist",
  "Gynecologist",
  "ENT Specialist",
  "Dentist",
  "Pulmonologist",
  "Gastroenterologist",
  "Urologist",
  "Oncologist",
];

export const DoctorProfileForm = ({ initialData, userId, onSave }: DoctorProfileFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<DoctorProfile>({
    display_name: initialData?.display_name || "",
    specialty: initialData?.specialty || "General Physician",
    experience_years: initialData?.experience_years || 0,
    consultation_fee: initialData?.consultation_fee || 500,
    bio: initialData?.bio || "",
    is_available: initialData?.is_available ?? true,
  });

  const handleSave = async () => {
    if (!profile.display_name.trim()) {
      toast({
        title: "Display name required",
        description: "Please enter your name as it should appear to patients.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      if (initialData?.id) {
        // Update existing profile
        const { error } = await supabase
          .from("doctor_profiles")
          .update({
            display_name: profile.display_name,
            specialty: profile.specialty,
            experience_years: profile.experience_years,
            consultation_fee: profile.consultation_fee,
            bio: profile.bio,
            is_available: profile.is_available,
          })
          .eq("id", initialData.id);

        if (error) throw error;
      } else {
        // Create new profile
        const { error } = await supabase
          .from("doctor_profiles")
          .insert({
            user_id: userId,
            specialty: profile.specialty,
            experience_years: profile.experience_years,
            consultation_fee: profile.consultation_fee,
            bio: profile.bio,
            is_available: profile.is_available,
          });

        if (error) throw error;
      }

      toast({
        title: "Profile saved successfully!",
        description: "Your doctor profile has been updated.",
      });

      onSave?.();
    } catch (error: any) {
      toast({
        title: "Error saving profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-primary" />
          Doctor Profile
        </CardTitle>
        <CardDescription>
          Configure your professional details for patient consultations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="specialty">Specialty</Label>
            <Select
              value={profile.specialty}
              onValueChange={(value) => setProfile({ ...profile, specialty: value })}
            >
              <SelectTrigger id="specialty">
                <SelectValue placeholder="Select specialty" />
              </SelectTrigger>
              <SelectContent>
                {specialties.map((specialty) => (
                  <SelectItem key={specialty} value={specialty}>
                    {specialty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="experience">Years of Experience</Label>
            <Input
              id="experience"
              type="number"
              min="0"
              max="50"
              value={profile.experience_years}
              onChange={(e) =>
                setProfile({ ...profile, experience_years: parseInt(e.target.value) || 0 })
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fee">Consultation Fee (₹)</Label>
          <Input
            id="fee"
            type="number"
            min="0"
            step="50"
            value={profile.consultation_fee}
            onChange={(e) =>
              setProfile({ ...profile, consultation_fee: parseFloat(e.target.value) || 0 })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Professional Bio</Label>
          <Textarea
            id="bio"
            placeholder="Tell patients about your experience, qualifications, and areas of expertise..."
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            rows={4}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="available">Available for Consultations</Label>
            <p className="text-sm text-muted-foreground">
              Toggle off if you're temporarily unavailable
            </p>
          </div>
          <Switch
            id="available"
            checked={profile.is_available}
            onCheckedChange={(checked) => setProfile({ ...profile, is_available: checked })}
          />
        </div>

        <Button onClick={handleSave} disabled={loading} className="w-full bg-gradient-primary">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Profile
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
