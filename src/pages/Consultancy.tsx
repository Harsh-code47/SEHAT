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
import { Video, Star, Clock, Calendar as CalendarIcon, Stethoscope, Brain, Heart, Bone, Eye, Baby } from "lucide-react";

const doctors = [
  {
    id: 1,
    name: "Dr. Priya Sharma",
    specialty: "General Physician",
    experience: "15 years",
    rating: 4.9,
    reviews: 284,
    availability: "Available Today",
    fee: "₹500",
    icon: Stethoscope,
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop&crop=face",
  },
  {
    id: 2,
    name: "Dr. Rajesh Kumar",
    specialty: "Cardiologist",
    experience: "20 years",
    rating: 4.8,
    reviews: 412,
    availability: "Available Tomorrow",
    fee: "₹800",
    icon: Heart,
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&crop=face",
  },
  {
    id: 3,
    name: "Dr. Ananya Patel",
    specialty: "Neurologist",
    experience: "12 years",
    rating: 4.7,
    reviews: 198,
    availability: "Available Today",
    fee: "₹750",
    icon: Brain,
    image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200&h=200&fit=crop&crop=face",
  },
  {
    id: 4,
    name: "Dr. Vikram Singh",
    specialty: "Orthopedic",
    experience: "18 years",
    rating: 4.9,
    reviews: 356,
    availability: "Available Today",
    fee: "₹700",
    icon: Bone,
    image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&h=200&fit=crop&crop=face",
  },
  {
    id: 5,
    name: "Dr. Meera Gupta",
    specialty: "Ophthalmologist",
    experience: "10 years",
    rating: 4.6,
    reviews: 145,
    availability: "Available Tomorrow",
    fee: "₹600",
    icon: Eye,
    image: "https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=200&h=200&fit=crop&crop=face",
  },
  {
    id: 6,
    name: "Dr. Sanjay Verma",
    specialty: "Pediatrician",
    experience: "14 years",
    rating: 4.8,
    reviews: 267,
    availability: "Available Today",
    fee: "₹550",
    icon: Baby,
    image: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200&h=200&fit=crop&crop=face",
  },
];

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
  const [selectedDoctor, setSelectedDoctor] = useState<typeof doctors[0] | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [isBooking, setIsBooking] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
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

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Please select date and time",
        description: "Choose your preferred appointment slot",
        variant: "destructive",
      });
      return;
    }

    setIsBooking(true);

    // Simulate booking process
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Generate Google Meet link (in production, this would integrate with Google Calendar API)
    const meetLink = `https://meet.google.com/sehat-${Date.now().toString(36)}`;

    toast({
      title: "Appointment Booked Successfully!",
      description: `Your consultation with ${selectedDoctor?.name} is confirmed for ${selectedDate.toLocaleDateString()} at ${selectedTime}`,
    });

    // Open Google Meet link
    window.open(meetLink, "_blank");

    setIsBooking(false);
    setDialogOpen(false);
    setSelectedDate(undefined);
    setSelectedTime("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              Online Consultancy
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Connect with experienced doctors from the comfort of your home. Book instant video consultations via Google Meet.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doctor) => {
              const IconComponent = doctor.icon;
              return (
                <Card key={doctor.id} className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
                  <CardHeader className="pb-4">
                    <div className="flex items-start gap-4">
                      <img
                        src={doctor.image}
                        alt={doctor.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                      />
                      <div className="flex-1">
                        <CardTitle className="text-lg">{doctor.name}</CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <IconComponent className="h-4 w-4" />
                          {doctor.specialty}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-semibold">{doctor.rating}</span>
                        <span className="text-muted-foreground">({doctor.reviews})</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {doctor.experience}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge variant={doctor.availability.includes("Today") ? "default" : "secondary"}>
                        {doctor.availability}
                      </Badge>
                      <span className="font-bold text-primary">{doctor.fee}</span>
                    </div>

                    <Dialog open={dialogOpen && selectedDoctor?.id === doctor.id} onOpenChange={(open) => {
                      setDialogOpen(open);
                      if (open) setSelectedDoctor(doctor);
                    }}>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-gradient-primary hover:opacity-90" onClick={() => setSelectedDoctor(doctor)}>
                          <Video className="mr-2 h-4 w-4" />
                          Book Consultation
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-3">
                            <img
                              src={doctor.image}
                              alt={doctor.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                            <div>
                              <div>{doctor.name}</div>
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
                              <span className="font-semibold">{doctor.fee}</span>
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
                              "Booking..."
                            ) : (
                              <>
                                <Video className="mr-2 h-4 w-4" />
                                Confirm & Join via Google Meet
                              </>
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          © 2025 SEHAT. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
};

export default Consultancy;
