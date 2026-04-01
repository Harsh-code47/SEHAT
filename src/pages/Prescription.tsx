import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Pill, Calendar, Clock, User, FileText, Download, RefreshCw } from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

// Mock prescription data
const mockPrescriptions = [
  {
    id: 1,
    doctorName: "Dr. Priya Sharma",
    specialty: "General Physician",
    date: "2025-01-10",
    diagnosis: "Viral Fever with Cold",
    status: "active",
    medications: [
      { name: "Paracetamol 500mg", dosage: "1 tablet", frequency: "3 times a day", duration: "5 days" },
      { name: "Cetirizine 10mg", dosage: "1 tablet", frequency: "Once at night", duration: "7 days" },
      { name: "Vitamin C 500mg", dosage: "1 tablet", frequency: "Once daily", duration: "14 days" },
    ],
    notes: "Take rest and drink plenty of fluids. Avoid cold beverages.",
  },
  {
    id: 2,
    doctorName: "Dr. Rajesh Kumar",
    specialty: "Cardiologist",
    date: "2025-01-05",
    diagnosis: "Mild Hypertension",
    status: "active",
    medications: [
      { name: "Amlodipine 5mg", dosage: "1 tablet", frequency: "Once daily", duration: "30 days" },
      { name: "Aspirin 75mg", dosage: "1 tablet", frequency: "Once daily after lunch", duration: "30 days" },
    ],
    notes: "Monitor blood pressure daily. Follow low-sodium diet. Schedule follow-up after 1 month.",
  },
  {
    id: 3,
    doctorName: "Dr. Ananya Patel",
    specialty: "Neurologist",
    date: "2024-12-20",
    diagnosis: "Tension Headache",
    status: "completed",
    medications: [
      { name: "Ibuprofen 400mg", dosage: "1 tablet", frequency: "When needed (max 3/day)", duration: "7 days" },
      { name: "Amitriptyline 10mg", dosage: "1 tablet", frequency: "Once at night", duration: "14 days" },
    ],
    notes: "Practice stress management. Maintain regular sleep schedule.",
  },
  {
    id: 4,
    doctorName: "Dr. Vikram Singh",
    specialty: "Orthopedic",
    date: "2024-12-15",
    diagnosis: "Lower Back Pain",
    status: "completed",
    medications: [
      { name: "Diclofenac 50mg", dosage: "1 tablet", frequency: "Twice daily after meals", duration: "7 days" },
      { name: "Thiocolchicoside 8mg", dosage: "1 tablet", frequency: "Twice daily", duration: "5 days" },
      { name: "Calcium + Vitamin D3", dosage: "1 tablet", frequency: "Once daily", duration: "30 days" },
    ],
    notes: "Physiotherapy recommended. Avoid heavy lifting. Use hot compress.",
  },
];

