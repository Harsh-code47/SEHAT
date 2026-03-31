import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import BMICalculator from "./pages/BMICalculator";
import ReportAnalyzer from "./pages/ReportAnalyzer";
import Consultancy from "./pages/Consultancy";
import Prescription from "./pages/Prescription";
import DoctorAppointments from "./pages/DoctorAppointments";
import DoctorPatients from "./pages/DoctorPatients";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/bmi-calculator" element={<BMICalculator />} />
            <Route path="/report-analyzer" element={<ReportAnalyzer />} />
            <Route path="/consultancy" element={<Consultancy />} />
            <Route path="/prescription" element={<Prescription />} />
            <Route path="/doctor/appointments" element={<DoctorAppointments />} />
            <Route path="/doctor/patients" element={<DoctorPatients />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
