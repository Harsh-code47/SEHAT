import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAllDoctors, DoctorProfile } from "@/hooks/useDoctorProfile";
import { createAppointment } from "@/hooks/useAppointments";
import { Video, Star, Clock, Calendar as CalendarIcon, Stethoscope, Activity, User, ExternalLink } from "lucide-react";
import { format } from "date-fns";

const timeSlots = [
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
  "06:00 PM",
];

const Consultancy = () => {
  const [user, setUser] = useState<any>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<(DoctorProfile & { full_name?: string }) | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [isBooking, setIsBooking] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bookedAppointment, setBookedAppointment] = useState<{ meetLink: string; date: string; time: string } | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { doctors, loading: doctorsLoading } = useAllDoctors();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });
  }, [navigate]);

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTime || !selectedDoctor || !user) {
      toast({
        title: "Please select date and time",
        description: "Choose your preferred appointment slot",
        variant: "destructive",
      });
      return;
    }

    setIsBooking(true);

    try {
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      
      const appointment = await createAppointment(
        user.id,
        selectedDoctor.id,
        formattedDate,
        selectedTime
      );

      setBookedAppointment({
        meetLink: appointment.google_meet_link || "",
        date: format(selectedDate, "PPP"),
        time: selectedTime,
      });

      toast({
        title: "Appointment Booked Successfully!",
        description: `Your consultation with Dr. ${selectedDoctor.full_name} is confirmed for ${format(selectedDate, "PPP")} at ${selectedTime}`,
      });

    } catch (error: any) {
      toast({
        title: "Booking Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsBooking(false);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedDate(undefined);
    setSelectedTime("");
    setBookedAppointment(null);
  };

  const getSpecialtyIcon = (specialty: string) => {
    return Stethoscope;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 text-gradient opacity-0 animate-fade-in-down">
              Online Consultancy
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto opacity-0 animate-fade-in-up animate-delay-200">
              Connect with experienced doctors from the comfort of your home. Book instant video consultations via Google Meet.
            </p>
          </div>

          {doctorsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Activity className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : doctors.length === 0 ? (
            <Card className="max-w-md mx-auto opacity-0 animate-scale-in">
              <CardContent className="p-8 text-center">
                <Stethoscope className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50 animate-pulse-soft" />
                <h3 className="text-lg font-semibold mb-2">No Doctors Available</h3>
                <p className="text-muted-foreground">
                  No doctors have registered yet. Check back soon!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctors.map((doctor, index) => {
                const IconComponent = getSpecialtyIcon(doctor.specialty);
                return (
                  <Card 
                    key={doctor.id} 
                    className="card-hover border-2 opacity-0 animate-fade-in-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center animate-pulse-soft">
                          <User className="h-8 w-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{doctor.full_name?.startsWith("Dr.") ? doctor.full_name : `Dr. ${doctor.full_name}`}</CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <IconComponent className="h-4 w-4" />
                            {doctor.specialty}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {doctor.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {doctor.bio}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-semibold">{doctor.rating || "New"}</span>
                          {doctor.total_reviews && doctor.total_reviews > 0 && (
                            <span className="text-muted-foreground">({doctor.total_reviews})</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {doctor.experience_years} years
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Badge variant={doctor.is_available ? "default" : "secondary"}>
                          {doctor.is_available ? "Available" : "Unavailable"}
                        </Badge>
                        <span className="font-bold text-primary">₹{doctor.consultation_fee}</span>
                      </div>

                      <Dialog open={dialogOpen && selectedDoctor?.id === doctor.id} onOpenChange={(open) => {
                        if (open) {
                          setSelectedDoctor(doctor);
                          setDialogOpen(true);
                        } else {
                          handleCloseDialog();
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button 
                            className="w-full bg-gradient-primary hover:opacity-90 hover-scale btn-press transition-all duration-200" 
                            disabled={!doctor.is_available}
                            onClick={() => setSelectedDoctor(doctor)}
                          >
                            <Video className="mr-2 h-4 w-4" />
                            Book Consultation
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          {bookedAppointment ? (
                            <>
                              <DialogHeader>
                                <DialogTitle className="text-center text-green-600">
                                  🎉 Appointment Confirmed!
                                </DialogTitle>
                                <DialogDescription className="text-center">
                                  Your consultation has been scheduled successfully.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-6">
                                <div className="bg-muted rounded-lg p-4 space-y-3">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Doctor</span>
                                    <span className="font-medium">{selectedDoctor?.full_name?.startsWith("Dr.") ? selectedDoctor.full_name : `Dr. ${selectedDoctor?.full_name}`}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Date</span>
                                    <span className="font-medium">{bookedAppointment.date}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Time</span>
                                    <span className="font-medium">{bookedAppointment.time}</span>
                                  </div>
                                </div>

                                <div className="bg-primary/10 rounded-lg p-4">
                                  <p className="text-sm font-medium mb-2">Your Google Meet Link:</p>
                                  <div className="flex items-center gap-2">
                                    <code className="flex-1 text-xs bg-background rounded px-2 py-1 break-all">
                                      {bookedAppointment.meetLink}
                                    </code>
                                    <Button
                                      size="sm"
                                      onClick={() => window.open(bookedAppointment.meetLink, "_blank")}
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>

                                <Button
                                  className="w-full bg-gradient-primary"
                                  onClick={() => window.open(bookedAppointment.meetLink, "_blank")}
                                >
                                  <Video className="mr-2 h-4 w-4" />
                                  Join Google Meet
                                </Button>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={handleCloseDialog} className="w-full">
                                  Close
                                </Button>
                              </DialogFooter>
                            </>
                          ) : (
                            <>
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center">
                                    <User className="h-6 w-6 text-white" />
                                  </div>
                                  <div>
                                    <div>{doctor.full_name?.startsWith("Dr.") ? doctor.full_name : `Dr. ${doctor.full_name}`}</div>
                                    <div className="text-sm font-normal text-muted-foreground">
                                      {doctor.specialty}
                                    </div>
                                  </div>
                                </DialogTitle>
                                <DialogDescription>
                                  Select your preferred date and time for the video consultation.
                                </DialogDescription>
                              </DialogHeader>

                              <div className="space-y-4 py-4">
                                <div>
                                  <label className="text-sm font-medium mb-2 block">
                                    <CalendarIcon className="h-4 w-4 inline mr-2" />
                                    Select Date
                                  </label>
                                  <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={setSelectedDate}
                                    disabled={(date) => date < new Date() || date > new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
                                    className="rounded-md border"
                                  />
                                </div>

                                <div>
                                  <label className="text-sm font-medium mb-2 block">
                                    <Clock className="h-4 w-4 inline mr-2" />
                                    Select Time Slot
                                  </label>
                                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Choose a time slot" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {timeSlots.map((slot) => (
                                        <SelectItem key={slot} value={slot}>
                                          {slot}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="bg-muted/50 rounded-lg p-4">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Consultation Fee</span>
                                    <span className="font-semibold">₹{doctor.consultation_fee}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    You will receive a Google Meet link after booking.
                                  </p>
                                </div>
                              </div>

                              <DialogFooter>
                                <Button
                                  onClick={handleBookAppointment}
                                  disabled={isBooking || !selectedDate || !selectedTime}
                                  className="w-full bg-gradient-primary hover:opacity-90"
                                >
                                  {isBooking ? (
                                    <>
                                      <Activity className="mr-2 h-4 w-4 animate-spin" />
                                      Booking...
                                    </>
                                  ) : (
                                    <>
                                      <Video className="mr-2 h-4 w-4" />
                                      Confirm & Get Meet Link
                                    </>
                                  )}
                                </Button>
                              </DialogFooter>
                            </>
                          )}
                        </DialogContent>
                      </Dialog>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          All Rights Reserved - SEHAT
        </div>
      </footer>
    </div>
  );
};

export default Consultancy;