const Prescription = () => {
  const [user, setUser] = useState<any>(null);
  const [prescriptions] = useState(mockPrescriptions);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });
  }, [navigate]);

  const activePrescriptions = prescriptions.filter((p) => p.status === "active");
  const completedPrescriptions = prescriptions.filter((p) => p.status === "completed");

  const handleDownloadPrescription = useCallback((prescription: typeof mockPrescriptions[0]) => {
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      let y = 20;

      // Header
      pdf.setFontSize(20);
      pdf.setTextColor(41, 128, 185);
      pdf.text("SEHAT - Prescription", pageWidth / 2, y, { align: "center" });
      y += 12;

      pdf.setDrawColor(41, 128, 185);
      pdf.setLineWidth(0.5);
      pdf.line(15, y, pageWidth - 15, y);
      y += 10;

      // Doctor Info
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text(prescription.doctorName, 15, y);
      y += 7;
      pdf.setFontSize(11);
      pdf.setTextColor(100, 100, 100);
      pdf.text(prescription.specialty, 15, y);
      y += 7;
      pdf.text(`Date: ${new Date(prescription.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`, 15, y);
      y += 7;
      pdf.text(`Status: ${prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}`, 15, y);
      y += 12;

      // Diagnosis
      pdf.setFontSize(13);
      pdf.setTextColor(41, 128, 185);
      pdf.text("Diagnosis", 15, y);
      y += 7;
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      pdf.text(prescription.diagnosis, 15, y);
      y += 12;

      // Medications Table
      pdf.setFontSize(13);
      pdf.setTextColor(41, 128, 185);
      pdf.text("Medications", 15, y);
      y += 8;

      // Table header
      pdf.setFillColor(240, 240, 240);
      pdf.rect(15, y - 5, pageWidth - 30, 8, "F");
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont("helvetica", "bold");
      pdf.text("Medicine", 17, y);
      pdf.text("Dosage", 80, y);
      pdf.text("Frequency", 115, y);
      pdf.text("Duration", 160, y);
      y += 8;

      pdf.setFont("helvetica", "normal");
      prescription.medications.forEach((med) => {
        pdf.setFontSize(10);
        pdf.text(med.name, 17, y);
        pdf.text(med.dosage, 80, y);
        pdf.text(med.frequency, 115, y);
        pdf.text(med.duration, 160, y);
        y += 7;
      });
      y += 5;

      // Notes
      if (prescription.notes) {
        pdf.setFontSize(13);
        pdf.setTextColor(41, 128, 185);
        pdf.text("Doctor's Notes", 15, y);
        y += 7;
        pdf.setFontSize(11);
        pdf.setTextColor(0, 0, 0);
        const noteLines = pdf.splitTextToSize(prescription.notes, pageWidth - 30);
        pdf.text(noteLines, 15, y);
        y += noteLines.length * 6 + 10;
      }

      // Footer
      pdf.setDrawColor(200, 200, 200);
      pdf.line(15, y, pageWidth - 15, y);
      y += 8;
      pdf.setFontSize(9);
      pdf.setTextColor(150, 150, 150);
      pdf.text("Generated by SEHAT Health Platform", pageWidth / 2, y, { align: "center" });

      pdf.save(`prescription-${prescription.doctorName.replace(/\s+/g, '-')}-${prescription.date}.pdf`);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
    }
  }, []);

  const PrescriptionCard = ({ prescription }: { prescription: typeof mockPrescriptions[0] }) => {
    const cardRef = useRef<HTMLDivElement>(null);

    return (
      <Card className="hover:shadow-lg transition-all duration-300">
        <div ref={cardRef}>
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  {prescription.doctorName}
                </CardTitle>
                <CardDescription>{prescription.specialty}</CardDescription>
              </div>
              <Badge variant={prescription.status === "active" ? "default" : "secondary"}>
                {prescription.status === "active" ? "Active" : "Completed"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(prescription.date).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-sm font-medium text-primary mb-1">Diagnosis</div>
              <div className="text-sm">{prescription.diagnosis}</div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium flex items-center gap-2">
                <Pill className="h-4 w-4 text-primary" />
                Medications ({prescription.medications.length})
              </div>
              <div className="space-y-2">
                {prescription.medications.map((med, index) => (
                  <div key={index} className="bg-card border rounded-lg p-3 space-y-1">
                    <div className="font-medium text-sm">{med.name}</div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {med.dosage}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {med.frequency}
                      </span>
                      <span className="flex items-center gap-1">
                        <RefreshCw className="h-3 w-3" />
                        {med.duration}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {prescription.notes && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <div className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-1 flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  Doctor's Notes
                </div>
                <div className="text-sm text-muted-foreground">{prescription.notes}</div>
              </div>
            )}
          </CardContent>
        </div>

        <CardContent className="pt-0">
          <Button
            data-download-btn
            variant="outline"
            className="w-full"
            onClick={() => handleDownloadPrescription(prescription, cardRef.current)}
          >
            <Download className="mr-2 h-4 w-4" />
            Download Prescription
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              My Prescriptions
            </h1>
            <p className="text-muted-foreground text-lg">
              View and manage all your prescriptions from consultations
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-primary">{prescriptions.length}</div>
                <div className="text-sm text-muted-foreground">Total Prescriptions</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-green-500">{activePrescriptions.length}</div>
                <div className="text-sm text-muted-foreground">Active</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-muted-foreground">{completedPrescriptions.length}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-primary">
                  {prescriptions.reduce((sum, p) => sum + p.medications.length, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Medications</div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="active">
                Active ({activePrescriptions.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({completedPrescriptions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {activePrescriptions.length > 0 ? (
                activePrescriptions.map((prescription) => (
                  <PrescriptionCard key={prescription.id} prescription={prescription} />
                ))
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Active Prescriptions</h3>
                    <p className="text-muted-foreground">
                      You don't have any active prescriptions at the moment.
                    </p>
                    <Button className="mt-4 bg-gradient-primary" onClick={() => navigate("/consultancy")}>
                      Book a Consultation
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {completedPrescriptions.length > 0 ? (
                completedPrescriptions.map((prescription) => (
                  <PrescriptionCard key={prescription.id} prescription={prescription} />
                ))
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Completed Prescriptions</h3>
                    <p className="text-muted-foreground">
                      Your completed prescriptions will appear here.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
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

export default Prescription;
